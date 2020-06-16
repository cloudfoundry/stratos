package helm

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"reflect"
	"strings"

	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/release"
	appsv1 "k8s.io/api/apps/v1"
	appsv1beta1 "k8s.io/api/apps/v1beta1"
	appsv1beta2 "k8s.io/api/apps/v1beta2"
	batchv1 "k8s.io/api/batch/v1"
	v1 "k8s.io/api/core/v1"
	extv1beta1 "k8s.io/api/extensions/v1beta1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes/scheme"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

var resourcesWithoutStatus = map[string]bool{
	"RoleBinding": false,
	"Role":        false,
}

// HelmRelease represents a Helm Release deployed via Helm
type HelmRelease struct {
	*release.Release
	Endpoint       string                     `json:"-"`
	User           string                     `json:"-"`
	Resources      map[string]KubeResource    `json:"resources"`
	Jobs           []KubeResourceJob          `json:"-"`
	PodJobs        map[string]KubeResourceJob `json:"-"`
	ManifestErrors bool                       `json:"-"`
}

// KubeResource is a simple struct to pull out core common metadata for a Kube resource
type KubeResource struct {
	Kind       string `yaml:"kind" json:"kind"`
	APIVersion string `yaml:"apiVersion" json:"apiVersion"`
	Metadata   struct {
		Name string `yaml:"name" json:"name"`
	} `yaml:"metadata" json:"metadata"`
	Resource interface{} `yaml:"resource"`
	Manifest bool
}

func (r *KubeResource) getID() string {
	return fmt.Sprintf("%s-%s-%s", r.Kind, r.APIVersion, r.Metadata.Name)
}

// NewHelmRelease represents extended info about a Helm Release
func NewHelmRelease(info *release.Release, endpoint, user string) *HelmRelease {
	r := &HelmRelease{
		Release:  info,
		Endpoint: endpoint,
		User:     user,
	}
	r.Resources = make(map[string]KubeResource)
	r.PodJobs = make(map[string]KubeResourceJob)
	r.parseManifest()
	return r
}

// Parse the release manifest from the Helm release
func (r *HelmRelease) parseManifest() {
	r.ManifestErrors = false
	reader := bytes.NewReader([]byte(r.Manifest))
	buffer := bufio.NewReader(reader)
	var bufr strings.Builder
	for {
		line, err := buffer.ReadString('\n')
		if err != nil || (err == nil && strings.TrimSpace(line) == "---") {
			data := []byte(bufr.String())
			if len(data) > 0 {
				decode := scheme.Codecs.UniversalDeserializer().Decode
				obj, _, err := decode([]byte(bufr.String()), nil, nil)
				if err != nil {
					log.Error(fmt.Sprintf("Helm Manifest Parser: Error while decoding YAML object. Err was: %s", err))
					r.ManifestErrors = true
				} else {
					r.processResource(obj)
				}

				bufr.Reset()
				line = ""
			}
		}

		if err != nil {
			break
		}
		bufr.WriteString(line)
	}
}

func getResourceIdentifier(typeMeta metav1.TypeMeta, objectMeta metav1.ObjectMeta) string {
	return fmt.Sprintf("%s-%s-%s", typeMeta.Kind, typeMeta.APIVersion, objectMeta.Name)
}

func (r *HelmRelease) setResource(res KubeResource) {
	r.Resources[res.getID()] = res
}
func (r *HelmRelease) deleteResource(res KubeResource) {
	delete(r.Resources, res.getID())
}

// GetResources gets all fo the resources for the release
func (r *HelmRelease) GetResources() []interface{} {
	var resources []interface{}
	for _, res := range r.Resources {
		resources = append(resources, res.Resource)
	}
	return resources
}

// GetPods gets the pod resources for the release
func (r *HelmRelease) GetPods() []interface{} {
	var resources []interface{}
	for _, res := range r.Resources {
		if res.Kind == "Pod" {
			resources = append(resources, res.Resource)
		}
	}
	return resources
}

// process a yaml resource from the helm manifest
func (r *HelmRelease) processResource(obj runtime.Object) {
	j, err := json.Marshal(obj)
	if err == nil {
		var t KubeResource
		if json.Unmarshal(j, &t) == nil {
			t.Resource = obj
			t.Manifest = true
			r.setResource(t)
			log.Debugf("Got resource: %s : %s", t.Kind, t.Metadata.Name)
			r.processController(t)
			r.addJobForResource(t.Kind, t.APIVersion, t.Metadata.Name)
		} else {
			log.Error("Helm Release Manifest: Could not parse Kubernetes resource")
		}
	}
}

func (r *HelmRelease) addJobForResource(kind, apiVersion, name string) {
	job := KubeResourceJob{
		ID:         fmt.Sprintf("%s-%s#Pods", kind, name),
		Endpoint:   r.Endpoint,
		User:       r.User,
		Namespace:  r.Namespace,
		Name:       name,
		URL:        getRestURL(r.Namespace, kind, apiVersion, name),
		APIVersion: apiVersion,
		Kind:       kind,
	}
	r.Jobs = append(r.Jobs, job)
}

func (r *HelmRelease) processController(kres KubeResource) {
	switch o := kres.Resource.(type) {
	case *appsv1.Deployment:
		r.processPodSelector(kres, o.Spec.Selector)
	case *appsv1beta1.Deployment:
		r.processPodSelector(kres, o.Spec.Selector)
	case *appsv1beta2.Deployment:
		r.processPodSelector(kres, o.Spec.Selector)
	case *extv1beta1.Deployment:
		r.processPodSelector(kres, o.Spec.Selector)
	case *appsv1.StatefulSet:
		r.processPodSelector(kres, o.Spec.Selector)
	case *appsv1beta2.StatefulSet:
		r.processPodSelector(kres, o.Spec.Selector)
	case *appsv1beta1.StatefulSet:
		r.processPodSelector(kres, o.Spec.Selector)
	case *appsv1.DaemonSet:
		r.processPodSelector(kres, o.Spec.Selector)
	case *batchv1.Job:
		r.processPodSelector(kres, o.Spec.Selector)
	default:
		// Ignore - not a controller
		log.Debugf("Ignoring: non-controller type: %s", reflect.TypeOf(o))
	}
}

func (r *HelmRelease) processPodSelector(kres KubeResource, selector *metav1.LabelSelector) {
	if selector == nil {
		return
	}

	qs := podSelectorToQueryString(selector)

	// Add a job to get the pods in this deployment
	job := KubeResourceJob{
		ID:        fmt.Sprintf("%s-%s#Pods", kres.Kind, kres.Metadata.Name),
		Parent:    fmt.Sprintf("%s-%s", kres.Kind, kres.Metadata.Name),
		URL:       fmt.Sprintf("/api/v1/namespaces/%s/pods%s", r.Namespace, qs),
		Endpoint:  r.Endpoint,
		User:      r.User,
		Namespace: r.Namespace,
	}
	r.PodJobs[job.ID] = job
}

// UpdatePods will run the jobs needed to get the pods
// This uses the selectors to find the pods - so new pods should be picked up
func (r *HelmRelease) UpdatePods(jetstream interfaces.PortalProxy) {
	var jobs []KubeResourceJob
	for _, job := range r.PodJobs {
		jobs = append(jobs, job)
	}

	pods := make(map[string]*KubeResource)

	runner := NewKubeAPIJob(jetstream, jobs)
	res := runner.Run()
	for _, j := range res {
		var list v1.PodList
		err := json.Unmarshal(j.Data, &list)
		if err == nil {
			for _, pod := range list.Items {
				// Add a kube resource for the pod
				res := KubeResource{
					Kind:       "Pod",
					APIVersion: "v1",
				}
				res.Metadata.Name = pod.Name
				res.Manifest = false

				podCopy := &v1.Pod{}
				*podCopy = pod
				res.Resource = podCopy
				pods[res.getID()] = &res

				r.setResource(res)
				r.processPodOwners(pod)
			}
		}
	}

	// Now remove all pods that have not just been retrieved
	// These are stale pods
	for _, res := range r.Resources {
		_, exists := pods[res.getID()]
		if res.Kind == "Pod" && !exists {
			r.deleteResource(res)
		}
	}
}

// Pods can be owned by a ReplicaSet - these are not represented in the manifest, as they
// are created as part of the Deployment resource
// Look through the pod and add the ReplicaSets to the manifest
func (r *HelmRelease) processPodOwners(pod v1.Pod) {
	for _, owner := range pod.ObjectMeta.OwnerReferences {
		if owner.Kind == "ReplicaSet" {
			// This is an incompelte ReplicaSet, but enough for us to use to go get more metadata
			resource := appsv1.ReplicaSet{}
			resource.TypeMeta = metav1.TypeMeta{
				Kind:       owner.Kind,
				APIVersion: owner.APIVersion,
			}
			resource.ObjectMeta = metav1.ObjectMeta{
				Name:      owner.Name,
				Namespace: r.Namespace,
			}
			identifier := getResourceIdentifier(resource.TypeMeta, resource.ObjectMeta)
			if _, ok := r.Resources[identifier]; !ok {
				// Create a Kube Resource for the ReplicaSet
				res := KubeResource{
					Kind:       resource.Kind,
					APIVersion: resource.APIVersion,
				}
				res.Metadata.Name = resource.Name
				res.Manifest = false
				res.Resource = &resource
				r.setResource(res)

				r.addJobForResource(owner.Kind, owner.APIVersion, owner.Name)
			}
		} else {
			log.Debugf("Unexpected Pod owner kind: %s", owner.Kind)
		}
	}
}

// func (r *HelmRelease) getKubeResource(typeMeta metav1.TypeMeta, objectMeta metav1.ObjectMeta) KubeResource {
// 	kres := KubeResource{
// 		Kind:       typeMeta.Kind,
// 		APIVersion: typeMeta.APIVersion,
// 	}
// 	kres.Metadata.Name = objectMeta.Name
// 	return kres
// }

func (r *HelmRelease) UpdateResources(jetstream interfaces.PortalProxy) {
	// This will be an array of resources
	runner := NewKubeAPIJob(jetstream, r.Jobs)
	res := runner.Run()
	for _, j := range res {

		// Add a kube resource
		res := KubeResource{
			Kind:       j.Kind,
			APIVersion: j.APIVersion,
		}
		res.Metadata.Name = j.Name

		// TODO: If the status was 404, then we should remove the resource
		if j.StatusCode == http.StatusNotFound {
			log.Debugf("Resource has been deleted - removing: %s -> %s", j.Kind, j.Name)
			r.deleteResource(res)
		}

		// Manifest should carry over - indicates if the resource was in the Helm manifest
		// Pods are an example of a reosurce which is not in the manifest
		if existing, ok := r.Resources[res.getID()]; ok {
			res.Manifest = existing.Manifest
		} else {
			res.Manifest = false
		}

		decode := scheme.Codecs.UniversalDeserializer().Decode
		obj, _, err := decode(j.Data, nil, nil)
		if err == nil {
			res.Resource = obj
			r.setResource(res)
		} else {
			log.Error("Could not parse resource")
		}

		// TODO: If the resource was a job, process the selector again
		r.processController(res)
	}
}

func getRestURL(namespace, kind, apiVersion, name string) string {
	var restURL string
	base := "api"
	if len(strings.Split(apiVersion, "/")) > 1 {
		base = "apis"

		v, ok := resourcesWithoutStatus[kind]
		if !ok || v {
			name += "/status"
		}
	}
	restURL = fmt.Sprintf("/%s/%s/namespaces/%s/%ss/%s", base, apiVersion, namespace, strings.ToLower(kind), name)
	return restURL
}

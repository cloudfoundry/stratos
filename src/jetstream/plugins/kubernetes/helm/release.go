package helm

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"

	"reflect"

	//	"io"
	"strings"

	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/release"
	appsv1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"

	// kyaml "k8s.io/apimachinery/pkg/util/yaml"
	"k8s.io/client-go/kubernetes/scheme"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

type HelmRelease struct {
	*release.Release
	Endpoint      string            `json:"-"`
	User          string            `json:"-"`
	Extra         string            `json:"extra"`
	HelmManifest  []runtime.Object  `json:"helmManifest"`
	Resources     []interface{}     `json:"resources"`
	KubeResources []KubeResource    `json:"-"`
	ResourceNames map[string]bool   `json:"-"`
	Jobs          []KubeResourceJob `json:"-"`
	PodJobs       []KubeResourceJob `json:"-"`
}

type KubeResource struct {
	Kind       string `yaml:"kind" json:"kind"`
	APIVersion string `yaml:"apiVersion" json:"apiVersion"`
	Metadata   struct {
		Name string `yaml:"name" json:"name"`
	} `yaml:"metadata" json:"metadata"`
	Spec interface{} `yaml:"spec"`
}

// type KubeLabelSelectorRequirement struct {
// 	Key      string                       `yaml:"key"`
// 	Operator metav1.LabelSelectorOperator `yaml:"operator"`
// 	Values   []string                     `yaml:values"`
// }

// type KubeDeploymentResource struct {
// 	Spec struct {
// 		Selector struct {
// 			MatchLabels map[string]string `yaml:"matchLabels"`
// 			// matchExpressions is a list of label selector requirements. The requirements are ANDed.
// 			// +optional
// 			MatchExpressions []KubeLabelSelectorRequirement `yaml:"matchExpressions"`
// 		} `yaml:"selector"`
// 	} `yaml:"spec"`
// }

// KubeResourceJob = Resource(s) that we need to go and fetch
type KubeResourceJob struct {
	ID         string
	Kind       string
	APIVersion string
	Name       string
	Namespace  string
	Endpoint   string
	User       string
	URL        string
	Parent     string
}

// KubeResourceJobResult is the result from a job
type KubeResourceJobResult struct {
	KubeResourceJob
	StatusCode int
	Data       json.RawMessage
}

// NewHelmRelease represents extended info about a Helm Release
func NewHelmRelease(info *release.Release, endpoint, user string) *HelmRelease {
	r := &HelmRelease{
		Release:  info,
		Endpoint: endpoint,
		User:     user,
	}
	r.ResourceNames = make(map[string]bool)
	r.HelmManifest = make([]runtime.Object, 0)
	r.KubeResources = make([]KubeResource, 0)

	r.parseManifest()
	return r
}

func (r *HelmRelease) parseManifest() {
	// Parse the release manifest from the Helm release
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
					log.Error(fmt.Sprintf("Error while decoding YAML object. Err was: %s", err))
				} else {
					r.processResource(obj)

					// // TODO: Should be an easier way of doing this?
					// j, err := json.Marshal(obj)
					// if err != nil {
					// 	log.Info("Can not marshal to JSON")
					// } else {
					// 	log.Info("CAN MARSHAL TO JSON")
					// 	var t KubeResource
					// 	if json.Unmarshal(j, &t) == nil {
					// 		log.Warn("YES - GOT IT AS A KUBE RESOURCE")
					// 		log.Warn(t.Metadata.Name)
					// 	} else {
					// 		log.Error("NO GO")
					// 	}
					// }
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

func getResourceId(kind, apiVersion, name string) string {
	return fmt.Sprintf("%s-%s-%s", kind, apiVersion, name)
}

// process a yaml resource from the helm manifest
func (r *HelmRelease) processResource(obj runtime.Object) {

	r.HelmManifest = append(r.HelmManifest, obj)
	r.Resources = append(r.Resources, obj)

	// TODO: Should be an easier way of doing this?
	j, err := json.Marshal(obj)
	if err == nil {
		log.Info("CAN MARSHAL TO JSON")
		var t KubeResource
		if json.Unmarshal(j, &t) == nil {
			r.KubeResources = append(r.KubeResources, t)
			log.Infof("Got resource: %s : %s", t.Kind, t.Metadata.Name)

			if t.Kind == "Deployment" || t.Kind == "StatefulSet" || t.Kind == "DaemonSet" {
				log.Warnf("Getting selectors for %s", t.Kind)
				r.processDeployment(t, obj)
			}
			r.addJobForResource(t.Kind, t.APIVersion, t.Metadata.Name)
		} else {
			log.Error("NO GO")
		}
	}
}

// func (r *HelmRelease) addJobForResource(t KubeResource) {
// 	job := KubeResourceJob{
// 		ID:         fmt.Sprintf("%s-%s#Pods", t.Kind, t.Metadata.Name),
// 		Endpoint:   r.Endpoint,
// 		User:       r.User,
// 		Namespace:  r.Namespace,
// 		Name:       t.Metadata.Name,
// 		URL:        getRestURL(r.Namespace, t),
// 		APIVersion: t.APIVersion,
// 		Kind:       t.Kind,
// 	}
// 	r.Jobs = append(r.Jobs, job)
// }

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

func (r *HelmRelease) processDeployment(kres KubeResource, obj runtime.Object) {
	switch o := obj.(type) {
	case *appsv1.Deployment:
		log.Warn("Deployment")
		log.Info(o.Spec.Selector)
		r.processPodSelector(kres, o.Spec.Selector)
	case *appsv1.StatefulSet:
		log.Warn("Statefulset")
		r.processPodSelector(kres, o.Spec.Selector)
	case *appsv1.DaemonSet:
		log.Warn("DaemonSet")
		r.processPodSelector(kres, o.Spec.Selector)
	default:
		// Ignore
	}
}

func (r *HelmRelease) processPodSelector(kres KubeResource, selector *metav1.LabelSelector) {
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

	r.PodJobs = append(r.PodJobs, job)
}

// See: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/
func podSelectorToQueryString(selector *metav1.LabelSelector) string {

	qs := "?labelSelector="
	ml := ""
	sep := ""

	// Match labels
	for k, v := range selector.MatchLabels {
		fmt.Printf("key[%s] value[%s]\n", k, v)
		if len(ml) > 0 {
			sep = ","
		}

		ml = fmt.Sprintf("%s%s%s%%3D%s", ml, sep, k, v)
	}

	// Now add set based match expressions
	for _, v := range selector.MatchExpressions {
		if len(ml) > 0 {
			sep = ","
		}
		ml = fmt.Sprintf("%s%s%s+%s+%%28%s%%s29", ml, sep, v.Key, v.Operator, strings.Join(v.Values, "%%2C"))
	}

	if len(ml) > 0 {
		return fmt.Sprintf("%s%s", qs, ml)
	}

	return ""
}

func (r *HelmRelease) GetPods(jetstream interfaces.PortalProxy) []v1.Pod {
	var podList []v1.Pod

	// This will be an array of pod lists
	res := r.runJobs(jetstream, r.PodJobs)
	for _, j := range res {
		var list v1.PodList
		err := json.Unmarshal(j.Data, &list)
		if err == nil {
			for _, pod := range list.Items {
				log.Info(reflect.TypeOf(pod))
				// Add a kube resource for the pod
				res := KubeResource{
					Kind: pod.Kind,
					APIVersion: pod.APIVersion,
				}
				res.Metadata.Name = pod.Name
				log.Info("POD")
				log.Infof("%+v", res)
				r.KubeResources = append(r.KubeResources, res)
				r.Resources = append(r.Resources, &res)
				podList = append(podList, pod)
				r.processPodOwners(pod)
			}
		}
	}

	return podList
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
			if _, ok := r.ResourceNames[identifier]; !ok {
				r.Resources = append(r.Resources, &resource)
				//r.HelmResources = append(r.HelmResources, resource)

				r.ResourceNames[identifier] = true
				r.KubeResources = append(r.KubeResources, r.getKubeResource(resource.TypeMeta, resource.ObjectMeta))

				// TODO: Need a KubeResource
				r.addJobForResource(owner.Kind, owner.APIVersion, owner.Name)
			}
		} else {
			log.Warn("Unexpected Pod owner kind: %s", owner.Kind)
		}
	}
}

func (r *HelmRelease) getKubeResource(typeMeta metav1.TypeMeta, objectMeta metav1.ObjectMeta) KubeResource {
	kres := KubeResource{
		Kind:       typeMeta.Kind,
		APIVersion: typeMeta.APIVersion,
	}
	kres.Metadata.Name = objectMeta.Name
	return kres
}

func (r *HelmRelease) GetResources(jetstream interfaces.PortalProxy) []json.RawMessage {
	var resourceList []json.RawMessage

	// This will be an array of resources
	res := r.runJobs(jetstream, r.Jobs)
	for _, j := range res {
		resourceList = append(resourceList, j.Data)
	}

	return resourceList
}

func (r *HelmRelease) runJobs(jetstream interfaces.PortalProxy, jobs []KubeResourceJob) []KubeResourceJobResult {
	count := len(jobs)
	var res []KubeResourceJobResult

	kubeJobs := make(chan KubeResourceJob, count)
	kubeResults := make(chan KubeResourceJobResult, count)

	for w := 1; w <= 4; w++ {
		go r.restWorker(jetstream, w, kubeJobs, kubeResults)
	}

	for _, j := range jobs {
		kubeJobs <- j
	}

	close(kubeJobs)

	var v KubeResourceJobResult

	for a := 1; a <= count; a++ {
		v = <-kubeResults
		res = append(res, v)
	}

	return res
}

func (r *HelmRelease) restWorker(jetstream interfaces.PortalProxy, id int, jobs <-chan KubeResourceJob, results chan<- KubeResourceJobResult) {
	for j := range jobs {
		response, err := jetstream.DoProxySingleRequest(j.Endpoint, j.User, "GET", j.URL, nil, nil)
		log.Info(response.StatusCode)
		res := KubeResourceJobResult{
			KubeResourceJob: j,
			StatusCode:      response.StatusCode,
			Data:            json.RawMessage(response.Response),
		}

		if err != nil {
			log.Error("COULD NOT MAKE API REQUEST")
		}
		results <- res
	}
}

func getRestURL(namespace, kind, apiVersion, name string) string {
	var restURL string
	base := "api"
	if len(strings.Split(apiVersion, "/")) > 1 {
		base = "apis"
		name += "/status"
	}
	restURL = fmt.Sprintf("/%s/%s/namespaces/%s/%ss/%s", base, apiVersion, namespace, strings.ToLower(kind), name)
	return restURL
}

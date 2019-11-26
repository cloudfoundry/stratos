package helm

import (
	"fmt"

	"reflect"

	log "github.com/sirupsen/logrus"
	appsv1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type HelmReleaseGraph struct {
	Release *HelmRelease           `json:"-"`
	Nodes   map[string]ReleaseNode `json:"nodes"`
	Links   map[string]ReleaseLink `json:"links"`
}

type ReleaseNode struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Data  struct {
		Kind   string `json:"kind"`
		Status string `json:"status"`
	} `json:"data"`
}

type ReleaseLink struct {
	ID     string `json:"id"`
	Source string `json:"source"`
	Target string `json:"target"`
}

// NewHelmReleaseGraph represents graph of the Helm Release
func NewHelmReleaseGraph(release *HelmRelease) *HelmReleaseGraph {
	r := &HelmReleaseGraph{
		Release: release,
	}
	r.Nodes = make(map[string]ReleaseNode)
	r.Links = make(map[string]ReleaseLink)
	return r
}

func (r *HelmReleaseGraph) AddLink(source, target string) {
	link := ReleaseLink{
		ID:     fmt.Sprintf("%s->%s", source, target),
		Source: source,
		Target: target,
	}
	r.Links[link.ID] = link
	log.Warnf("Adding link %s -> %s", source, target)
}

// ParseManifest
func (r *HelmReleaseGraph) ParseManifest(release *HelmRelease) {

	log.Warnf("Graph:: Parse ManifestL %d", len(release.KubeResources))

	for _, item := range release.KubeResources {
		log.Warn(item.Kind)

		node := ReleaseNode{
			ID:    fmt.Sprintf("%s-%s", item.Kind, item.Metadata.Name),
			Label: item.Metadata.Name,
		}

		node.Data.Kind = item.Kind
		node.Data.Status = "unknown"

		// Add or replace the node in the map
		r.Nodes[node.ID] = node

		// if item.Kind == "Deployment" {
		// 	log.Info("Parsing deployment")
		// 	log.Infof("%+v", item.Spec)

		// 	// Covnert the spec back to json
		// 	js, err := json.Marshal(item.Spec)
		// 	if err != nil {
		// 		log.Error("Can not marhsal deployment")
		// 	} else {
		// 		log.Warn(string(js))
		// 	}
		// }
	}

	log.Info(len(release.Resources))

	// Now go through the pods and generate relationships
	for _, obj := range release.Resources {

		switch o := obj.(type) {
		case *appsv1.Deployment:
			log.Warnf("Deployment %s", o.Name)
			target := getResourceId(o.Kind, o.APIVersion, o.Name)
			r.ParseResourceOwners(target, o.OwnerReferences)
		case *appsv1.ReplicaSet:
			log.Warnf("ReplicaSet %s", o.Name)
			target := getResourceId(o.Kind, o.APIVersion, o.Name)
			r.ParseResourceOwners(target, o.OwnerReferences)
		case *v1.Pod:
			log.Warnf("Pod %s", o.Name)
			target := getResourceId(o.Kind, o.APIVersion, o.Name)
			r.ParseResourceOwners(target, o.OwnerReferences)
		default:
			log.Info(reflect.TypeOf(o))

		}
	}

	log.Warn("End parse graph")

}

func (r *HelmReleaseGraph) ParseResourceOwners(id string, owners []metav1.OwnerReference) {

	// We've got a pod, so associate it with its owner(s)
	//objMeta.OwnerReferences

	for _, owner := range owners {
		source := getResourceId(owner.Kind, owner.APIVersion, owner.Name)

		r.AddLink(source, id)
	}

}

func (r *HelmReleaseGraph) ParsePodSpec(spec *v1.PodSpec, objMeta *metav1.ObjectMeta) {

	// We've got a pod, so associate it with its owner(s)
	if objMeta != nil {
		//objMeta.OwnerReferences

	}

}

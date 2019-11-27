package helm

import (
	"fmt"

	"reflect"
	"strings"

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
		Status NodeStatus `json:"status"`
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
		ID:     fmt.Sprintf("%s_to_%s", source, target),
		Source: source,
		Target: target,
	}
	r.Links[link.ID] = link
	log.Warnf("Adding link %s -> %s", source, target)
}

// ParseManifest
func (r *HelmReleaseGraph) ParseManifest(release *HelmRelease) {

	log.Warnf("Graph:: Parse ManifestL %d", len(release.Resources))

	for _, item := range release.Resources {
		log.Warn(item.Kind)

		node := ReleaseNode{
			ID:    fmt.Sprintf("%s-%s", item.Kind, item.Metadata.Name),
			Label: item.Metadata.Name,
		}

		node.Data.Kind = item.Kind
		node.Data.Status = "unknown"

		switch o := item.Resource.(type) {
		case *appsv1.Deployment:
			target := getShortResourceId(o.Kind, o.Name)
			r.ParseResourceOwners(target, o.OwnerReferences)
		case *appsv1.ReplicaSet:
			target := getShortResourceId(o.Kind, o.Name)
			r.ParseResourceOwners(target, o.OwnerReferences)
			node.Data.Status = mapReplicaSetStatus(o.Status)
		case *v1.Pod:
			target := getShortResourceId(item.Kind, o.Name)
			r.ParseResourceOwners(target, o.OwnerReferences)
			r.ProcessPod(target, item, o.Spec, o.Status)
			node.Data.Status = mapPodStatus(o.Status.Phase)
		case *v1.Service:
			target := getShortResourceId(item.Kind, o.Name)
			r.ProcessService(target, item, o.Spec)
		default:
			log.Info(reflect.TypeOf(o))
		}

		// Add or replace the node in the map
		r.Nodes[node.ID] = node
	}

	// Make sure all links have nodes
	for _, link := range r.Links {
		if _, ok := r.Nodes[link.Source]; !ok {
			r.generateTemporaryNode(link.Source)
		}
		if _, ok := r.Nodes[link.Target]; !ok {
			r.generateTemporaryNode(link.Target)
		}
	}

	log.Warn("End parse graph")
}

func (r *HelmReleaseGraph) generateTemporaryNode(id string) {
	var parts = strings.Split(id, "-")

	node := ReleaseNode{
		ID:    id,
		Label: parts[1],
	}

	node.Data.Kind = parts[0]
	node.Data.Status = "missing"

	r.Nodes[node.ID] = node
}

func getShortResourceId(kind, name string) string {
	// // TODO: FIX
	// if len(kind) == 0 {
	// 	kind = "Pod"
	// }
	return fmt.Sprintf("%s-%s", kind, name)
}

func (r *HelmReleaseGraph) ParseResourceOwners(id string, owners []metav1.OwnerReference) {
	// We've got a pod, so associate it with its owner(s)
	//objMeta.OwnerReferences
	for _, owner := range owners {
		source := getShortResourceId(owner.Kind, owner.Name)
		r.AddLink(source, id)
	}
}

func (r *HelmReleaseGraph) ProcessPod(id string, res KubeResource, spec v1.PodSpec, status v1.PodStatus) {
	// Look through volumes
	// name and: PersistentVolumeClaim.ClaimName or Secret.SecretName
	log.Warnf("Processing Pod Volumes for %s", id)
	for _, volume := range spec.Volumes {
		if volume.VolumeSource.PersistentVolumeClaim != nil {
			ref := fmt.Sprintf("PersistentVolumeClaim-%s", volume.VolumeSource.PersistentVolumeClaim.ClaimName)
			r.AddLink(id, ref)
		} else if volume.VolumeSource.Secret != nil {
			ref := fmt.Sprintf("Secret-%s", volume.VolumeSource.Secret.SecretName)
			r.AddLink(id, ref)
		} else if volume.VolumeSource.ConfigMap != nil {
			ref := fmt.Sprintf("ConfigMap-%s", volume.VolumeSource.ConfigMap.Name)
			r.AddLink(id, ref)
		}
	}

	// Go through the pod and process each container
	// Add a node for each container
	for _, container := range spec.Containers {
		node := ReleaseNode{
			ID:    fmt.Sprintf("%s-%s", id, container.Name),
			Label: container.Name,
		}

		node.Data.Kind = "Container"
		node.Data.Status = mapContainerStatus(status, container.Name)

		// Add a node for the container and link it to the pod
		r.Nodes[node.ID] = node
		r.AddLink(id, node.ID)

		// Add links for ConfigMaps and Secrets used in the env_from
		for _, envFrom := range container.EnvFrom {
			if envFrom.ConfigMapRef != nil {
				ref := fmt.Sprintf("ConfigMap-%s", envFrom.ConfigMapRef.Name)
				r.AddLink(node.ID, ref)
			} else if envFrom.SecretRef != nil {
				ref := fmt.Sprintf("Secret-%s", envFrom.SecretRef.Name)
				r.AddLink(node.ID, ref)
			}
		}

		// Add links for ConfigMaps and Secrets used in the env
		for _, env := range container.Env {
			if env.ValueFrom != nil {
				if env.ValueFrom.ConfigMapKeyRef != nil {
					ref := fmt.Sprintf("ConfigMap-%s", env.ValueFrom.ConfigMapKeyRef)
					r.AddLink(node.ID, ref)
				} else if env.ValueFrom.SecretKeyRef != nil {
					ref := fmt.Sprintf("Secret-%s", env.ValueFrom.SecretKeyRef.Name)
					r.AddLink(node.ID, ref)
				}
			}
		}
	}
}

func (r *HelmReleaseGraph) ProcessService(id string, res KubeResource, spec v1.ServiceSpec) {
	if len(spec.Selector) > 0 {
		// Find all Pods that match this selector
		for _, item := range r.Release.Resources {
			switch o := item.Resource.(type) {
			case *v1.Pod:
				log.Warnf("Pod %s", o.Name)

				if labelsMatch(spec.Selector, o.Labels) {
					log.Error("GOT A POD FOR THE SERVICE: %s", o.Name)

					podID := fmt.Sprintf("Pod-%s", o.Name)
					r.AddLink(podID, id)
				}
			}
		}
	}
}

package helm

import (
	"encoding/json"
	"fmt"

	log "github.com/sirupsen/logrus"
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

// ParseManifest
func (r *HelmReleaseGraph) ParseManifest(manifest []KubeResource) {

	// An array of Kubernetes resources should be passed in

	log.Warn("Graph:: Parse Manifest")
	log.Warn(len(manifest))

	for _, item := range manifest {
		log.Warn(item.Kind)

		node := ReleaseNode{
			ID:    fmt.Sprintf("%s-%s", item.Kind, item.Metadata.Name),
			Label: item.Metadata.Name,
		}

		node.Data.Kind = item.Kind
		node.Data.Status = "unknown"

		// Add or replace the node in the map
		r.Nodes[node.ID] = node

		if item.Kind == "Deployment" {
			log.Info("Parsing deployment")
			log.Infof("%+v", item.Spec)

			// Covnert the spec back to json
			js, err := json.Marshal(item.Spec)
			if err != nil {
				log.Error("Can not marhsal deployment")
			} else {
				log.Warn(string(js))
			}
		}
	}

}

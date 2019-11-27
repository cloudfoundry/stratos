package kubernetes

import (
	"encoding/json"
	"fmt"

	//"fmt"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	// "k8s.io/client-go/rest"
	"helm.sh/helm/v3/pkg/action"
	// "helm.sh/helm/v3/pkg/release"

	// "k8s.io/helm/pkg/kube"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/kubernetes/helm"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// type helmReleaseInfo struct {
// 	*release.Release
// 	Extra     string                `json:"extra"`
// 	Resources []helmReleaseResource `json:"resources"`
// }

// type helmReleaseResource struct {
// 	Kind       string `json:"kind"`
// 	APIVersion string `json:"apiVersion"`
// 	Name       string `json:"name"`
// }

type ResourceResponse struct {
	Kind string          `json:"kind"`
	Data json.RawMessage `json:"data"`
}

// type KubeResource struct {
// 	Kind       string `yaml:"kind"`
// 	APIVersion string `yaml:"apiVersion"`
// 	Metadata   struct {
// 		Name string `yaml:"name"`
// 	} `yaml:"metadata"`
// 	Spec interface{} `yaml:"spec"`
// }

// type kubeAPIJob struct {
// 	Kind       string
// 	APIVersion string
// 	Name       string
// 	Namespace  string
// 	Endpoint   string
// 	User       string
// }

// type KubeAPIJobResult struct {
// 	helm.KubeResourceJob
// 	StatusCode int
// 	Data       json.RawMessage
// }

type kubeReleasesData struct {
	Endpoint  string `json:"endpoint"`
	Name      string `json:"releaseName"`
	Namespace string `json:"releaseNamespace"`
	Chart     struct {
		Name       string `json:"chartName"`
		Repository string `json:"repo"`
		Version    string `json:"version"`
	} `json:"chart"`
}

// type helmReleasesData struct {
// 	Manifest  string `json:"endpoint"`
// 	Name      string `json:"releaseName"`
// 	Namespace string `json:"releaseNamespace"`
// 	Chart     struct {
// 		Name       string `json:"chartName"`
// 		Repository string `json:"repo"`
// 		Version    string `json:"version"`
// 	} `json:"chart"`
// }

type kubeReleasesResponse map[string]kubeReleasesData

// ListReleases will list the helm releases for all endpoints
func (c *KubernetesSpecification) ListReleases(ec echo.Context) error {
	log.Debug("ListReleases")

	// Need to get a config object for the target endpoint
	// endpointGUID := ec.Param("endpoint")
	userID := ec.Get("user_id").(string)

	resp, err := c.ProxyKubernetesAPI(userID, c.listReleases)
	if err != nil {
		return err
	}
	return ec.JSON(200, resp)
}

// List releases for a single endpoint
func (c *KubernetesSpecification) listReleases(ep *interfaces.ConnectedEndpoint, done chan KubeProxyResponse) {

	response := KubeProxyResponse{
		Endpoint: ep.GUID,
		Result:   nil,
	}

	log.Debugf("listReleases: START: %s", ep.GUID)

	config, hc, err := c.GetHelmConfiguration(ep.GUID, ep.Account, "")
	if err != nil {
		log.Errorf("Helm: ListReleases could not get a Helm Configuration: %s", err)
		done <- response
		return
	}

	defer hc.Cleanup()

	list := action.NewList(config)

	log.Debugf("listReleases: REQUEST: %s", ep.GUID)

	res, err := list.Run()
	if err != nil {
		log.Debugf("listReleases: ERROR: %s", ep.GUID)
		log.Error(err)

		done <- response
		return
	}

	log.Debugf("listReleases: OK: %s", ep.GUID)
	response.Result = res

	done <- response
}

// GetRelease will get release status for the given release
// This is a web socket request and will return info over the websocket
// polling until disconnected
func (c *KubernetesSpecification) GetRelease(ec echo.Context) error {

	// TODO: I think this needs to know the namespace that the release is in ?!

	// Need to get a config object for the target endpoint
	endpointGUID := ec.Param("endpoint")
	release := ec.Param("name")
	userID := ec.Get("user_id").(string)

	config, hc, err := c.GetHelmConfiguration(endpointGUID, userID, "")
	if err != nil {
		log.Errorf("Helm: GetRelease could not get a Helm Configuration: %s", err)
		return err
	}

	defer hc.Cleanup()

	status := action.NewStatus(config)
	res, err := status.Run(release)
	if err != nil {
		log.Error(err)
		return err
	}

	// Upgrade to a web socket
	ws, pingTicker, err := interfaces.UpgradeToWebSocket(ec)
	if err != nil {
		return err
	}
	defer ws.Close()
	defer pingTicker.Stop()

	// ws is the websocket ready for use

	// Write the release info first - we will then go fetch the status of evertyhing in the release and send
	// this back incrementally

	// Parse the manifest
	log.Info("Got release")
	rel := helm.NewHelmRelease(res, endpointGUID, userID)
	log.Info("Done")

	graph := helm.NewHelmReleaseGraph(rel)

	id := fmt.Sprintf("%s-%s", endpointGUID, rel.Namespace)

	// Send over the namespace details of the release
	sendResource(ws, "ReleasePrefix", id)

	//graph.ParseManifest(rel)

	// Send the manifest for the release
	sendResource(ws, "Resources", rel.GetResources())

	// // Send the manifest for the release
	// sendResource(ws, "Test", rel.HelmManifest)

	// Send the graph as we have it now
	sendResource(ws, "Graph", graph)

	// Loop over this until the web socket is closed

	// Get the pods first and send those
	rel.UpdatePods(c.portalProxy)
	sendResource(ws, "Pods", rel.GetPods())

	//graph.Generate(pods)
	//graph.ParseManifest(rel)
	sendResource(ws, "Graph", graph)

	// Send the manifest for the release again (ReplicaSets will now be added)
	sendResource(ws, "Manifest", rel.GetResources())

	// Now get all of the resources in the manifest
	rel.UpdateResources(c.portalProxy)
	sendResource(ws, "Resources", rel.GetResources())

	graph.ParseManifest(rel)
	sendResource(ws, "Graph", graph)

	// Now we have everything, so loop, polling to get status
	// for {

	// 	log.Warn("Polling for release - wait 10 seconds")
	// 	time.Sleep(10 * time.Second)

	// 	log.Warn("Polling for release ....")

	// 	// Pods
	// 	pods := rel.GetPods(c.portalProxy)
	// 	err = sendResource(ws, "Pods", pods)
	// 	log.Error(err)

	// 	// Now get all of the resources in the manifest
	// 	all := rel.GetResources(c.portalProxy)
	// 	err = sendResource(ws, "Resources", all)
	// 	log.Error(err)
	// }

	log.Error("****************************************************************************************************")
	log.Error("RELEASE POLLER HAS FINISHED")
	log.Error("****************************************************************************************************")

	ws.Close()

	return nil
}

func sendResource(ws *websocket.Conn, kind string, data interface{}) error {

	var err error
	var txt []byte
	if txt, err = json.Marshal(data); err == nil {
		resp := ResourceResponse{
			Kind: kind,
			Data: json.RawMessage(txt),
		}

		if txt, err = json.Marshal(resp); err == nil {
			if ws.WriteMessage(websocket.TextMessage, txt); err == nil {
				return nil
			}

			log.Info(err)
		}
	}

	return err
}

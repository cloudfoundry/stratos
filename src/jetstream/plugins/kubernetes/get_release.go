package kubernetes

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"helm.sh/helm/v3/pkg/action"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/kubernetes/helm"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

type ResourceResponse struct {
	Kind string          `json:"kind"`
	Data json.RawMessage `json:"data"`
}

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

// GetRelease gets the release information for a specific Helm release
func (c *KubernetesSpecification) GetRelease(ec echo.Context) error {

	// Need to get a config object for the target endpoint
	endpointGUID := ec.Param("endpoint")
	release := ec.Param("name")
	namespace := ec.Param("namespace")
	userID := ec.Get("user_id").(string)

	log.Debugf("Helm: Get Release: %s %s %s", endpointGUID, namespace, release)

	config, hc, err := c.GetHelmConfiguration(endpointGUID, userID, namespace)
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

	return ec.JSON(200, res)
}

// GetReleaseStatus will get release status for the given release
// This is a web socket request and will return info over the websocket
// polling until disconnected
func (c *KubernetesSpecification) GetReleaseStatus(ec echo.Context) error {

	// Need to get a config object for the target endpoint
	endpointGUID := ec.Param("endpoint")
	release := ec.Param("name")
	namespace := ec.Param("namespace")
	userID := ec.Get("user_id").(string)

	log.Debugf("Helm: Get Release Status: %s %s %s", endpointGUID, namespace, release)

	config, hc, err := c.GetHelmConfiguration(endpointGUID, userID, namespace)
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
	rel := helm.NewHelmRelease(res, endpointGUID, userID, c.portalProxy)

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

	sendResource(ws, "ManifestErrors", rel.ManifestErrors)

	stopchan := make(chan bool)

	go readLoop(ws, stopchan)

	var sleep = 1 * time.Second

	// Now we have everything, so loop, polling to get status
	for {
		log.Debug("Polling for release - wait 10 seconds")

		select {
		case <-stopchan:
			ws.Close()
			return nil
		case <-time.After(sleep):
			break
		}

		log.Debug("Polling for release ....")

		// Pods
		rel.UpdatePods(c.portalProxy)
		sendResource(ws, "Pods", rel.GetPods())

		graph.ParseManifest(rel)
		sendResource(ws, "Graph", graph)

		// Now get all of the resources in the manifest
		rel.UpdateResources(c.portalProxy)
		sendResource(ws, "Resources", rel.GetResources())

		graph.ParseManifest(rel)
		sendResource(ws, "Graph", graph)

		sleep = 10 * time.Second
	}

	ws.Close()

	return nil
}

func readLoop(c *websocket.Conn, stopchan chan<- bool) {
	for {
		if _, _, err := c.NextReader(); err != nil {
			c.Close()
			close(stopchan)
			break
		}
	}
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
		}
	}

	return err
}

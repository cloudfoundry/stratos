package kubernetes

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/coder/websocket"
	"github.com/labstack/echo/v5"

	"helm.sh/helm/v3/pkg/action"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes/helm"
)

const (
	PauseTrue int = iota + 20000
	PauseFalse
)

// ResourceMessage ...  Incoming content of socket
type ResourceMessage struct {
	MessageType int `json:"type"`
}

// ResourceResponse ... Outgoing content of socket
type ResourceResponse struct {
	Kind string          `json:"kind"`
	Data json.RawMessage `json:"data"`
}

// GetRelease gets the release information for a specific Helm release
func (c *KubernetesSpecification) GetRelease(ec *echo.Context) error {

	// Need to get a config object for the target endpoint
	endpointGUID := ec.Param("endpoint")
	release := ec.Param("name")
	namespace := ec.Param("namespace")
	userID := ec.Get("user_id").(string)

	slog.Debug("getting the Helm release", "endpoint", endpointGUID, "user", userID, "namespace", namespace, "release", release)

	config, hc, err := c.GetHelmConfiguration(endpointGUID, userID, namespace)
	if err != nil {
		slog.Error("could not get a Helm configuration to get the release", "endpoint", endpointGUID, "user", userID, "namespace", namespace, "release", release, "error", err)
		return err
	}

	defer hc.Cleanup()

	status := action.NewStatus(config)
	res, err := status.Run(release)
	if err != nil {
		slog.Error("could not get the status of the Helm release", "endpoint", endpointGUID, "namespace", namespace, "release", release, "error", err)
		return err
	}

	return ec.JSON(200, res)
}

// GetReleaseStatus will get release status for the given release
// This is a web socket request and will return info over the websocket
// polling until disconnected
func (c *KubernetesSpecification) GetReleaseStatus(ec *echo.Context) error {

	// Need to get a config object for the target endpoint
	endpointGUID := ec.Param("endpoint")
	release := ec.Param("name")
	namespace := ec.Param("namespace")
	userID := ec.Get("user_id").(string)

	slog.Debug("getting the Helm release status", "endpoint", endpointGUID, "user", userID, "namespace", namespace, "release", release)

	config, hc, err := c.GetHelmConfiguration(endpointGUID, userID, namespace)
	if err != nil {
		slog.Error("could not get a Helm configuration to get the release status", "endpoint", endpointGUID, "user", userID, "namespace", namespace, "release", release, "error", err)
		return err
	}

	defer hc.Cleanup()

	status := action.NewStatus(config)
	res, err := status.Run(release)
	if err != nil {
		slog.Error("could not get the status of the Helm release", "endpoint", endpointGUID, "namespace", namespace, "release", release, "error", err)
		return err
	}

	// Upgrade to a web socket
	ws, err := api.UpgradeToWebSocket(ec)
	if err != nil {
		return err
	}
	defer func() { _ = ws.CloseNow() }()

	// ws is the websocket ready for use

	// Write the release info first - we will then go fetch the status of everything in the release and send
	// this back incrementally

	// Parse the manifest
	rel := helm.NewHelmRelease(res, endpointGUID, userID, c.portalProxy)

	graph := helm.NewHelmReleaseGraph(rel)

	id := fmt.Sprintf("%s-%s", endpointGUID, rel.Namespace)

	// Send over the namespace details of the release
	_ = sendResource(ws, "ReleasePrefix", id)

	//graph.ParseManifest(rel)

	// Send the manifest for the release
	_ = sendResource(ws, "Resources", rel.GetResources())

	// // Send the manifest for the release
	// sendResource(ws, "Test", rel.HelmManifest)

	// Send the graph as we have it now
	_ = sendResource(ws, "Graph", graph)

	// Loop over this until the web socket is closed

	// Get the pods first and send those
	rel.UpdatePods(c.portalProxy)
	_ = sendResource(ws, "Pods", rel.GetPods())

	//graph.Generate(pods)
	//graph.ParseManifest(rel)
	_ = sendResource(ws, "Graph", graph)

	// Send the manifest for the release again (ReplicaSets will now be added)
	_ = sendResource(ws, "Manifest", rel.GetResources())

	// Now get all of the resources in the manifest
	rel.UpdateResources(c.portalProxy)
	_ = sendResource(ws, "Resources", rel.GetResources())

	graph.ParseManifest(rel)
	_ = sendResource(ws, "Graph", graph)

	_ = sendResource(ws, "ManifestErrors", rel.ManifestErrors)

	stopchan := make(chan bool)
	pausechan := make(chan bool)

	go readLoop(ws, stopchan, pausechan)

	var sleep = 1 * time.Second
	var paused = false

	// Now we have everything, so loop, polling to get status
	for {

		select {
		case pause := <-pausechan:
			paused = pause
		case <-stopchan:
			_ = ws.Close(websocket.StatusNormalClosure, "")
			return nil
		case <-time.After(sleep):
		}

		if paused {
			slog.Debug("updating the release resources is paused", "endpoint", endpointGUID, "namespace", namespace, "release", release)
			continue
		}

		slog.Debug("updating the release resources", "endpoint", endpointGUID, "namespace", namespace, "release", release)

		// Pods
		rel.UpdatePods(c.portalProxy)
		_ = sendResource(ws, "Pods", rel.GetPods())

		graph.ParseManifest(rel)
		_ = sendResource(ws, "Graph", graph)

		// Now get all of the resources in the manifest
		rel.UpdateResources(c.portalProxy)
		_ = sendResource(ws, "Resources", rel.GetResources())

		graph.ParseManifest(rel)
		_ = sendResource(ws, "Graph", graph)

		sleep = 10 * time.Second
	}
}

func readLoop(c *websocket.Conn, stopchan chan<- bool, pausechan chan<- bool) {
	defer close(stopchan)
	for {
		messageType, data, err := c.Read(context.Background())
		if err != nil {
			_ = c.CloseNow()
			return
		}

		if messageType != websocket.MessageText {
			_ = c.CloseNow()
			return
		}

		message := ResourceMessage{}
		if err := json.Unmarshal(data, &message); err != nil {
			slog.Warn("failed to parse the content of a Helm resource WebSocket message", "error", err)
			continue
		}

		switch message.MessageType {
		case PauseTrue:
			pausechan <- true
		case PauseFalse:
			pausechan <- false
		}
	}
}

// sendResource logs its own failure. Every caller streams a sequence of
// these to a websocket and has nothing useful to do with an individual
// error - the socket teardown is driven by the read loop - so reporting
// here keeps the failure visible without thirteen identical checks.
func sendResource(ws *websocket.Conn, kind string, data interface{}) error {
	var err error
	var txt []byte
	if txt, err = json.Marshal(data); err == nil {
		resp := ResourceResponse{
			Kind: kind,
			Data: json.RawMessage(txt),
		}

		if txt, err = json.Marshal(resp); err == nil {
			if err = api.WriteText(ws, txt); err == nil {
				return nil
			}
		}
	}

	slog.Warn("could not send a Helm release resource to the client", "kind", kind, "error", err)
	return err
}

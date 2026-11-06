package terminal

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"log/slog"

	//"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/labstack/echo/v5"

	"github.com/cloudfoundry/stratos/src/jetstream/api"

	"github.com/coder/websocket"
)

// TTY Resize, see: https://gitlab.cncf.ci/kubernetes/kubernetes/commit/3b21a9901bcd48bb452d3bf1a0cddc90dae142c4#9691a2f9b9c30711f0397221db0b9ac55ab0e2d1

// KeyCode - JSON object that is passed from the front-end to notify of a key press or a term resize
type KeyCode struct {
	Key  string `json:"key"`
	Cols int    `json:"cols"`
	Rows int    `json:"rows"`
}

type terminalSize struct {
	Width  uint16
	Height uint16
}

// Start handles web-socket request to launch a Kubernetes Terminal
func (k *KubeTerminal) Start(c *echo.Context) error {
	endpointGUID := c.Param("guid")
	userGUID := c.Get("user_id").(string)

	slog.Debug("Kubernetes Terminal start request", "endpoint", endpointGUID, "user", userGUID)

	cnsiRecord, err := k.PortalProxy.GetCNSIRecord(endpointGUID)
	if err != nil {
		return errors.New("Could not get endpoint information")
	}

	// Get token for this user
	tokenRecord, ok := k.PortalProxy.GetCNSITokenRecord(endpointGUID, userGUID)
	if !ok {
		return errors.New("Could not get token")
	}

	// This is the kube config for the kubernetes endpoint that we want configured in the Terminal
	kubeConfig, err := k.Kube.GetKubeConfigForEndpoint(cnsiRecord.APIEndpoint.String(), tokenRecord, "")
	if err != nil {
		return errors.New("Can not get Kubernetes config for specified endpoint")
	}

	// Determine the Kubernetes version
	version, err := k.getKubeVersion(endpointGUID, userGUID)
	if err != nil {
		// Not fatal - the terminal image falls back to a default kubectl
		slog.Warn("could not determine the Kubernetes version for the terminal", "endpoint", endpointGUID, "user", userGUID, "error", err)
	}
	slog.Debug("determined the Kubernetes version for the terminal", "endpoint", endpointGUID, "version", version)

	// Upgrade the web socket for the incoming request
	ws, err := api.UpgradeToWebSocket(c)
	if err != nil {
		return err
	}
	defer func() { _ = ws.CloseNow() }()

	// A pasted block of text arrives as a single KeyCode message of unbounded
	// size, so no read limit can be safely applied to this socket
	ws.SetReadLimit(-1)

	readCtx := c.Request().Context()

	// At this point we aer using web sockets, so we can not return errors to the client as the connection
	// has been upgraded to a web socket

	// We are now in web socket land - we don't want any middleware to change the HTTP response
	c.Set("Stratos-WebSocket", "true")

	// Send a message to say that we are creating the pod
	sendProgressMessage(ws, "Launching Kubernetes Terminal ... one moment please")

	podData, err := k.createPod(c, kubeConfig, version, ws)

	// Clear progress message
	sendProgressMessage(ws, "")

	if err != nil {
		slog.Error("Kubernetes Terminal could not create the secret or the pod", "endpoint", endpointGUID, "user", userGUID, "error", err)
		k.cleanupPodAndSecret(podData)

		// Send error message
		sendProgressMessage(ws, "!"+err.Error())
		return nil
	}

	// API Endpoint to SSH/exec into a container
	target := fmt.Sprintf("%s/api/v1/namespaces/%s/pods/%s/exec?command=/bin/bash&stdin=true&stderr=true&stdout=true&tty=true", k.APIServer, k.Namespace, podData.PodName)

	// Verify the API server against the in-cluster CA; only skip
	// verification in the dev setup where no CA file is mounted
	tlsConfig := &tls.Config{InsecureSkipVerify: true}
	if len(k.CACert) > 0 {
		pool := x509.NewCertPool()
		if pool.AppendCertsFromPEM(k.CACert) {
			tlsConfig = &tls.Config{RootCAs: pool}
		}
	}

	if strings.HasPrefix(target, "https://") {
		target = "wss://" + target[8:]
	} else {
		target = "ws://" + target[7:]
	}

	header := http.Header{}
	header.Add("Authorization", fmt.Sprintf("Bearer %s", string(k.Token)))
	wsConn, _, err := websocket.Dial(readCtx, target, &websocket.DialOptions{
		HTTPClient: &http.Client{
			Transport: &http.Transport{TLSClientConfig: tlsConfig},
		},
		HTTPHeader:      header,
		CompressionMode: websocket.CompressionDisabled,
	})

	if err == nil {
		defer func() { _ = wsConn.CloseNow() }()
		// Terminal output from the API server can arrive in arbitrarily large
		// messages - this is a trusted upstream, so no read limit
		wsConn.SetReadLimit(-1)
	}

	if err != nil {
		k.cleanupPodAndSecret(podData)
		slog.Warn("Kubernetes Terminal could not connect to the pod", "endpoint", endpointGUID, "user", userGUID, "pod", podData.PodName, "namespace", k.Namespace, "error", err)
		// No point returning an error - we've already upgraded to web sockets, so we can't use the HTTP response now
		return nil
	}

	go pumpStdout(ws, wsConn)

	// Read the input from the web socket and pipe it to the SSH client
	for {
		_, r, err := ws.Read(readCtx)
		if err != nil {
			// Error reading (including the client closing the web socket) - so clean up
			k.cleanupPodAndSecret(podData)
			podData = nil

			_ = wsConn.CloseNow()
			_ = ws.Close(websocket.StatusNormalClosure, "")

			// No point returning an error - we've already upgraded to web sockets, so we can't use the HTTP response now
			return nil
		}

		res := KeyCode{}
		if err := json.Unmarshal(r, &res); err != nil {
			// Zero-valued res would otherwise be sent on as an empty keystroke
			slog.Warn("Kubernetes Terminal could not parse a client message", "endpoint", endpointGUID, "user", userGUID, "error", err)
			continue
		}
		if res.Cols == 0 {
			slice := make([]byte, 1)
			slice[0] = 0
			slice = append(slice, []byte(res.Key)...)
			if err := api.WriteText(wsConn, slice); err != nil {
				slog.Warn("Kubernetes Terminal could not forward a keystroke", "endpoint", endpointGUID, "user", userGUID, "error", err)
			}
		} else {
			size := terminalSize{
				Width:  uint16(res.Cols),
				Height: uint16(res.Rows),
			}
			j, _ := json.Marshal(size)
			resizeStream := []byte{4}
			slice := append(resizeStream, j...)
			if err := api.WriteText(wsConn, slice); err != nil {
				slog.Warn("Kubernetes Terminal could not forward a resize", "endpoint", endpointGUID, "user", userGUID, "error", err)
			}
		}
	}
}

func pumpStdout(ws *websocket.Conn, source *websocket.Conn) {
	for {
		_, r, err := source.Read(context.Background())
		if err != nil {
			// Close - unblocks the client read loop so it cleans up the pod
			_ = ws.CloseNow()
			break
		}
		if len(r) == 0 {
			// Exec stream messages carry a leading channel byte; tolerate
			// empty keepalive frames
			continue
		}
		bytes := fmt.Sprintf("% x\n", r[1:])
		if err := api.WriteText(ws, []byte(bytes)); err != nil {
			slog.Error("Kubernetes Terminal failed to write a message to the client", "error", err)
			_ = ws.CloseNow()
			break
		}
	}
}

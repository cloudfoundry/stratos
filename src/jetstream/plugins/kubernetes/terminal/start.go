package terminal

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"

	//"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"

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

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

)

// Start handles web-socket request to launch a Kubernetes Terminal
func (k *KubeTerminal) Start(c echo.Context) error {
	log.Debug("Kube Terminal start request")

	endpointGUID := c.Param("guid")
	userGUID := c.Get("user_id").(string)

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
	version, _ := k.getKubeVersion(endpointGUID, userGUID)
	log.Debugf("Kubernetes Version: %s", version)

	// Upgrade the web socket for the incoming request
	ws, pingTicker, err := api.UpgradeToWebSocket(c)
	if err != nil {
		return err
	}
	defer ws.CloseNow()
	defer pingTicker.Stop()

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
		log.Errorf("Kubernetes Terminal: Error creating secret or pod: %+v", err)
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
		defer wsConn.CloseNow()
		// Terminal output from the API server can arrive in arbitrarily large
		// messages - this is a trusted upstream, so no read limit
		wsConn.SetReadLimit(-1)
	}

	if err != nil {
		k.cleanupPodAndSecret(podData)
		log.Warn("Kube Terminal: Could not connect to pod")
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

			wsConn.CloseNow()
			ws.Close(websocket.StatusNormalClosure, "")

			// No point returning an error - we've already upgraded to web sockets, so we can't use the HTTP response now
			return nil
		}

		res := KeyCode{}
		json.Unmarshal(r, &res)
		if res.Cols == 0 {
			slice := make([]byte, 1)
			slice[0] = 0
			slice = append(slice, []byte(res.Key)...)
			wsConn.Write(readCtx, websocket.MessageText, slice)
		} else {
			size := terminalSize{
				Width:  uint16(res.Cols),
				Height: uint16(res.Rows),
			}
			j, _ := json.Marshal(size)
			resizeStream := []byte{4}
			slice := append(resizeStream, j...)
			wsConn.Write(readCtx, websocket.MessageText, slice)
		}
	}
}

func pumpStdout(ws *websocket.Conn, source *websocket.Conn) {
	for {
		_, r, err := source.Read(context.Background())
		if err != nil {
			// Close - unblocks the client read loop so it cleans up the pod
			ws.CloseNow()
			break
		}
		ctx, cancel := context.WithTimeout(context.Background(), writeWait)
		bytes := fmt.Sprintf("% x\n", r[1:])
		err = ws.Write(ctx, websocket.MessageText, []byte(bytes))
		cancel()
		if err != nil {
			log.Errorf("Kubernetes Terminal failed to write message: %+v", err)
			ws.CloseNow()
			break
		}
	}
}

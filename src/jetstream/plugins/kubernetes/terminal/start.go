package terminal

import (
	"crypto/tls"
	"errors"
	"fmt"

	//"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"

	"github.com/gorilla/websocket"
)

// TTY Resize, see: https://gitlab.cncf.ci/kubernetes/kubernetes/commit/3b21a9901bcd48bb452d3bf1a0cddc90dae142c4#9691a2f9b9c30711f0397221db0b9ac55ab0e2d1

// Allow connections from any Origin
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

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
	ws, pingTicker, err := interfaces.UpgradeToWebSocket(c)
	if err != nil {
		return err
	}
	defer ws.Close()
	defer pingTicker.Stop()

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
		sendProgressMessage(ws, "!" + err.Error())
		return err
	}

	// API Endpoint to SSH/exec into a container
	target := fmt.Sprintf("%s/api/v1/namespaces/%s/pods/%s/exec?command=/bin/bash&stdin=true&stderr=true&stdout=true&tty=true", k.APIServer, k.Namespace, podData.PodName)

	dialer := &websocket.Dialer{
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: true,
		},
	}

	if strings.HasPrefix(target, "https://") {
		target = "wss://" + target[8:]
	} else {
		target = "ws://" + target[7:]
	}

	header := &http.Header{}
	header.Add("Authorization", fmt.Sprintf("Bearer %s", string(k.Token)))
	wsConn, _, err := dialer.Dial(target, *header)

	if err == nil {
		defer wsConn.Close()
	}

	if err != nil {
		k.cleanupPodAndSecret(podData)
		log.Warn("Kube Terminal: Could not connect to pod")
		// No point returning an error - we've already upgraded to web sockets, so we can't use the HTTP response now
		return nil
	}

	stdoutDone := make(chan bool)
	go pumpStdout(ws, wsConn, stdoutDone)

	// If the downstream connection is closed, close the other web socket as well
	ws.SetCloseHandler(func (code int, text string) error {
		wsConn.Close()
		return nil
	})

	// Read the input from the web socket and pipe it to the SSH client
	for {
		_, r, err := ws.ReadMessage()
		if err != nil {
			// Check to see if this was because the web socket was closed cleanly
			closed := false
			select {
			case msg := <-stdoutDone:
					closed = msg
			}
			if !closed {
				log.Errorf("Kubernetes terminal: error reading message from web socket: %+v", err)
			}
			log.Debug("Kube Terminal cleaning up ....")
			k.cleanupPodAndSecret(podData)

			// No point returning an error - we've already upgraded to web sockets, so we can't use the HTTP response now
			return nil
		}

		res := KeyCode{}
		json.Unmarshal(r, &res)

		if res.Cols == 0 {
			slice := make([]byte, 1)
			slice[0] = 0
			slice = append(slice, []byte(res.Key)...)
			wsConn.WriteMessage(websocket.TextMessage, slice)
		} else {
			size := terminalSize{
				Width:  uint16(res.Cols),
				Height: uint16(res.Rows),
			}
			j, _ := json.Marshal(size)
			resizeStream := []byte{4}
			slice := append(resizeStream, j...)
			wsConn.WriteMessage(websocket.TextMessage, slice)
		}
	}

	// Cleanup
	log.Error("Kubernetes Terminal is cleaning up")

	return k.cleanupPodAndSecret(podData)
}

func pumpStdout(ws *websocket.Conn, source *websocket.Conn, done chan bool) {
	for {
		_, r, err := source.ReadMessage()
		if err != nil {
			// Close
			ws.Close()
			done <- true
			break
		}
		ws.SetWriteDeadline(time.Now().Add(writeWait))
		bytes := fmt.Sprintf("% x\n", r[1:])
		if err := ws.WriteMessage(websocket.TextMessage, []byte(bytes)); err != nil {
			log.Errorf("Kubernetes Terminal failed to write message: %+v", err)
			ws.Close()
			break
		}
	}
}

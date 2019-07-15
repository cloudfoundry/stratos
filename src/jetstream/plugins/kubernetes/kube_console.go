package kubernetes

import (
	"bytes"
	"errors"
	"fmt"
	"crypto/tls"
	//"encoding/base64"
	"encoding/json"
	"net"
	"net/http"
	"time"
	"strings"
	//"io/ioutil"
	//yaml "gopkg.in/yaml.v2"

	uuid "github.com/satori/go.uuid"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/kubernetes/auth"
	restclient "k8s.io/client-go/rest"
	//"k8s.io/kubernetes/pkg/client/unversioned/remotecommand"
	"github.com/gorilla/websocket"
	"k8s.io/client-go/kubernetes"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	corev1 "k8s.io/client-go/kubernetes/typed/core/v1"

	"k8s.io/client-go/tools/remotecommand"	
	scheme "k8s.io/client-go/kubernetes/scheme"
)

const (
	consoleContainerName = "kube-console"
)

var history = ""

// TTY Resize, see: https://gitlab.cncf.ci/kubernetes/kubernetes/commit/3b21a9901bcd48bb452d3bf1a0cddc90dae142c4#9691a2f9b9c30711f0397221db0b9ac55ab0e2d1

// Allow connections from any Origin
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// PodCreationData stores the clients and names used ot create pod and secret
type PodCreationData struct {
	ClientSet *kubernetes.Clientset
	Config *restclient.Config
	Namespace string
	PodClient corev1.PodInterface
	SecretClient corev1.SecretInterface
	PodName string
	SecretName string
}

// KeyCode - JSON object that is passed from the front-end to notify of a key press or a term resize
type KeyCode struct {
	Key  string `json:"key"`
	Cols int    `json:"cols"`
	Rows int    `json:"rows"`
}

type TermianlSize struct {
	Width  uint16
	Height uint16
}

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second
)

func (k *KubernetesSpecification) KubeConsole(c echo.Context) error {

	c.Response().Status = 500

	log.Info("Kube Console backend request")

	endpointGUID := c.Param("guid")
	userGUID := c.Get("user_id").(string)

	///api/v1/namespaces/project-1/pods/pod-1-lmlzj/exec?command=/bin/bash&stdin=true&stderr=true&stdout=true&tty=true

	namespace := "stratos"

	// TODO: Refresh auth token

	// Upgrade the web socket for the incoming request
	ws, pingTicker, err := interfaces.UpgradeToWebSocket(c)
	if err != nil {
		return err
	}
	defer ws.Close()
	defer pingTicker.Stop()

	// Send a message to say that we are creating the pod
	sendProgressMessage(ws, "Launching Kubernetes Console ... one moment please")

	var p = k.portalProxy

	cnsiRecord, err := p.GetCNSIRecord(endpointGUID)
	if err != nil {
		return errors.New("Could not get endpoint information")
	}

	// Get token for this users
	tokenRec, ok := p.GetCNSITokenRecord(endpointGUID, userGUID)
	if !ok {
		return errors.New("Could not get token")
	}

	podData, err := k.createPod(c, cnsiRecord, tokenRec, namespace, ws)
	// Clear progress message
	sendProgressMessage(ws, "")

	if err != nil {
		log.Error("ERROR creating secret or pod")
		log.Info(err)
		k.cleanupPodAndSecret(podData)
		return err
	}

	log.Info(podData.PodName)

	log.Info(tokenRec.AuthToken)
	log.Info(tokenRec.AuthType)

	// Make the info call to the SSH endpoint info
	// Currently this is not cached, so we must get it each time
	apiEndpoint := cnsiRecord.APIEndpoint
	log.Info(apiEndpoint)
	// target := fmt.Sprintf("%s/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/", apiEndpoint)
	//target := fmt.Sprintf("%s/api/v1/namespaces/kube-system/services/http:kubernetes-dashboard:/proxy/", apiEndpoint)
	// target := http://localhost:8001/api/v1/namespaces/kube-system/services/kubernetes-dashboard/proxy
	target := fmt.Sprintf("%s/api/v1/namespaces/%s/pods/%s/exec?command=/bin/bash&stdin=true&stderr=true&stdout=true&tty=true", apiEndpoint, namespace, podData.PodName)
	log.Info(target)

	// config, err := k.getConfig(&cnsiRecord, &tokenRec)
	// if err != nil {
	// 	return errors.New("Could not get config for this auth type")
	// }


	req, err := http.NewRequest("POST", target, nil)
	if err != nil {
		k.cleanupPodAndSecret(podData)		
		return errors.New("Could not create new HTTP request")
	}
	
	// Set auth header so we log in if needed
	if len(tokenRec.AuthToken) > 0 {
		//req.Header.Add("Authorization", "Bearer "+tokenRec.AuthToken)
		log.Info("Setting auth header")
	}

	//req.Header.Add("Accept", "*/*")

	log.Info("Config")
	log.Info("Making request")
	log.Info(req)

	// endpointRequest := &interfaces.CNSIRequest{
	// 	GUID: endpointGUID,
	// }

	kubeAuthToken := &auth.KubeCertificate{}
	err = json.NewDecoder(strings.NewReader(tokenRec.AuthToken)).Decode(kubeAuthToken)
	if err != nil {
		k.cleanupPodAndSecret(podData)		
		return err
	}
	cert, err := kubeAuthToken.GetCerticate()
	if err != nil {
		k.cleanupPodAndSecret(podData)		
		return err
	}
	dial := (&net.Dialer{
		Timeout:   time.Duration(30) * time.Second,
		KeepAlive: 30 * time.Second,
	}).Dial

	sslTransport := &http.Transport{
		Proxy:               http.ProxyFromEnvironment,
		Dial:                dial,
		TLSHandshakeTimeout: 10 * time.Second, // 10 seconds is a sound default value (default is 0)
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: true,
			Certificates:       []tls.Certificate{cert},
		},
		MaxIdleConnsPerHost: 6, // (default is 2)
	}

	kubeCertClient := http.Client{}
	kubeCertClient.Transport = sslTransport
	kubeCertClient.Timeout = time.Duration(30) * time.Second

	dialer := &websocket.Dialer{
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: true,
			Certificates:       []tls.Certificate{cert},
		},
	}

	if strings.HasPrefix(target ,"https://") {
		target = "wss://" + target[8:]
	} else {
		target = "ws://" + target[7:]
	}

	header := &http.Header{}
	wsConn, res, err := dialer.Dial(target, *header)

	if err == nil {
		defer wsConn.Close()
	}

	// log.Info(err)
	// log.Info(res)
	// log.Info(wsConn)

	// if kubeAuthToken.Token != "" {
	// 	req.Header.Set("Authorization", "bearer "+kubeAuthToken.Token)
	// }

	//res, err := kubeCertClient.Do(req)


	kubeCertClient.CloseIdleConnections()

	//var res *http.Response

	// var client http.Client
	// client = p.GetHttpClientForRequest(req, cnsiRecord.SkipSSLValidation)
	// res, err = client.Do(req)

	// Find the auth provider for the auth type - default to oauthflow
	// authHandler := p.GetAuthProvider(tokenRec.AuthType)
	// if authHandler.Handler != nil {
	// 	res, err = authHandler.Handler(endpointRequest, req)
	// } else {
	// 	res, err = p.DoOAuthFlowRequest(endpointRequest, req)
	// }
	log.Error(err)
//	log.Error(res)

	if err != nil {
		log.Error("Failed to make request")
		k.cleanupPodAndSecret(podData)
		return errors.New("Could not make request")
	}

	log.Error("=== Made request to exec endpoint OK")
	log.Error(res)

	// Websockets next
	//log.Info(wsConn)

	//done := make(chan struct{})
	stdoutDone := make(chan struct{})
	go pumpStdout(ws, wsConn, stdoutDone)

	// Read the input from the web socket and pipe it to the SSH client
	for {
		_, r, err := ws.ReadMessage()
		if err != nil {
			log.Error("Error reading message from web socket")
			log.Warnf("%v+", err)
			k.cleanupPodAndSecret(podData)			
			return err
		}

		res := KeyCode{}
		json.Unmarshal(r, &res)

		if res.Cols == 0 {


			slice := make([]byte, 1)
			slice[0] = 0
			slice = append(slice, []byte(res.Key)...)
			wsConn.WriteMessage(websocket.TextMessage, slice)
		} else {
			// Terminal resize request
			// if err := windowChange(session, res.Rows, res.Cols); err != nil {
			// 	log.Error("Can not resize the PTY")
			// }
			log.Error("Terminal resize receieved")

			size := TermianlSize{
				Width: uint16(res.Cols),
				Height: uint16(res.Rows),
			}
			j, _ := json.Marshal(size)
			log.Info(j)

			resizeStream := []byte{4}
			slice := append(resizeStream, j...)
			log.Info(slice)
			wsConn.WriteMessage(websocket.TextMessage, slice)
		}
	}

	// Cleanup
	log.Info("*** Cleaning up.... ***")

	return k.cleanupPodAndSecret(podData)
}

func pumpStdout(ws *websocket.Conn, source *websocket.Conn, done chan struct{}) {
	//buffer := make([]byte, 32768)
	for {
		_, r, err := source.ReadMessage()
		if err != nil {
			log.Info(err)
			ws.Close()
			break
		}
		ws.SetWriteDeadline(time.Now().Add(writeWait))
		bytes := fmt.Sprintf("% x\n", r[1:])
		if err := ws.WriteMessage(websocket.TextMessage, []byte(bytes)); err != nil {
			log.Error("App SSH Failed to write nessage")
			ws.Close()
			break
		}
	}
}

func (k *KubernetesSpecification) createPod(c echo.Context, cnsiRecord interfaces.CNSIRecord, tokenRecord interfaces.TokenRecord, namespace string, ws *websocket.Conn) (*PodCreationData, error) {

	id := uuid.NewV4().String()
	secretName := fmt.Sprintf("k8s-s-console-%s", id)
	podName := fmt.Sprintf("k8s-p-console-%s", id)

	result := &PodCreationData{}

	config, err := k.GetConfigForEndpoint(cnsiRecord.APIEndpoint.String(), tokenRecord)
	if err != nil {
		return result, errors.New("Can not get Kubernetes config for specified endpoint")
	}

	result.Config = config

	kubeConfig, err := k.GetKubeConfigForEndpoint(cnsiRecord.APIEndpoint.String(), tokenRecord)
	if err != nil {
		return result, errors.New("Can not get Kubernetes config for specified endpoint")
	}

	kubeClient, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Error("Could not get kube client")
		return result, err
	}

	result.Namespace = namespace
	result.ClientSet = kubeClient

	// Create the secret
	secretSpec := &v1.Secret{
		TypeMeta: metav1.TypeMeta{
			Kind: "secret",
			APIVersion: "v1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: secretName,
			Namespace: namespace,
		},
		Type: "Opaque",
	}

	secretSpec.Data = make(map[string][]byte)
	secretSpec.Data["kubeconfig"] = []byte(kubeConfig)
	secretSpec.Data["history"] = []byte(history)
	
	// Get Helm repository script if we have Helm repositories
	helmSetup := getHelmRepoSetupScript(k.portalProxy)
	if len(helmSetup) > 0 {
		secretSpec.Data["helm-setup"] = []byte(helmSetup)
	}

	secretsClient := kubeClient.CoreV1().Secrets(namespace)
	_, err = secretsClient.Create(secretSpec)

	if err != nil {
		log.Warn("Unable to create Secret")
		return result, err
	}

	result.SecretClient = secretsClient
	result.SecretName = secretName

	podClient := kubeClient.CoreV1().Pods(namespace)

	podSpec := &v1.Pod{
		TypeMeta: metav1.TypeMeta{
			Kind: "pod",
			APIVersion: "v1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: podName,
			Namespace: namespace,
		},
	}

	podSpec.ObjectMeta.Annotations = make(map[string]string)

	// Record the session ID
	session, err :=k.portalProxy.GetSession(c)
	if err == nil {
		podSpec.ObjectMeta.Annotations["stratos-session"] = session.ID
		log.Infof("Session ID: %s", session.ID)
	}

	automount := false

	podSpec.Spec.AutomountServiceAccountToken = &automount
	podSpec.Spec.RestartPolicy = "Never"

	volumeMountsSpec := make([]v1.VolumeMount, 1)
	volumeMountsSpec[0].Name = "kubeconfig"
	volumeMountsSpec[0].MountPath = "/root/.stratos"
	volumeMountsSpec[0].ReadOnly = true

	containerSpec := make([]v1.Container, 1)
	containerSpec[0].Name = consoleContainerName
	containerSpec[0].Image = "nwmac/kubeconsole"
	containerSpec[0].ImagePullPolicy = "Always"
	containerSpec[0].VolumeMounts = volumeMountsSpec
	podSpec.Spec.Containers = containerSpec

	volumesSpec := make([]v1.Volume, 1)
	volumesSpec[0].Name = "kubeconfig"
	volumesSpec[0].Secret = &v1.SecretVolumeSource{
		SecretName: secretName,
	}
	podSpec.Spec.Volumes = volumesSpec	

	// Create a new pod
	pod, err := podClient.Create(podSpec)
	if err != nil {
		return result, err
	}

	result.PodClient = podClient
	result.PodName = podName

	sendProgressMessage(ws, "Waiting for Kubernetes Console to start up ...")

	statusOptions := metav1.GetOptions{}

	// Wait for the pod to be running
	ready := false
	for {
		status, err := podClient.Get(pod.Name, statusOptions)

		if err != nil {
			break
		}

		//log.Info(status.Status.Phase)
		if status.Status.Phase == "Running" {
			ready = true
		}

		if ready {
			break
		}

		// Sleep
		time.Sleep(2500 * time.Millisecond)
	}

	return result, err
}

func (k *KubernetesSpecification) cleanupPodAndSecret(podData *PodCreationData) error {

	if len(podData.PodName) > 0 {
		captureBashHistory(podData)
		podData.PodClient.Delete(podData.PodName, nil)
	}

	if len(podData.SecretName) > 0 {
		podData.SecretClient.Delete(podData.SecretName, nil)
	}

	return nil
}

func getHelmRepoSetupScript(portalProxy interfaces.PortalProxy) string {

	str := ""

	// Get all of the helm endpoints
	endpoints, err := portalProxy.ListEndpoints()
	if err != nil {
		log.Error("Can not list Helm Repository endpoints")
		return str
	}

	for _, ep := range endpoints {
		if ep.CNSIType == "helm" {
			str += fmt.Sprintf("helm repo add %s %s > /dev/null\n", ep.Name, ep.APIEndpoint)
		}
	}

	return str
}

func sendProgressMessage(ws *websocket.Conn, progressMsg string) {
	// Send a message to say that we are creating the pod
	msg := fmt.Sprintf("\033]2;%s\007", progressMsg)
	bytes := fmt.Sprintf("% x\n", []byte(msg))
	if err := ws.WriteMessage(websocket.TextMessage, []byte(bytes)); err != nil {
		log.Error("Could not send message to client to indicate console is starting")
	}
}

func captureBashHistory(podData *PodCreationData) error {

	log.Warn("**** Trying to capture bash history from pod ****")

	// Can we capture the history?

	// returning stdout, stderr and error. `options` allowed for
	// additional parameters to be passed.

	//cmd := []string{"bash", "-c", "\"cat $HISTFILE\""}
	cmd := []string{"cat", "/root/.bash_history"}


	req := podData.ClientSet.Core().RESTClient().Post().
		Resource("pods").
		Name(podData.PodName).
		Namespace(podData.Namespace).
		SubResource("exec").
		Param("container", consoleContainerName)
			
	req.VersionedParams(&v1.PodExecOptions{
		Container: consoleContainerName,
		Command:   cmd,
		Stdin:     false,
		Stdout:    true,
		Stderr:    false,
		TTY:       true,
	}, scheme.ParameterCodec)
	
	var stdout bytes.Buffer
	//err := execute("POST", req.URL(), nil, nil, &stdout, nil, false)

	exec, err := remotecommand.NewSPDYExecutor(podData.Config, "POST", req.URL())
	if err != nil {
		log.Error("Could not exec")
		log.Error(err)
		return err
	}

	log.Warn("Attempting stream ......")

	err = exec.Stream(remotecommand.StreamOptions{
		//SupportedProtocols: remotecommandserver.SupportedStreamingProtocols,
		Stdin:              nil,
		Stdout:             &stdout,
		Stderr:             nil,
		Tty:                true,
	})

	log.Error("Get Bash History")
	log.Error(err)
	log.Error(stdout.String())

	history = stdout.String()
	
		// if options.PreserveWhitespace {
		// 	return stdout.String(), stderr.String(), err
		// }
		// return strings.TrimSpace(stdout.String()), strings.TrimSpace(stderr.String()), err	

	return nil
}
package terminal

import (
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/labstack/echo"
	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/kubernetes/auth"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"

	"github.com/gorilla/websocket"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	corev1 "k8s.io/client-go/kubernetes/typed/core/v1"
)

// PodCreationData stores the clients and names used to create pod and secret
type PodCreationData struct {
	Namespace    string
	PodClient    corev1.PodInterface
	SecretClient corev1.SecretInterface
	PodName      string
	SecretName   string
}

func (k *KubeTerminal) getClients() (corev1.PodInterface, corev1.SecretInterface, error) {

	// Create a token record for Token Auth using the Service Account token
	token := auth.NewKubeTokenAuthTokenRecord(k.PortalProxy, string(k.Token))
	config, err := k.Kube.GetConfigForEndpoint(k.APIServer, *token)
	if err != nil {
		return nil, nil, errors.New("Can not get Kubernetes config for specified endpoint")
	}
	kubeClient, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Error("Could not get kube client")
		return nil, nil, err
	}

	podClient := kubeClient.CoreV1().Pods(k.Namespace)
	secretsClient := kubeClient.CoreV1().Secrets(k.Namespace)
	return podClient, secretsClient, nil
}

// Create a pod for a user to run the Kube terminal
func (k *KubeTerminal) createPod(c echo.Context, kubeConfig, kubeVersion string, ws *websocket.Conn) (*PodCreationData, error) {
	// Unique ID for the secret and pod name
	id := uuid.NewV4().String()
	id = strings.ReplaceAll(id, "-", "")
	// Names for the secret and pod
	secretName := fmt.Sprintf("terminal-%s", id)
	podName := secretName
	podClient, secretClient, err := k.getClients()
	result := &PodCreationData{}
	result.Namespace = k.Namespace

	// Get the session ID
	sessionID := ""
	session, err := k.PortalProxy.GetSession(c)
	if err == nil {
		sessionID = session.ID
	}

	// Create the secret
	secretSpec := &v1.Secret{
		TypeMeta: metav1.TypeMeta{
			Kind:       "secret",
			APIVersion: "v1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      secretName,
			Namespace: k.Namespace,
		},
		Type: "Opaque",
	}

	setResourcMetadata(&secretSpec.ObjectMeta, sessionID)

	secretSpec.Data = make(map[string][]byte)
	secretSpec.Data["kubeconfig"] = []byte(kubeConfig)

	// Get Helm repository script if we have Helm repositories
	helmSetup := getHelmRepoSetupScript(k.PortalProxy)
	if len(helmSetup) > 0 {
		secretSpec.Data["helm-setup"] = []byte(helmSetup)
	}

	_, err = secretClient.Create(secretSpec)
	if err != nil {
		log.Warnf("Kubernetes Terminal: Unable to create Secret: %+v", err)
		return result, err
	}

	result.SecretClient = secretClient
	result.SecretName = secretName

	// Pod
	podSpec := &v1.Pod{
		TypeMeta: metav1.TypeMeta{
			Kind:       "pod",
			APIVersion: "v1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      podName,
			Namespace: k.Namespace,
		},
	}

	// Label the pod, so we can find it as a kube terminal pod
	setResourcMetadata(&podSpec.ObjectMeta, sessionID)

	// Don't mount a service account token
	off := false
	podSpec.Spec.AutomountServiceAccountToken = &off
	podSpec.Spec.EnableServiceLinks = &off
	podSpec.Spec.RestartPolicy = "Never"
	podSpec.Spec.DNSPolicy = "Default"
	
	volumeMountsSpec := make([]v1.VolumeMount, 1)
	volumeMountsSpec[0].Name = "kubeconfig"
	volumeMountsSpec[0].MountPath = "/home/stratos/.stratos"
	volumeMountsSpec[0].ReadOnly = true

	containerSpec := make([]v1.Container, 1)
	containerSpec[0].Name = consoleContainerName
	containerSpec[0].Image = k.Image
	containerSpec[0].ImagePullPolicy = "Always"
	containerSpec[0].VolumeMounts = volumeMountsSpec

	// Add env var for kube version
	containerSpec[0].Env = make([]v1.EnvVar, 1)
	containerSpec[0].Env[0].Name = "K8S_VERSION"
	containerSpec[0].Env[0].Value = kubeVersion
	
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
		log.Warnf("Kubernetes Terminal: Unable to create Pod: %+v", err)
		// Secret will get cleaned up by caller
		return result, err
	}

	result.PodClient = podClient
	result.PodName = podName

	sendProgressMessage(ws, "Waiting for Kubernetes Terminal to start up ...")

	// Wait for the pod to be running
	timeout := 60
	statusOptions := metav1.GetOptions{}
	for {
		status, err := podClient.Get(pod.Name, statusOptions)
		if err == nil && status.Status.Phase == "Running" {
			break;
		}

		timeout = timeout - 1
		if timeout == 0 {
			err = errors.New("Timed out waiting for pod to enter ready state")
			break
		}

		// Sleep
		time.Sleep(1500 * time.Millisecond)
	}

	return result, err
}

func setResourcMetadata(metadata *metav1.ObjectMeta, sessionID string) {
	// Label the kubeerntes resource, so we can find it as a kube terminal pod
	metadata.Labels = make(map[string]string)
	metadata.Labels[stratosRoleLabel] = stratosKubeTerminalRole
	metadata.Annotations = make(map[string]string)
	if len(sessionID) > 0 {
		metadata.Annotations[stratosSessionAnnotation] = sessionID
	}
}

// Cleanup the pod and secret
func (k *KubeTerminal) cleanupPodAndSecret(podData *PodCreationData) error {
	if len(podData.PodName) > 0 {
		//captureBashHistory(podData)
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
		log.Error("Could not send message to client to indicate terminal is starting")
	}
}

func (k *KubeTerminal) getKubeVersion(endpointID, userID string) (string, error) {
	response, err := k.PortalProxy.DoProxySingleRequest(endpointID, userID, "GET", "/api/v1/nodes", nil, nil)
	if err != nil || response.StatusCode != 200 {
		return "", errors.New("Could not fetch node list")
	}

	var nodes v1.NodeList
	err = json.Unmarshal(response.Response, &nodes)
	if err != nil {
		return "", errors.New("Could not unmarshal node list")
	}

	if len(nodes.Items) > 0 {
		// Get the version number - remove any 'v' perfix or '+' suffix
		version := nodes.Items[0].Status.NodeInfo.KubeletVersion
		reg, err := regexp.Compile("[^0-9\\.]+")
    if err == nil {
			version = reg.ReplaceAllString(version, "")
		}
		parts := strings.Split(version, ".")
		if len(parts) > 1 {
			v := fmt.Sprintf("%s.%s", parts[0], parts[1])
			return v, nil
		}
	}

	return "", errors.New("Can not get Kubernetes version")
}

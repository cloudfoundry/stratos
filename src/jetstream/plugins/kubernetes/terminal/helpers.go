package terminal

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v5"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes/auth"

	"github.com/coder/websocket"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	corev1 "k8s.io/client-go/kubernetes/typed/core/v1"
)

const (
	helmEndpointType        = "helm"
	helmRepoEndpointType    = "repo"
	startingProgressMessage = "Waiting for Kubernetes Terminal to start up ..."
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
		slog.Error("could not create the Kubernetes client for the terminal", "apiServer", k.APIServer, "namespace", k.Namespace, "error", err)
		return nil, nil, err
	}

	podClient := kubeClient.CoreV1().Pods(k.Namespace)
	secretsClient := kubeClient.CoreV1().Secrets(k.Namespace)
	return podClient, secretsClient, nil
}

// Create a pod for a user to run the Kube terminal
func (k *KubeTerminal) createPod(c *echo.Context, kubeConfig, kubeVersion string, ws *websocket.Conn) (*PodCreationData, error) {
	// Unique ID for the secret and pod name
	id := uuid.New().String()
	id = strings.ReplaceAll(id, "-", "")
	// Names for the secret and pod
	secretName := fmt.Sprintf("terminal-%s", id)
	podName := secretName
	podClient, secretClient, err := k.getClients()
	if err != nil {
		return nil, err
	}
	ctx := context.Background()
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

	sendProgressMessage(ws, startingProgressMessage)

	setResourcMetadata(&secretSpec.ObjectMeta, sessionID)

	secretSpec.Data = make(map[string][]byte)
	secretSpec.Data["kubeconfig"] = []byte(kubeConfig)

	// Get Helm repository script if we have Helm repositories
	helmSetup := getHelmRepoSetupScript(k.PortalProxy)
	if len(helmSetup) > 0 {
		secretSpec.Data["helm-setup"] = []byte(helmSetup)
	}

	sendProgressMessage(ws, startingProgressMessage)

	_, err = secretClient.Create(ctx, secretSpec, metav1.CreateOptions{})
	if err != nil {
		slog.Warn("Kubernetes Terminal could not create the secret", "secret", secretName, "namespace", k.Namespace, "error", err)
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

	sendProgressMessage(ws, startingProgressMessage)

	// Create a new pod
	pod, err := podClient.Create(ctx, podSpec, metav1.CreateOptions{})
	if err != nil {
		slog.Warn("Kubernetes Terminal could not create the pod", "pod", podName, "namespace", k.Namespace, "error", err)
		// Secret will get cleaned up by caller
		return result, err
	}

	result.PodClient = podClient
	result.PodName = podName

	// Wait for the pod to be running
	timeout := 60
	statusOptions := metav1.GetOptions{}
	for {
		// This ensures we keep the web socket alive while the container is creating
		sendProgressMessage(ws, startingProgressMessage)
		status, getErr := podClient.Get(ctx, pod.Name, statusOptions)
		if getErr == nil && status.Status.Phase == "Running" {
			break
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
func (k *KubeTerminal) cleanupPodAndSecret(podData *PodCreationData) {
	ctx := context.Background()
	if podData == nil {
		// Already been cleaned up
		return
	}

	if len(podData.PodName) > 0 {
		//captureBashHistory(podData)
		if err := podData.PodClient.Delete(ctx, podData.PodName, metav1.DeleteOptions{}); err != nil {
			slog.Warn("could not delete the Kubernetes Terminal pod", "pod", podData.PodName, "error", err)
		}
	}

	if len(podData.SecretName) > 0 {
		if err := podData.SecretClient.Delete(ctx, podData.SecretName, metav1.DeleteOptions{}); err != nil {
			slog.Warn("could not delete the Kubernetes Terminal secret", "secret", podData.SecretName, "error", err)
		}
	}
}

func getHelmRepoSetupScript(portalProxy api.PortalProxy) string {
	str := ""

	// Get all of the helm endpoints
	endpoints, err := portalProxy.ListEndpoints()
	if err != nil {
		slog.Error("could not list the Helm repository endpoints", "error", err)
		return str
	}

	for _, ep := range endpoints {
		if ep.CNSIType == helmEndpointType && ep.SubType == helmRepoEndpointType {
			// Remove spaces from the name
			name := strings.ReplaceAll(ep.Name, " ", "_")
			str += fmt.Sprintf("helm repo add %s %s > /dev/null\n", name, ep.APIEndpoint)
		}
	}

	return str
}

func sendProgressMessage(ws *websocket.Conn, progressMsg string) {
	// Send a message to say that we are creating the pod
	msg := fmt.Sprintf("\033]2;%s\007", progressMsg)
	bytes := fmt.Sprintf("% x\n", []byte(msg))
	if err := api.WriteText(ws, []byte(bytes)); err != nil {
		slog.Error("could not send the terminal progress message to the client", "progress", progressMsg, "error", err)
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
		reg, err := regexp.Compile(`[^0-9.]+`)
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

package dashboard

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"

	v1 "k8s.io/api/core/v1"
)

const (
	kubeDashSessionGroup       = "kubernetes-dashboard"
	kubeDashSessionEndpointID  = "kubeDashSessionEndpointID"
	kubeDashSessionNamespace   = "kubeDashSessionNamespace"
	kubeDashSessionScheme      = "kubeDashSessionScheme"
	kubeDashSessionServiceName = "kubeDashSessionServiceName"
	kubeDashSessionToken       = "kubeDashSessionToken"

	defaultFlushInterval = 200 * time.Millisecond
)

// ServiceInfo represents the information for the Dashboard Service
// that we need to proxy the service
type ServiceInfo struct {
	Namespace        string `json:"namespace"`
	ServiceName      string `json:"name"`
	Scheme           string `json:"scheme"`
	StratosInstalled bool   `json:"-"`
}

// StatusResponse is the response from the dashboard status check
type StatusResponse struct {
	Endpoint         string             `json:"guid"`
	Installed        bool               `json:"installed"`
	StratosInstalled bool               `json:"stratosInstalled"`
	Running          bool               `json:"running"`
	Pod              *v1.Pod            `json:"pod"`
	Version          string             `json:"version"`
	Service          *ServiceInfo       `json:"service"`
	HasToken         bool               `json:"tokenExists"`
	ServiceAccont    *v1.ServiceAccount `json:"serviceAccount"`
	Token            string             `json:"-"`
}

// Determine if the specified Kube endpoint has the dashboard installed and ready
func getKubeDashboardPod(p api.PortalProxy, cnsiGUID, userGUID string, labelSelector string) (*v1.Pod, error) {
	log.Debug("kubeDashboardStatus request")

	response, err := p.DoProxySingleRequest(cnsiGUID, userGUID, "GET", "/api/v1/pods?labelSelector="+labelSelector, nil, nil)
	if err != nil || response.StatusCode != 200 {
		return nil, errors.New("Could not fetch pod list")
	}

	ok, list, err := tryDecodePodList(response.Response)
	if !ok {
		return nil, errors.New("Kube dashboard not installed - could not decode pod list")
	}

	if len(list.Items) == 0 {
		return nil, errors.New("Kube dashboard not installed")
	}

	// Should just be one pod
	if len(list.Items) > 1 {
		return nil, errors.New("More than one Kubernetes Dashboard installation found")
	}

	pod := list.Items[0]
	return &pod, nil
}

// Get the service for the kubernetes dashboard
func getKubeDashboardService(p api.PortalProxy, cnsiGUID, userGUID string, labelSelector string) (ServiceInfo, error) {
	log.Debug("getKubeDashboardService request")

	info := ServiceInfo{}
	response, err := p.DoProxySingleRequest(cnsiGUID, userGUID, "GET", "/api/v1/services?labelSelector="+labelSelector, nil, nil)
	if err != nil || response.StatusCode != 200 {
		return info, errors.New("Could not fetch service list")
	}

	ok, list, err := tryDecodeServiceList(response.Response)
	if !ok {
		return info, errors.New("Kube dashboard not installed - could not decode service list")
	}

	if len(list.Items) == 0 {
		return info, errors.New("Kube dashboard not installed")
	}

	// Should just be one pod
	if len(list.Items) != 1 {
		return info, errors.New("Kube dashboard not installed - too many pods")
	}

	svc := list.Items[0]
	info.Namespace = svc.Namespace
	info.ServiceName = svc.Name
	info.Scheme = "http"

	if len(svc.Spec.Ports) > 0 {
		port := svc.Spec.Ports[0].Port
		if port == 443 {
			info.Scheme = "https"
		}
	}

	// Check the labels on the service
	info.StratosInstalled = hasAnnotation(svc.Labels, "stratos-role", "kubernetes-dashboard")

	return info, nil
}

func getKubeDashboardServiceInfo(p api.PortalProxy, endpointGUID, userGUID string) (ServiceInfo, error) {
	svc, err := getKubeDashboardService(p, endpointGUID, userGUID, "app%3Dkubernetes-dashboard")
	if err != nil {
		svc, err = getKubeDashboardService(p, endpointGUID, userGUID, "k8s-app%3Dkubernetes-dashboard")
	}
	return svc, err
}

// Get the service account for the kubernetes dashboard
func getKubeDashboardServiceAccount(p api.PortalProxy, cnsiGUID, userGUID string, labelSelector string) (*v1.ServiceAccount, error) {
	log.Debug("getKubeDashboardService request")

	response, err := p.DoProxySingleRequest(cnsiGUID, userGUID, "GET", "/api/v1/serviceaccounts?labelSelector="+labelSelector, nil, nil)
	if err != nil || response.StatusCode != 200 {
		return nil, errors.New("Could not fetch service account list")
	}

	ok, list, err := tryDecodeServiceAccountList(response.Response)
	if !ok {
		return nil, errors.New("Could not find service account for Kubernetes dashboard")
	}

	if len(list.Items) == 0 {
		return nil, errors.New("Could not find service account for Kubernetes dashboard")
	}

	// Should just be one pod
	if len(list.Items) != 1 {
		return nil, errors.New("Could not find service account for Kubernetes dashboard - too may accounts")
	}

	svcAccount := list.Items[0]
	return &svcAccount, nil
}

// Get the service account for the kubernetes dashboard
func getKubeDashboardSecretToken(p api.PortalProxy, cnsiGUID, userGUID string, sa *v1.ServiceAccount) (string, error) {
	log.Debug("getKubeDashboardSecretToken request")

	namespace := sa.Namespace

	if len(sa.Secrets) != 1 {
		return "", errors.New("Service Account has too many secrets - expecting only 1")
	}

	// Need to get all secrets in the namespace and find the one with the correct annotation
	apiURL := fmt.Sprintf("/api/v1/namespaces/%s/secrets", namespace)
	response, err := p.DoProxySingleRequest(cnsiGUID, userGUID, "GET", apiURL, nil, nil)
	if err != nil || response.StatusCode != 200 {
		return "", errors.New("Could not find secrets for Kubernetes dashboard")
	}

	ok, secrets, err := tryDecodeSecrets(response.Response)
	if !ok {
		return "", errors.New("Could not find secrets for Kubernetes dashboard")
	}

	for _, secret := range secrets.Items {
		if hasAnnotation(secret.Annotations, "kubernetes.io/service-account.name", sa.Name) {
			if token, ok := secret.Data["token"]; ok {
				return string(token), nil
			}
			return "", errors.New("Could not find token in the data for the Service Account Secret")
		}
	}

	return "", errors.New("Could not find token for the Service Account")
}

// Check string map for the given (key, value) pair
// Used to check if an annotation with the specified value if present on a resource
func hasAnnotation(annotations map[string]string, key, value string) bool {
	for k, v := range annotations {
		if k == key && v == value {
			return true
		}
	}
	return false
}

func tryDecodePodList(data []byte) (bool, v1.PodList, error) {
	var pods v1.PodList
	var err error

	err = json.Unmarshal(data, &pods)
	if err != nil {
		return false, pods, err
	}
	return true, pods, err
}

func tryDecodeServiceList(data []byte) (bool, v1.ServiceList, error) {
	var svcs v1.ServiceList
	var err error

	err = json.Unmarshal(data, &svcs)
	if err != nil {
		return false, svcs, err
	}
	return true, svcs, err
}

func tryDecodeServiceAccountList(data []byte) (bool, v1.ServiceAccountList, error) {
	var svcAccounts v1.ServiceAccountList
	var err error

	err = json.Unmarshal(data, &svcAccounts)
	if err != nil {
		return false, svcAccounts, err
	}
	return true, svcAccounts, err
}

func tryDecodeSecrets(data []byte) (bool, v1.SecretList, error) {
	var secrets v1.SecretList
	var err error

	err = json.Unmarshal(data, &secrets)
	if err != nil {
		return false, secrets, err
	}
	return true, secrets, err
}

// Send an error page that will get loaded into the IFRAME and the onload handler will detect
// it and show a Stratos error message
func sendErrorPage(c echo.Context, msg string) error {
	html := fmt.Sprintf("<html><body><stratos-error>%s</stratos-error></body></html>", msg)
	c.Response().Write([]byte(html))
	return nil
}

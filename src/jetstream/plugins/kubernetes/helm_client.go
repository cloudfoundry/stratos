package kubernetes

import (
	"errors"
	"fmt"

	log "github.com/sirupsen/logrus"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/helm/pkg/helm"
	"k8s.io/helm/pkg/helm/portforwarder"
	"k8s.io/helm/pkg/kube"

	// Import the OIDC auth plugin
	_ "k8s.io/client-go/plugin/pkg/client/auth/oidc"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

type KubeProxyError struct {
	Name string
}

type KubeProxyFunc func(*interfaces.ConnectedEndpoint, chan KubeProxyResponse)

type KubeProxyResponse struct {
	Endpoint string
	Result   interface{}
	Error    *KubeProxyError
}

type KubeProxyResponses map[string]interface{}

func (c *KubernetesSpecification) GetHelmClient(endpointGUID, userID string) (helm.Interface, *kubernetes.Clientset, *kube.Tunnel, error) {
	// Need to get a config object for the target endpoint
	var p = c.portalProxy

	cnsiRecord, err := p.GetCNSIRecord(endpointGUID)
	if err != nil {
		return nil, nil, nil, errors.New("Can not get endpoint record")
	}

	tokenRecord, ok := p.GetCNSITokenRecord(endpointGUID, userID)
	if !ok {
		return nil, nil, nil, errors.New("Can not get user token for endpoint")
	}

	config, err := GetConfigForEndpoint(cnsiRecord.APIEndpoint.String(), tokenRecord)
	if err != nil {
		return nil, nil, nil, errors.New("Can not get Kubernetes config for specified endpoint")
	}

	kubeClient, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Error("Could not get kube client")
		return nil, nil, nil, err
	}

	tillerTunnel, err := portforwarder.New("kube-system", kubeClient, config)
	if err != nil {
		log.Error("Could not establish port forwarding for Tiller")
		log.Error(err)
		return nil, nil, nil, err
	}

	log.Debugf("Tiller tunnel is using Port: %d", tillerTunnel.Local)

	// TODO: Concurrency?
	tillerHost := fmt.Sprintf("127.0.0.1:%d", tillerTunnel.Local)

	client := newClient(tillerHost)

	return client, kubeClient, tillerTunnel, nil
}

func (c *KubernetesSpecification) ProxyKubernetesAPI(userID string, f KubeProxyFunc) (KubeProxyResponses, error) {

	var p = c.portalProxy
	k8sList := make([]*interfaces.ConnectedEndpoint, 0)
	eps, err := p.ListEndpointsByUser(userID)
	if err != nil {
		return nil, fmt.Errorf("Could not get endpints Client for endpoint: %v+", err)
	}

	for _, endpoint := range eps {
		if endpoint.CNSIType == "k8s" {
			k8sList = append(k8sList, endpoint)
		}
	}

	// Check that we actually have some
	// TODO
	done := make(chan KubeProxyResponse)
	for _, endpoint := range k8sList {
		go f(endpoint, done)
	}

	responses := make(KubeProxyResponses)
	for range k8sList {
		res := <-done
		if res.Error == nil {
			responses[res.Endpoint] = res.Result
		} else {
			responses[res.Endpoint] = res.Error
		}
	}

	return responses, nil
}

// configForContext creates a Kubernetes REST client configuration for a given kubeconfig context.
func configForContext(context string, kubeconfig string) (*rest.Config, error) {
	config, err := kube.GetConfig(context, kubeconfig).ClientConfig()
	if err != nil {
		return nil, fmt.Errorf("could not get Kubernetes config for context %q: %s", context, err)
	}
	return config, nil
}

// getKubeClient creates a Kubernetes config and client for a given kubeconfig context.
func getKubeClient(context string, kubeconfig string) (*rest.Config, kubernetes.Interface, error) {
	config, err := configForContext(context, kubeconfig)
	if err != nil {
		return nil, nil, err
	}
	client, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, nil, fmt.Errorf("could not get Kubernetes client: %s", err)
	}
	return config, client, nil
}

func newClient(tillerHost string) helm.Interface {
	options := []helm.Option{helm.Host(tillerHost), helm.ConnectTimeout(20)}
	return helm.NewClient(options...)
}

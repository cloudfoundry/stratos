package kubernetes

import (
	"errors"
	"fmt"

	log "github.com/sirupsen/logrus"

	"k8s.io/client-go/kubernetes"
	"k8s.io/helm/pkg/helm"
	"k8s.io/helm/pkg/helm/portforwarder"
	"k8s.io/helm/pkg/kube"

	// Import the OIDC auth plugin
	_ "k8s.io/client-go/plugin/pkg/client/auth/oidc"
)

// GetHelmClient gets a client that can be used to talk to Tiller
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

	config, err := c.GetConfigForEndpoint(cnsiRecord.APIEndpoint.String(), tokenRecord)
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
	tillerHost := fmt.Sprintf("127.0.0.1:%d", tillerTunnel.Local)
	client := newClient(tillerHost)

	return client, kubeClient, tillerTunnel, nil
}

func newClient(tillerHost string) helm.Interface {
	options := []helm.Option{helm.Host(tillerHost), helm.ConnectTimeout(20)}
	return helm.NewClient(options...)
}

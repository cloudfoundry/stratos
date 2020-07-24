package kubernetes

import (
	"errors"
	"fmt"

	log "github.com/sirupsen/logrus"

	restclient "k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// GetConfigForEndpoint gets a config for the Kubernetes go-client for the specified endpoint
func (c *KubernetesSpecification) GetConfigForEndpoint(masterURL string, token interfaces.TokenRecord) (*restclient.Config, error) {
	return clientcmd.BuildConfigFromKubeconfigGetter(masterURL, func() (*clientcmdapi.Config, error) {
		return c.getKubeConfigForEndpoint(masterURL, token, "")
	})
}

// GetConfigForEndpointUser gets a kube config for the endpoint ID and user ID
func (c *KubernetesSpecification) GetConfigForEndpointUser(endpointID, userID string) (*restclient.Config, error) {

	var p = c.portalProxy
	cnsiRecord, err := p.GetCNSIRecord(endpointID)
	if err != nil {
		return nil, errors.New("Could not get endpoint information")
	}

	// Get token for this users
	tokenRec, ok := p.GetCNSITokenRecord(endpointID, userID)
	if !ok {
		return nil, errors.New("Could not get token")
	}

	return c.GetConfigForEndpoint(cnsiRecord.APIEndpoint.String(), tokenRec)
}

func (c *KubernetesSpecification) GetKubeConfigForEndpointUser(endpointID, userID string) (string, error) {

	var p = c.portalProxy
	cnsiRecord, err := p.GetCNSIRecord(endpointID)
	if err != nil {
		return "", errors.New("Could not get endpoint information")
	}

	// Get token for this users
	tokenRec, ok := p.GetCNSITokenRecord(endpointID, userID)
	if !ok {
		return "", errors.New("Could not get token")
	}

	return c.GetKubeConfigForEndpoint(cnsiRecord.APIEndpoint.String(), tokenRec, "")
}

func (c *KubernetesSpecification) getKubeConfigForEndpoint(masterURL string, token interfaces.TokenRecord, namespace string) (*clientcmdapi.Config, error) {

	name := "cluster-0"

	// Create a config

	// Initialize a new config
	context := clientcmdapi.NewContext()
	context.Cluster = name
	context.AuthInfo = name
	if len(namespace) > 0 {
		context.Namespace = namespace
	}

	// Configure the cluster
	cluster := clientcmdapi.NewCluster()
	cluster.Server = masterURL

	// TODO
	cluster.InsecureSkipTLSVerify = true

	// Configure auth information
	authInfo := clientcmdapi.NewAuthInfo()
	err := c.addAuthInfoForEndpoint(authInfo, token)

	config := clientcmdapi.NewConfig()
	config.Clusters[name] = cluster
	config.Contexts[name] = context
	config.AuthInfos[name] = authInfo
	config.CurrentContext = context.Cluster

	return config, err
}

// GetKubeConfigForEndpoint gets a Kube Config file contents for the specified endpoint
func (c *KubernetesSpecification) GetKubeConfigForEndpoint(masterURL string, token interfaces.TokenRecord, namespace string) (string, error) {

	config, err := c.getKubeConfigForEndpoint(masterURL, token, namespace)
	if err != nil {
		return "", err
	}

	kconfig, err := clientcmd.Write(*config)
	if err != nil {
		return "", err
	}

	return string(kconfig), nil
}

func (c *KubernetesSpecification) addAuthInfoForEndpoint(info *clientcmdapi.AuthInfo, tokenRec interfaces.TokenRecord) error {

	log.Debug("addAuthInfoForEndpoint")
	var authProvider = c.GetAuthProvider(tokenRec.AuthType)
	if authProvider == nil {
		return fmt.Errorf("Unsupported auth type: %s", tokenRec.AuthType)
	}

	return authProvider.AddAuthInfo(info, tokenRec)
}

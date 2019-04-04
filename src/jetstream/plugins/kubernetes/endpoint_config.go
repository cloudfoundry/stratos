package kubernetes

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	log "github.com/sirupsen/logrus"

	restclient "k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// GetConfigForEndpoint gets a config for the Kubernetes go-client for the specified endpoint
func (c *KubernetesSpecification) GetConfigForEndpoint(masterURL string, token interfaces.TokenRecord) (*restclient.Config, error) {
	return clientcmd.BuildConfigFromKubeconfigGetter(masterURL, func() (*clientcmdapi.Config, error) {

		log.Debug("GetConfigForEndpoint")

		name := "cluster-0"

		// Create a config

		// Initialize a new config
		context := clientcmdapi.NewContext()
		context.Cluster = name
		context.AuthInfo = name

		// Configure the cluster
		cluster := clientcmdapi.NewCluster()
		cluster.Server = masterURL
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
	})

}

func (c *KubernetesSpecification) addAuthInfoForEndpoint(info *clientcmdapi.AuthInfo, tokenRec interfaces.TokenRecord) error {

	log.Debug("addAuthInfoForEndpoint")
	log.Warn(tokenRec.AuthType)

	switch {
	case tokenRec.AuthType == "gke-auth":
		log.Warn("GKE AUTH")
		return c.addGKEAuth(info, tokenRec)
	case tokenRec.AuthType == AuthConnectTypeCertAuth, tokenRec.AuthType == AuthConnectTypeKubeConfigAz:
		return c.addCertAuth(info, tokenRec)
	case tokenRec.AuthType == AuthConnectTypeAWSIAM:
		return c.addAWSAuth(info, tokenRec)
	default:
		log.Error("Unsupported auth type")
	}
	return errors.New("Unsupported auth type")
}

func (c *KubernetesSpecification) addCertAuth(info *clientcmdapi.AuthInfo, tokenRec interfaces.TokenRecord) error {
	kubeAuthToken := &KubeCertAuth{}
	err := json.NewDecoder(strings.NewReader(tokenRec.AuthToken)).Decode(kubeAuthToken)
	if err != nil {
		return err
	}

	info.ClientCertificateData = []byte(kubeAuthToken.Certificate)
	info.ClientKeyData = []byte(kubeAuthToken.CertificateKey)
	info.Token = kubeAuthToken.Token

	return nil
}

func (c *KubernetesSpecification) addGKEAuth(info *clientcmdapi.AuthInfo, tokenRec interfaces.TokenRecord) error {
	gkeInfo := &GKEConfig{}
	err := json.Unmarshal([]byte(tokenRec.RefreshToken), &gkeInfo)
	if err != nil {
		return err
	}

	info.Token = tokenRec.AuthToken
	return nil
}

func (c *KubernetesSpecification) addAWSAuth(info *clientcmdapi.AuthInfo, tokenRec interfaces.TokenRecord) error {

	awsInfo := &AWSIAMUserInfo{}
	err := json.Unmarshal([]byte(tokenRec.RefreshToken), &awsInfo)
	if err != nil {
		return err
	}

	// NOTE: We really should check first to see if the token has expired before we try and get another

	// Get an access token
	token, err := c.getTokenIAM(*awsInfo)
	if err != nil {
		return fmt.Errorf("Could not get new token using the IAM info: %v+", err)
	}

	info.Token = token
	return nil
}

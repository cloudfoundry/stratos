package kubernetes

import (
	"encoding/json"
	"strings"

	log "github.com/sirupsen/logrus"

	restclient "k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// GetConfigForEndpoint gets a config for the Kubernetes go-client for the specified endpoint
func GetConfigForEndpoint(masterURL string, token interfaces.TokenRecord) (*restclient.Config, error) {
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
		err := addAuthInfoForEndpoint(authInfo, token)

		config := clientcmdapi.NewConfig()
		config.Clusters[name] = cluster
		config.Contexts[name] = context
		config.AuthInfos[name] = authInfo
		config.CurrentContext = context.Cluster

		return config, err
	})

}

func addAuthInfoForEndpoint(info *clientcmdapi.AuthInfo, tokenRec interfaces.TokenRecord) error {

	log.Debug("addAuthInfoForEndpoint")
	log.Debug(tokenRec.AuthType)

	// Assume certificate for now

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

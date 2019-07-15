package kubernetes

import (
	"encoding/base64"
	"errors"
	"fmt"
	"regexp"

	log "github.com/sirupsen/logrus"

	restclient "k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// GetConfigForEndpoint gets a config for the Kubernetes go-client for the specified endpoint
func (c *KubernetesSpecification) GetConfigForEndpoint(masterURL string, token interfaces.TokenRecord) (*restclient.Config, error) {
	return clientcmd.BuildConfigFromKubeconfigGetter(masterURL, func() (*clientcmdapi.Config, error) {

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

func (c *KubernetesSpecification) GetKubeConfigForEndpoint(masterURL string, token interfaces.TokenRecord) (string, error) {

	name := "config-0"
	clusterName := "cluster-0"
	userName := "user-0"

	// Create a config

	// Initialize a new config
	context := clientcmdapi.NewContext()
	context.Cluster = clusterName
	context.AuthInfo = userName

	// Configure the cluster
	cluster := clientcmdapi.NewCluster()
	cluster.Server = masterURL
	cluster.InsecureSkipTLSVerify = true

	// Configure auth information
	authInfo := clientcmdapi.NewAuthInfo()
	err := c.addAuthInfoForEndpoint(authInfo, token)

	config := clientcmdapi.NewConfig()
	config.Clusters[clusterName] = cluster
	config.Kind = "Config"
	config.Contexts[name] = context
	config.AuthInfos[userName] = authInfo
	config.CurrentContext = context.Cluster

	// Convert to string
	str := `apiVersion: v1
kind: Config
contexts:
- context:
		cluster: kube
		user: kube
	name: kube
clusters:
- cluster:
		insecure-skip-tls-verify: true
		server: %s
	name: kube
current-context: kube
preferences: {}
users:
- name: kube
	user:
`

	space := regexp.MustCompile(`\t`)
	s := space.ReplaceAllString(str, "  ")

	// Now append the auth details
	log.Infof("%+v", authInfo)

	if authInfo.ClientCertificateData != nil {
		s = fmt.Sprintf("%s    client-certificate-data: %s\n", s, base64.StdEncoding.EncodeToString(authInfo.ClientCertificateData))
	}
	if authInfo.ClientKeyData != nil {
		s = fmt.Sprintf("%s    client-key-data: %s\n", s, base64.StdEncoding.EncodeToString(authInfo.ClientKeyData))
	}

	return fmt.Sprintf(s, masterURL), err
}

func (c *KubernetesSpecification) addAuthInfoForEndpoint(info *clientcmdapi.AuthInfo, tokenRec interfaces.TokenRecord) error {

	log.Debug("addAuthInfoForEndpoint")
	var authProvider = c.GetAuthProvider(tokenRec.AuthType)
	if authProvider == nil {
		return errors.New("Unsupported auth type")
	}

	return authProvider.AddAuthInfo(info, tokenRec)
}

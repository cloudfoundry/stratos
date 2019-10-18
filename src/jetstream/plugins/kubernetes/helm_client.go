package kubernetes

import (
	"errors"
	"io/ioutil"
	"path"

	log "github.com/sirupsen/logrus"

	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"k8s.io/cli-runtime/pkg/resource"
	"k8s.io/client-go/discovery"
	cached "k8s.io/client-go/discovery/cached"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
	"k8s.io/kubectl/pkg/validation"

	restclient "k8s.io/client-go/rest"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/kube"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"

	// Import the OIDC auth plugin
	_ "k8s.io/client-go/plugin/pkg/client/auth/oidc"
)

// GetHelmConfiguration - gets a Helm V3 client for using it as a client library
func (c *KubernetesSpecification) GetHelmConfiguration(endpointGUID, userID, namespace string) (*action.Configuration, error) {
	// Need to get a config object for the target endpoint
	var p = c.portalProxy

	cnsiRecord, err := p.GetCNSIRecord(endpointGUID)
	if err != nil {
		return nil, errors.New("Helm: Can not get endpoint record")
	}

	tokenRecord, ok := p.GetCNSITokenRecord(endpointGUID, userID)
	if !ok {
		return nil, errors.New("Helm: Can not get user token for endpoint")
	}

	kubeconfigcontents, err := c.GetKubeConfigForEndpoint(cnsiRecord.APIEndpoint.String(), tokenRecord)
	if err != nil {
		log.Errorf("Helm: Could not get kubeconfig for endpoint: %s", err)
		return nil, errors.New("Can not get Kubernetes config for specified endpoint")
	}

	// TODO: Some auth schemes needs to have the token refreshed - so we should do that first
	// to ensure it is valid when we use it subsequently

	// Temporary folder
	//tempDir, err := ioutil.TempDir("", "helm-client-")

	tempDir := "/Users/nwm/helm-client"
	kubeConfigPath := path.Join(tempDir, "kubeconfig")

	// Write kubeconfig to this folder
	err = ioutil.WriteFile(kubeConfigPath, []byte(kubeconfigcontents), 0644)
	if err != nil {
		log.Errorf("Helm: Could not get kubeconfig for endpoint: %s", err)
		return nil, errors.New("Can not get Kubernetes config for specified endpoint")
	}

	var nopLogger = func(a string, b ...interface{}) {
		log.Infof(a, b)
	}

	var actionConfig action.Configuration
	kubeconfig := kube.GetConfig(kubeConfigPath, "kube", namespace)

	kc := kube.New(kubeconfig)
	kc.Log = nopLogger

	clientset, err := kc.Factory.KubernetesClientSet()
	if err != nil {
		return nil, err
	}

	var store *storage.Storage
	d := driver.NewSecrets(clientset.CoreV1().Secrets(namespace))
	d.Log = nopLogger
	store = storage.Init(d)

	actionConfig.RESTClientGetter = kubeconfig
	actionConfig.KubeClient = kc
	actionConfig.Releases = store
	actionConfig.Log = nopLogger

	return &actionConfig, nil
}

//defer os.RemoveAll(tempDir)

// Create a temporary folder, write out a kubeconfig and configure using that file

// kubeClient is *kubernetes.Clientset
// 	kubeClient, err := kubernetes.NewForConfig(config)
// 	if err != nil {
// 		log.Errorf("Helm: Could not get kube client: %s", err)
// 		return nil, err
// 	}

// 	// What do we have?
// 	// kubeClient is *kubernetes.Clientset
// 	// config is *restclient.Config

// 	var actionConfig action.Configuration

// 	// TODO: Check this
// 	kubeconfig := newJetStreamRCGictionFactory(config, kubeClient)

// 	// We only work for Helm 3 storing info in secrets (not config maps)
// 	var store *storage.Storage
// 	d := driver.NewSecrets(kubeClient.CoreV1().Secrets(namespace))
// 	store = storage.Init(d)

// 	factory := newFictionFactory(kubeClient, kubeconfig, namespace)

// 	var nopLogger = func(a string, b ...interface{}) {
// 		log.Infof(a, b)
// 	}

// 	client := &kube.Client{
// 		Factory: factory,
// 		Log:     nopLogger,
// 	}

// 	actionConfig.RESTClientGetter = kubeconfig
// 	actionConfig.KubeClient = client
// 	actionConfig.Releases = store
// 	//actionConfig.Log = log//

// 	return &actionConfig, nil
// }

type fictionFactory struct {
	kubeClient *kubernetes.Clientset
	getter     genericclioptions.RESTClientGetter
	namespace  string
}

func newFictionFactory(kubeClient *kubernetes.Clientset, getter genericclioptions.RESTClientGetter, namespace string) kube.Factory {

	f := &fictionFactory{
		kubeClient: kubeClient,
		getter:     getter,
		namespace:  namespace,
	}
	return f
}

// ToRawKubeConfigLoader return kubeconfig loader as-is
func (f *fictionFactory) ToRawKubeConfigLoader() clientcmd.ClientConfig {
	log.Warn("Was NOT expecting this to be used: ToRawKubeConfigLoader")
	return newFictionClientConfig(f.namespace)
}

// KubernetesClientSet gives you back an external clientset
func (f *fictionFactory) KubernetesClientSet() (*kubernetes.Clientset, error) {
	log.Warn("KubernetesClientSet requested")
	return f.kubeClient, nil
}

// 	// NewBuilder returns an object that assists in loading objects from both disk and the server
// 	// and which implements the common patterns for CLI interactions with generic resources.
// 	NewBuilder() *resource.Builder

func (f *fictionFactory) NewBuilder() *resource.Builder {
	return resource.NewBuilder(f.getter)
}

// 	// Returns a schema that can validate objects stored on disk.
// 	Validator(validate bool) (validation.Schema, error)

func (f *fictionFactory) Validator(validate bool) (validation.Schema, error) {
	log.Fatal("Was NOT expecting this to be used: Validator")
	return nil, nil
}

type jetStreamRCG struct {
	config     *restclient.Config
	kubeClient *kubernetes.Clientset
}

func newJetStreamRCGictionFactory(config *restclient.Config, kubeClient *kubernetes.Clientset) *jetStreamRCG {

	f := &jetStreamRCG{
		config:     config,
		kubeClient: kubeClient,
	}
	return f
}

// ToRESTConfig returns restconfig
func (f *jetStreamRCG) ToRESTConfig() (*restclient.Config, error) {
	log.Warn("Was NOT expecting this to be used: ToRESTConfig")
	return f.config, nil
}

// ToDiscoveryClient returns discovery client
func (f *jetStreamRCG) ToDiscoveryClient() (discovery.CachedDiscoveryInterface, error) {
	return cached.NewMemCacheClient(f.kubeClient.Discovery()), nil
}

// ToRESTMapper returns a restmapper
func (f *jetStreamRCG) ToRESTMapper() (meta.RESTMapper, error) {
	log.Fatal("Was NOT expecting this to be used: ToRESTMapper")
	return nil, nil
}

// ToRawKubeConfigLoader return kubeconfig loader as-is
func (f *jetStreamRCG) ToRawKubeConfigLoader() clientcmd.ClientConfig {
	log.Fatal("Was NOT expecting this to be used: ToRawKubeConfigLoader")
	return nil
}

type fictionClientConfig struct {
	namespace string
}

func newFictionClientConfig(namespace string) *fictionClientConfig {

	f := &fictionClientConfig{
		namespace: namespace,
	}
	return f
}

// RawConfig returns the merged result of all overrides
func (f *fictionClientConfig) RawConfig() (clientcmdapi.Config, error) {
	log.Fatal("Was NOT expecting this to be used: RawConfig")
	c := clientcmdapi.NewConfig()
	return *c, nil
}

// ClientConfig returns a complete client config
func (f *fictionClientConfig) ClientConfig() (*restclient.Config, error) {
	log.Warn("Was NOT expecting this to be used: ClientConfig")
	return nil, nil
}

func (f *fictionClientConfig) Namespace() (string, bool, error) {
	return f.namespace, false, nil
}

func (f *fictionClientConfig) ConfigAccess() clientcmd.ConfigAccess {
	return clientcmd.NewDefaultClientConfigLoadingRules()
}

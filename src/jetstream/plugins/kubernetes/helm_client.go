package kubernetes

import (
	"errors"
	"fmt"
	"io/ioutil"
	"log/slog"
	"os"
	"sync"
	"time"

	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/client-go/discovery"
	diskcached "k8s.io/client-go/discovery/cached/disk"
	"k8s.io/client-go/restmapper"
	"k8s.io/client-go/tools/clientcmd"

	restclient "k8s.io/client-go/rest"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/kube"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"

	// Import the OIDC auth plugin
	_ "k8s.io/client-go/plugin/pkg/client/auth/oidc"
)

// HelmConfiguration stores any resources that need to be cleaned up after use
type HelmConfiguration struct {
	Folder string
}

// Cleanup any resources associated with the Helm configuration
func (f *HelmConfiguration) Cleanup() {
	if len(f.Folder) > 0 {
		os.RemoveAll(f.Folder)
	}
}

// The Helm API we use is not thead safe, so use a lock to make sure only one call at a time
var lock sync.Mutex

// GetHelmConfiguration - gets a Helm V3 client for using it as a client library
func (c *KubernetesSpecification) GetHelmConfiguration(endpointGUID, userID, namespace string) (*action.Configuration, *HelmConfiguration, error) {
	// Need to get a config object for the target endpoint
	var p = c.portalProxy

	hc := &HelmConfiguration{}

	cnsiRecord, err := p.GetCNSIRecord(endpointGUID)
	if err != nil {
		return nil, hc, errors.New("Helm: Can not get endpoint record")
	}

	tokenRecord, ok := p.GetCNSITokenRecord(endpointGUID, userID)
	if !ok {
		return nil, hc, errors.New("Helm: Can not get user token for endpoint")
	}

	lock.Lock()
	defer lock.Unlock()

	kubeconfigcontents, err := c.GetKubeConfigForEndpoint(cnsiRecord.APIEndpoint.String(), tokenRecord, namespace)
	if err != nil {
		slog.Error("could not get the kubeconfig for the endpoint", "endpoint", endpointGUID, "user", userID, "namespace", namespace, "error", err)
		return nil, hc, errors.New("Can not get Kubernetes config for specified endpoint")
	}

	// TODO: Some auth schemes needs to have the token refreshed - so we should do that first
	// to ensure it is valid when we use it subsequently

	// The folder backs the discovery cache; without it the Helm client would
	// cache into the working directory, so this is fatal rather than ignorable
	hc.Folder, err = ioutil.TempDir("", "helm-client-")
	if err != nil {
		const msg = "unable to create the temporary folder for the Helm client"
		slog.Error(msg, "endpoint", endpointGUID, "user", userID, "error", err)
		return nil, hc, fmt.Errorf("%s: %w", msg, err)
	}

	rcg, err := newJetStreamRCGetter([]byte(kubeconfigcontents), hc.Folder, namespace)
	if err != nil {
		const msg = "unable to build the Kubernetes client config for the Helm client"
		slog.Error(msg, "endpoint", endpointGUID, "user", userID, "namespace", namespace, "error", err)
		return nil, hc, fmt.Errorf("%s: %w", msg, err)
	}

	// Helm's logger is a printf-style callback, so the format string has to be
	// expanded here rather than carried as attributes
	var nopLogger = func(a string, b ...interface{}) {
		slog.Debug(fmt.Sprintf(a, b...))
	}

	var actionConfig action.Configuration

	kc := kube.New(rcg)
	kc.Log = nopLogger

	clientset, err := kc.Factory.KubernetesClientSet()
	if err != nil {
		return nil, hc, err
	}

	var store *storage.Storage
	d := driver.NewSecrets(clientset.CoreV1().Secrets(namespace))
	d.Log = nopLogger
	store = storage.Init(d)

	actionConfig.RESTClientGetter = rcg
	actionConfig.KubeClient = kc
	actionConfig.Releases = store
	actionConfig.Log = nopLogger

	return &actionConfig, hc, nil
}

type jetStreamRestClientGetter struct {
	clientConfig clientcmd.ClientConfig
	tempFolder   string
}

func newJetStreamRCGetter(kubeconfig []byte, tempFolder string, namespace string) (*jetStreamRestClientGetter, error) {

	// A nil clientConfig here would panic later in ToRESTConfig, so the error
	// has to reach the caller
	clientConfig, err := clientcmd.NewClientConfigFromBytes(kubeconfig)
	if err != nil {
		return nil, err
	}

	f := &jetStreamRestClientGetter{
		clientConfig: clientConfig,
		tempFolder:   tempFolder,
	}
	return f, nil
}

// ToRESTConfig returns restconfig
func (f *jetStreamRestClientGetter) ToRESTConfig() (*restclient.Config, error) {
	return f.clientConfig.ClientConfig()
}

// ToRawKubeConfigLoader binds config flag values to config overrides
// Returns an interactive clientConfig if the password flag is enabled,
// or a non-interactive clientConfig otherwise.
func (f *jetStreamRestClientGetter) ToRawKubeConfigLoader() clientcmd.ClientConfig {
	return f.clientConfig
}

// ToDiscoveryClient returns discovery client
func (f *jetStreamRestClientGetter) ToDiscoveryClient() (discovery.CachedDiscoveryInterface, error) {
	config, err := f.ToRESTConfig()
	if err != nil {
		return nil, err
	}

	// The more groups you have, the more discovery requests you need to make.
	// given 25 groups (our groups + a few custom resources) with one-ish version each, discovery needs to make 50 requests
	// double it just so we don't end up here again for a while.  This config is only used for discovery.
	config.Burst = 100

	httpCacheDir := f.tempFolder
	discoveryCacheDir := f.tempFolder
	return diskcached.NewCachedDiscoveryClientForConfig(config, discoveryCacheDir, httpCacheDir, time.Duration(10*time.Minute))
}

// ToRESTMapper returns a mapper.
func (f *jetStreamRestClientGetter) ToRESTMapper() (meta.RESTMapper, error) {
	discoveryClient, err := f.ToDiscoveryClient()
	if err != nil {
		return nil, err
	}

	mapper := restmapper.NewDeferredDiscoveryRESTMapper(discoveryClient)
	expander := restmapper.NewShortcutExpander(mapper, discoveryClient, func(resource string) {})
	return expander, nil
}

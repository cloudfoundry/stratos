package terminal

import (
	"fmt"
	"io/ioutil"
	"log/slog"

	jetstream_api "github.com/cloudfoundry/stratos/src/jetstream/api"
	jetstream_config "github.com/cloudfoundry/stratos/src/jetstream/api/config"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes/api"
)

const (
	serviceAccountTokenFile = "/var/run/secrets/kubernetes.io/serviceaccount/token"
	serviceAccountCAFile    = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"
	serviceHostEnvVar       = "KUBERNETES_SERVICE_HOST"
	servicePortEnvVar       = "KUBERNETES_SERVICE_PORT"
	// For dev - read token from env var
	serviceTokenEnvVar = "KUBE_TERMINAL_SERVICE_ACCOUNT_TOKEN"

	stratosRoleLabel         = "stratos-role"
	stratosKubeTerminalRole  = "kube-terminal"
	stratosSessionAnnotation = "stratos-session"

	consoleContainerName = "kube-terminal"
)

// KubeTerminal supports spawning pods to provide a CLI environment to the user
type KubeTerminal struct {
	PortalProxy jetstream_api.PortalProxy
	Namespace   string `configName:"STRATOS_KUBERNETES_NAMESPACE"`
	Image       string `configName:"STRATOS_KUBERNETES_TERMINAL_IMAGE"`
	Token       []byte
	APIServer   string
	CACert      []byte
	Kube        api.Kubernetes
}

// NewKubeTerminal checks that the environment is set up to support the Kube Terminal
func NewKubeTerminal(p jetstream_api.PortalProxy) *KubeTerminal {
	// Only enabled in tech preview
	if !p.GetConfig().EnableTechPreview {
		slog.Info("Kubernetes Terminal not enabled, it requires tech preview")
		return nil
	}

	kt := &KubeTerminal{
		PortalProxy: p,
	}
	if err := jetstream_config.Load(kt, p.Env().Lookup); err != nil {
		slog.Warn("unable to load the Kubernetes Terminal configuration", "error", err)
		return nil
	}

	// Check that we have everything we need
	if len(kt.Image) == 0 || len(kt.Namespace) == 0 {
		slog.Warn("the Kubernetes Terminal configuration is not complete", "image", kt.Image, "namespace", kt.Namespace)
		return nil
	}

	// Read the Kubernetes API Endpoint
	host, hostFound := p.Env().Lookup(serviceHostEnvVar)
	port, portFound := p.Env().Lookup(servicePortEnvVar)
	if !hostFound || !portFound {
		slog.Warn("Kubernetes API server configuration not found", "hostEnvVar", serviceHostEnvVar, "hostFound", hostFound, "portEnvVar", servicePortEnvVar, "portFound", portFound)
		return nil
	}
	kt.APIServer = fmt.Sprintf("https://%s:%s", host, port)

	// Read the Service Account Token
	token, err := ioutil.ReadFile(serviceAccountTokenFile)
	if err != nil {
		// Check env var
		tkn, found := p.Env().Lookup(serviceTokenEnvVar)
		if !found {
			slog.Warn("unable to load the service account token", "file", serviceAccountTokenFile, "envVar", serviceTokenEnvVar, "error", err)
			return nil
		}
		token = []byte(tkn)
	}

	kt.Token = token

	// Read the in-cluster CA so the API server's certificate can be verified.
	// Absent only in the env-var-token dev setup, which falls back to
	// skipping verification.
	if caCert, err := ioutil.ReadFile(serviceAccountCAFile); err == nil {
		kt.CACert = caCert
	} else {
		slog.Warn("unable to load the Kubernetes CA certificate, API server TLS verification is disabled", "file", serviceAccountCAFile, "error", err)
	}

	slog.Debug("Kubernetes Terminal configured", "apiServer", kt.APIServer, "namespace", kt.Namespace, "image", kt.Image)
	return kt
}

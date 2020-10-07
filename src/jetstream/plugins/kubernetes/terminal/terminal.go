package terminal

import (
	"fmt"
	"io/ioutil"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/kubernetes/api"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces/config"

	log "github.com/sirupsen/logrus"
)

const (
	serviceAccountTokenFile = "/var/run/secrets/kubernetes.io/serviceaccount/token"
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
	PortalProxy interfaces.PortalProxy
	Namespace   string `configName:"STRATOS_KUBERNETES_NAMESPACE"`
	Image       string `configName:"STRATOS_KUBERNETES_TERMINAL_IMAGE"`
	Token       []byte
	APIServer   string
	Kube        api.Kubernetes
}

// NewKubeTerminal checks that the environment is set up to support the Kube Terminal
func NewKubeTerminal(p interfaces.PortalProxy) *KubeTerminal {
	// Only enabled in tech preview
	if !p.GetConfig().EnableTechPreview {
		log.Info("Kube Terminal not enabled - requires tech preview")
		return nil
	}

	kt := &KubeTerminal{
		PortalProxy: p,
	}
	if err := config.Load(kt, p.Env().Lookup); err != nil {
		log.Warnf("Unable to load Kube Terminal configuration. %v", err)
		return nil
	}

	// Check that we have everything we need
	if len(kt.Image) == 0 || len(kt.Namespace) == 0 {
		log.Warn("Kube Terminal configuration is not complete")
		return nil
	}

	// Read the Kubernetes API Endpoint
	host, hostFound := p.Env().Lookup(serviceHostEnvVar)
	port, portFound := p.Env().Lookup(servicePortEnvVar)
	if !hostFound || !portFound {
		log.Warn("Kubernetes API Server configuration not found (host and/or port env vars not set)")
		return nil
	}
	kt.APIServer = fmt.Sprintf("https://%s:%s", host, port)

	// Read the Service Account Token
	token, err := ioutil.ReadFile(serviceAccountTokenFile)
	if err != nil {
		// Check env var
		tkn, found := p.Env().Lookup(serviceTokenEnvVar)
		if !found {
			log.Warnf("Unable to load Service Account token. %v", err)
			return nil
		}
		token = []byte(tkn)
	}

	kt.Token = token

	log.Debug("Kubernetes Terminal configured")
	return kt
}

package terminal

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces/config"

	log "github.com/sirupsen/logrus"
)

// KubeTerminal supports spawning pods to provide a CLI environment to the user
type KubeTerminal struct {
	Namespace string `configName:"STRATOS_KUBERNETES_NAMESPACE"`
	Image     string `configName:"STRATOS_KUBERNETES_TERMINAL_IMAGE"`
	Token     string `configName:"STRATOS_NAMESPACE"`
}

// NewKubeTerminal checks that the environment is set up to support the Kube Terminal
func NewKubeTerminal(p interfaces.PortalProxy) *KubeTerminal {

	kt := &KubeTerminal{}
	if err := config.Load(kt, p.Env().Lookup); err != nil {
		log.Warn("Unable to load Kube Terminal configuration. %v", err)
		return nil
	}

	// Check that we have everything we need
	if len(kt.Image) == 0 || len(kt.Namespace) == 0 || len(kt.Token) == 0 {
		log.Warn("Kube Terminal configuration is not complete")
		return nil
	}

	log.Info("Kubernetes Terminal configured")

	return kt
}

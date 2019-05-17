package kubernetes

import (
	"strings"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/kubernetes/auth"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

var kubeAuthProviders map[string]auth.KubeAuthProvider

// AddAuthProvider adds a Kubernetes auth provider
func (c *KubernetesSpecification) AddAuthProvider(provider auth.KubeAuthProvider) {
	if provider == nil {
		return
	}

	var name = provider.GetName()
	if kubeAuthProviders == nil {
		kubeAuthProviders = make(map[string]auth.KubeAuthProvider)
	}

	kubeAuthProviders[name] = provider

	// Register auth type with Jetstream
	c.portalProxy.AddAuthProvider(name, interfaces.AuthProvider{
		Handler:  provider.DoFlowRequest,
		UserInfo: provider.GetUserFromToken,
	})

}

// GetAuthProvider gets a Kubernetes auth provider by key
func (c *KubernetesSpecification) GetAuthProvider(name string) auth.KubeAuthProvider {
	return kubeAuthProviders[name]
}

// FindAuthProvider finds auth provider - case insensitive
func (c *KubernetesSpecification) FindAuthProvider(name string) auth.KubeAuthProvider {
	for k, v := range kubeAuthProviders {
		if strings.EqualFold(name, k) {
			return v
		}
	}

	return nil
}

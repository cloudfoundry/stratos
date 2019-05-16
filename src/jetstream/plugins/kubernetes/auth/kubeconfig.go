package auth

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

const AuthConnectTypeKubeConfig   = "KubeConfig"

// KubeConfigAuth is same as OIDC with different name
type KubeConfigAuth struct {
	OIDCKubeAuth
}

// InitKubeConfigAuth
func InitKubeConfigAuth(portalProxy interfaces.PortalProxy) KubeAuthProvider {
	return &KubeConfigAuth{*InitOIDCKubeAuth(portalProxy)}
}

func (c *KubeConfigAuth) GetName() string {
	return AuthConnectTypeKubeConfig
}

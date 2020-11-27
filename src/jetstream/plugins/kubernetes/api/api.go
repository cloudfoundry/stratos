package api

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"

	restclient "k8s.io/client-go/rest"
)

type Kubernetes interface {
	GetConfigForEndpoint(masterURL string, token interfaces.TokenRecord) (*restclient.Config, error)
	GetKubeConfigForEndpoint(masterURL string, token interfaces.TokenRecord, namespace string) (string, error)
}

package api

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"

	restclient "k8s.io/client-go/rest"
)

type Kubernetes interface {
	GetConfigForEndpoint(masterURL string, token api.TokenRecord) (*restclient.Config, error)
	GetKubeConfigForEndpoint(masterURL string, token api.TokenRecord, namespace string) (string, error)
}

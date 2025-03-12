package auth

import (
	"crypto/tls"
	"encoding/json"
	"net/http"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"

	"github.com/labstack/echo/v4"
)

// KubeAuthProvider is the interface for Kubernetes Authentication Providers
type KubeAuthProvider interface {
	GetName() string
	AddAuthInfo(info *clientcmdapi.AuthInfo, tokenRec api.TokenRecord) error
	FetchToken(cnsiRecord api.CNSIRecord, ec echo.Context) (*api.TokenRecord, *api.CNSIRecord, error)

	RegisterJetstreamAuthType(portal api.PortalProxy)
}

// KubeJetstreamAuthProvider is the optional interface that can be implemented if you want to control Jetstream Auth Registration
type KubeJetstreamAuthProvider interface {
	DoFlowRequest(cnsiRequest *api.CNSIRequest, req *http.Request) (*http.Response, error)
	GetUserFromToken(cnsiGUID string, tokenRecord *api.TokenRecord) (*api.ConnectedUser, bool)
}

// KubeCertificate represents certificate infor for Kube Authentication
type KubeCertificate struct {
	Certificate    string `json:"cert"`
	CertificateKey string `json:"certKey"`
	Token          string `json:"token,omitempty"`
}

// GetJSON persists the config to JSON
func (k *KubeCertificate) GetJSON() (string, error) {
	jsonString, err := json.Marshal(k)
	if err != nil {
		return "", err
	}
	return string(jsonString), nil
}

// GetCerticate gets a certiciate from the info available
func (k *KubeCertificate) GetCerticate() (tls.Certificate, error) {
	cert, err := tls.X509KeyPair([]byte(k.Certificate), []byte(k.CertificateKey))
	if err != nil {
		return tls.Certificate{}, err
	}
	return cert, nil
}

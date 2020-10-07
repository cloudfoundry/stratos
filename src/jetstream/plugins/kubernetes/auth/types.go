package auth

import (
	"crypto/tls"
	"encoding/json"
	"net/http"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"

	"github.com/labstack/echo/v4"
)

// KubeAuthProvider is the interface for Kubernetes Authentication Providers
type KubeAuthProvider interface {
	GetName() string
	AddAuthInfo(info *clientcmdapi.AuthInfo, tokenRec interfaces.TokenRecord) error
	FetchToken(cnsiRecord interfaces.CNSIRecord, ec echo.Context) (*interfaces.TokenRecord, *interfaces.CNSIRecord, error)

	RegisterJetstreamAuthType(portal interfaces.PortalProxy)
}

// KubeJetstreamAuthProvider is the optional interface that can be implemented if you want to control Jetstream Auth Registration
type KubeJetstreamAuthProvider interface {
	DoFlowRequest(cnsiRequest *interfaces.CNSIRequest, req *http.Request) (*http.Response, error)
	GetUserFromToken(cnsiGUID string, tokenRecord *interfaces.TokenRecord) (*interfaces.ConnectedUser, bool)
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

package auth

import (
	"encoding/base64"
	"errors"
	"fmt"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

const authConnectTypeBasicAuth = "creds"

// KubeBasicAuth is HTTP Basic Authentication
type KubeBasicAuth struct {
	portalProxy interfaces.PortalProxy
}

// InitKubeBasicAuth creates a GKEKubeAuth
func InitKubeBasicAuth(portalProxy interfaces.PortalProxy) *KubeBasicAuth {
	return &KubeBasicAuth{portalProxy: portalProxy}
}

// GetName returns the provider name
func (c *KubeBasicAuth) GetName() string {
	return authConnectTypeBasicAuth
}

func (c *KubeBasicAuth) AddAuthInfo(info *clientcmdapi.AuthInfo, tokenRec interfaces.TokenRecord) error {
	// Decode the token
	authString, err := base64.StdEncoding.DecodeString(tokenRec.AuthToken)
	if err != nil {
		return err
	}

	// Password is separated by a colon from the username
	info.Username = tokenRec.RefreshToken
	basicAuth := string(authString)
	info.Password = basicAuth[len(info.Username)+1:]

	return nil
}

func (c *KubeBasicAuth) FetchToken(cnsiRecord interfaces.CNSIRecord, ec echo.Context) (*interfaces.TokenRecord, *interfaces.CNSIRecord, error) {

	log.Info("FetchToken")

	username := ec.FormValue("username")
	password := ec.FormValue("password")

	if len(username) == 0 || len(password) == 0 {
		return nil, &cnsiRecord, errors.New("Needs username and password")
	}

	authString := fmt.Sprintf("%s:%s", username, password)
	base64EncodedAuthString := base64.StdEncoding.EncodeToString([]byte(authString))

	tr := &interfaces.TokenRecord{
		AuthType:     interfaces.AuthTypeHttpBasic,
		AuthToken:    base64EncodedAuthString,
		RefreshToken: username,
	}

	return tr, &cnsiRecord, nil
}

func (c *KubeBasicAuth) GetUserFromToken(cnsiGUID string, cfTokenRecord *interfaces.TokenRecord) (*interfaces.ConnectedUser, bool) {
	return &interfaces.ConnectedUser{
		GUID: "Kube Cert Auth",
		Name: "Cert Auth",
	}, true
}

func (c *KubeBasicAuth) RegisterJetstreamAuthType(portal interfaces.PortalProxy) {
	// Not needed - 'creds' is built-in
}

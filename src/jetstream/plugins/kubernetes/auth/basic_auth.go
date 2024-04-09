package auth

import (
	"encoding/base64"
	"errors"
	"fmt"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

const authConnectTypeBasicAuth = "creds"
const authTypeHttpBasic = "HttpBasic"

// KubeBasicAuth is HTTP Basic Authentication
type KubeBasicAuth struct {
	portalProxy api.PortalProxy
}

// InitKubeBasicAuth creates a GKEKubeAuth
func InitKubeBasicAuth(portalProxy api.PortalProxy) *KubeBasicAuth {
	return &KubeBasicAuth{portalProxy: portalProxy}
}

// GetName returns the provider name
func (c *KubeBasicAuth) GetName() string {
	return authConnectTypeBasicAuth
}

func (c *KubeBasicAuth) AddAuthInfo(info *clientcmdapi.AuthInfo, tokenRec api.TokenRecord) error {
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

func (c *KubeBasicAuth) FetchToken(cnsiRecord api.CNSIRecord, ec echo.Context) (*api.TokenRecord, *api.CNSIRecord, error) {

	log.Info("FetchToken")

	username := ec.FormValue("username")
	password := ec.FormValue("password")

	if len(username) == 0 || len(password) == 0 {
		return nil, &cnsiRecord, errors.New("Needs username and password")
	}

	authString := fmt.Sprintf("%s:%s", username, password)
	base64EncodedAuthString := base64.StdEncoding.EncodeToString([]byte(authString))

	tr := &api.TokenRecord{
		AuthType:     authConnectTypeBasicAuth,
		AuthToken:    base64EncodedAuthString,
		RefreshToken: username,
	}

	return tr, &cnsiRecord, nil
}

func (c *KubeBasicAuth) GetUserFromToken(cnsiGUID string, cfTokenRecord *api.TokenRecord) (*api.ConnectedUser, bool) {
	return &api.ConnectedUser{
		// RefreshjToken is the username
		GUID: fmt.Sprintf("%s-%s", cnsiGUID, cfTokenRecord.RefreshToken),
		Name: cfTokenRecord.RefreshToken,
	}, true
}

func (c *KubeBasicAuth) RegisterJetstreamAuthType(portal api.PortalProxy) {
	// Register auth type with Jetstream - use the same as the HttpBasic auth

	auth := c.portalProxy.GetAuthProvider(authTypeHttpBasic)
	if auth.Handler != nil {
		c.portalProxy.AddAuthProvider(c.GetName(), api.AuthProvider{
			Handler:  auth.Handler,
			UserInfo: auth.UserInfo,
		})
	}
}

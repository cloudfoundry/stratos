package auth

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/kubernetes/config"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"

	"github.com/SermoDigital/jose/jws"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

type KubeConfigAuthProviderOIDC struct {
	ClientID     string `yaml:"client-id"`
	ClientSecret string `yaml:"client-secret"`
	IDToken      string `yaml:"id-token"`
	IdpIssuerURL string `yaml:"idp-issuer-url"`
	RefreshToken string `yaml:"refresh-token"`
	Expiry       time.Time
}

const authConnectTypeOIDC = "OIDC"

// OIDCKubeAuth
type OIDCKubeAuth struct {
	portalProxy interfaces.PortalProxy
}

// InitOIDCKubeAuth
func InitOIDCKubeAuth(portalProxy interfaces.PortalProxy) *OIDCKubeAuth {
	return &OIDCKubeAuth{portalProxy: portalProxy}
}

// GetName returns the provider name
func (c *OIDCKubeAuth) GetName() string {
	return authConnectTypeOIDC
}

func (c *OIDCKubeAuth) AddAuthInfo(info *clientcmdapi.AuthInfo, tokenRec interfaces.TokenRecord) error {
	authInfo := &interfaces.OAuth2Metadata{}
	err := json.Unmarshal([]byte(tokenRec.Metadata), &authInfo)
	if err != nil {
		return err
	}

	info.AuthProvider = &clientcmdapi.AuthProviderConfig{}
	info.AuthProvider.Name = "oidc"
	info.AuthProvider.Config = make(map[string]string)
	info.AuthProvider.Config["client-id"] = authInfo.ClientID
	info.AuthProvider.Config["client-secret"] = authInfo.ClientSecret
	info.AuthProvider.Config["idp-issuer-url"] = authInfo.IssuerURL

	info.AuthProvider.Config["id-token"] = tokenRec.AuthToken
	info.AuthProvider.Config["refresh-token"] = tokenRec.RefreshToken
	info.AuthProvider.Config["extra-scopes"] = "groups"

	return nil
}

func (c *OIDCKubeAuth) FetchToken(cnsiRecord interfaces.CNSIRecord, ec echo.Context) (*interfaces.TokenRecord, *interfaces.CNSIRecord, error) {
	log.Debug("FetchToken (OIDC)")

	req := ec.Request()

	// Need to extract the parameters from the request body
	defer req.Body.Close()
	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return nil, nil, err
	}

	kubeConfig, err := config.ParseKubeConfig(body)

	kubeConfigUser, err := kubeConfig.GetUserForCluster(cnsiRecord.APIEndpoint.String())

	if err != nil {
		return nil, nil, fmt.Errorf("Unable to find cluster in kubeconfig")
	}

	// We only support OIDC auth provider at the moment
	if kubeConfigUser.User.AuthProvider.Name != "oidc" {
		return nil, nil, fmt.Errorf("OIDC: Unsupported authentication provider for user: %s", kubeConfigUser.User.AuthProvider.Name)
	}

	return c.GetTokenFromKubeConfigUser(cnsiRecord, kubeConfigUser)
}

func (c *OIDCKubeAuth) GetTokenFromKubeConfigUser(cnsiRecord interfaces.CNSIRecord, kubeConfigUser *config.KubeConfigUser) (*interfaces.TokenRecord, *interfaces.CNSIRecord, error) {

	oidcConfig, err := c.GetOIDCConfig(kubeConfigUser)
	if err != nil {
		log.Info(err)
		return nil, nil, errors.New("Can not unmarshal OIDC Auth Provider configuration")
	}
	tokenRecord := c.portalProxy.InitEndpointTokenRecord(oidcConfig.Expiry.Unix(), oidcConfig.IDToken, oidcConfig.RefreshToken, false)
	tokenRecord.AuthType = interfaces.AuthTypeOIDC

	oauthMetadata := &interfaces.OAuth2Metadata{}
	oauthMetadata.ClientID = oidcConfig.ClientID
	oauthMetadata.ClientSecret = oidcConfig.ClientSecret
	oauthMetadata.IssuerURL = oidcConfig.IdpIssuerURL

	jsonString, err := json.Marshal(oauthMetadata)
	if err == nil {
		tokenRecord.Metadata = string(jsonString)
	}

	// Could try and make a K8S Api call to validate the token
	// Or, maybe we can verify the access token with the auth URL ?

	return &tokenRecord, &cnsiRecord, nil
}

// GetUserFromToken gets the username from the GKE Token
func (c *OIDCKubeAuth) GetUserFromToken(cnsiGUID string, tokenRecord *interfaces.TokenRecord) (*interfaces.ConnectedUser, bool) {
	log.Debug("GetUserFromToken (OIDC)")
	return c.portalProxy.GetCNSIUserFromOAuthToken(cnsiGUID, tokenRecord)
}

func (c *OIDCKubeAuth) GetOIDCConfig(k *config.KubeConfigUser) (*KubeConfigAuthProviderOIDC, error) {

	if k.User.AuthProvider.Name != "oidc" {
		return nil, errors.New("User doesn't use OIDC")
	}

	OIDCConfig := &KubeConfigAuthProviderOIDC{}
	err := config.UnMarshalHelper(k.User.AuthProvider.Config, OIDCConfig)
	if err != nil {
		log.Info(err)
		return nil, errors.New("Can not unmarshal OIDC Auth Provider configuration")
	}

	token, err := jws.ParseJWT([]byte(OIDCConfig.IDToken))
	if err != nil {
		log.Info(err)
		return nil, errors.New("Can not parse JWT Access token")
	}

	expiry, ok := token.Claims().Expiration()
	if !ok {
		return nil, errors.New("Can not get Access Token expiry time")
	}
	OIDCConfig.Expiry = expiry

	return OIDCConfig, nil
}

func (c *OIDCKubeAuth) DoFlowRequest(cnsiRequest *interfaces.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("DoFlowRequest (OIDC)")
	return c.portalProxy.DoOidcFlowRequest(cnsiRequest, req)
}

func (c *OIDCKubeAuth) RegisterJetstreamAuthType(portal interfaces.PortalProxy) {
	// No need to register OIDC, as its already built in
	existing := c.portalProxy.HasAuthProvider(c.GetName())
	if !existing {
		// Register auth type with Jetstream
		c.portalProxy.AddAuthProvider(c.GetName(), interfaces.AuthProvider{
			Handler:  c.portalProxy.DoOidcFlowRequest,
			UserInfo: nil,
		})
	}
}

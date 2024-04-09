package auth

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/kubernetes/config"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"

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
	portalProxy api.PortalProxy
}

// InitOIDCKubeAuth
func InitOIDCKubeAuth(portalProxy api.PortalProxy) *OIDCKubeAuth {
	return &OIDCKubeAuth{portalProxy: portalProxy}
}

// GetName returns the provider name
func (c *OIDCKubeAuth) GetName() string {
	return authConnectTypeOIDC
}

func (c *OIDCKubeAuth) AddAuthInfo(info *clientcmdapi.AuthInfo, tokenRec api.TokenRecord) error {
	authInfo := &api.OAuth2Metadata{}
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

func (c *OIDCKubeAuth) FetchToken(cnsiRecord api.CNSIRecord, ec echo.Context) (*api.TokenRecord, *api.CNSIRecord, error) {
	log.Debug("FetchToken (OIDC)")

	req := ec.Request()

	// Need to extract the parameters from the request body
	defer req.Body.Close()
	body, err := io.ReadAll(req.Body)
	if err != nil {
		return nil, nil, err
	}

	kubeConfig, err := config.ParseKubeConfig(body)

	kubeConfigUser, err := kubeConfig.GetUserForCluster(cnsiRecord.APIEndpoint.String())

	if err != nil {
		return nil, nil, fmt.Errorf("unable to find cluster in kubeconfig")
	}

	// We only support OIDC auth provider at the moment
	if kubeConfigUser.User.AuthProvider.Name != "oidc" {
		return nil, nil, fmt.Errorf("OIDC: Unsupported authentication provider for user: %s", kubeConfigUser.User.AuthProvider.Name)
	}

	return c.GetTokenFromKubeConfigUser(cnsiRecord, kubeConfigUser)
}

func (c *OIDCKubeAuth) GetTokenFromKubeConfigUser(cnsiRecord api.CNSIRecord, kubeConfigUser *config.KubeConfigUser) (*api.TokenRecord, *api.CNSIRecord, error) {

	oidcConfig, err := c.GetOIDCConfig(kubeConfigUser)
	if err != nil {
		log.Info(err)
		return nil, nil, errors.New("Can not unmarshal OIDC Auth Provider configuration")
	}
	tokenRecord := c.portalProxy.InitEndpointTokenRecord(oidcConfig.Expiry.Unix(), oidcConfig.IDToken, oidcConfig.RefreshToken, false)
	tokenRecord.AuthType = api.AuthTypeOIDC

	oauthMetadata := &api.OAuth2Metadata{}
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
func (c *OIDCKubeAuth) GetUserFromToken(cnsiGUID string, tokenRecord *api.TokenRecord) (*api.ConnectedUser, bool) {
	log.Debug("GetUserFromToken (OIDC)")
	return c.portalProxy.GetCNSIUserFromOAuthToken(cnsiGUID, tokenRecord)
}

func (c *OIDCKubeAuth) GetOIDCConfig(k *config.KubeConfigUser) (*KubeConfigAuthProviderOIDC, error) {

	if k.User.AuthProvider.Name != "oidc" {
		return nil, errors.New("user doesn't use OIDC")
	}

	OIDCConfig := &KubeConfigAuthProviderOIDC{}
	err := config.UnMarshalHelper(k.User.AuthProvider.Config, OIDCConfig)
	if err != nil {
		log.Info(err)
		return nil, errors.New("can not unmarshal OIDC Auth Provider configuration")
	}

	token, err := jws.ParseJWT([]byte(OIDCConfig.IDToken))
	if err != nil {
		log.Info(err)
		return nil, errors.New("can not parse JWT Access token")
	}

	expiry_string, ok := token.Claims().Get("exp").(string)
	if !ok {
		return nil, errors.New("can not get Access Token expiry time claim")
	}

	expiry, err := time.Parse(time.RFC3339, expiry_string)
	if err != nil {
		return nil, errors.New(fmt.Sprintf("can not parse Access Token expiry time claim '%s': %s", expiry_string, err))
	}

	OIDCConfig.Expiry = expiry

	return OIDCConfig, nil
}

func (c *OIDCKubeAuth) DoFlowRequest(cnsiRequest *api.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("DoFlowRequest (OIDC)")
	return c.portalProxy.DoOidcFlowRequest(cnsiRequest, req)
}

func (c *OIDCKubeAuth) RegisterJetstreamAuthType(portal api.PortalProxy) {
	// No need to register OIDC, as its already built in
	existing := c.portalProxy.HasAuthProvider(c.GetName())
	if !existing {
		// Register auth type with Jetstream
		c.portalProxy.AddAuthProvider(c.GetName(), api.AuthProvider{
			Handler:  c.portalProxy.DoOidcFlowRequest,
			UserInfo: nil,
		})
	}
}

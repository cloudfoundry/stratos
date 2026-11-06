package auth

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes/config"

	"github.com/labstack/echo/v5"
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

func (c *OIDCKubeAuth) FetchToken(cnsiRecord api.CNSIRecord, ec *echo.Context) (*api.TokenRecord, *api.CNSIRecord, error) {
	slog.Debug("FetchToken (OIDC)", "endpoint", cnsiRecord.GUID)

	body := ec.FormValue("kubeconfig")
	if len(body) == 0 {
		return nil, nil, fmt.Errorf("kubeconfig content is required")
	}

	kubeConfig, err := config.ParseKubeConfig([]byte(body))
	if err != nil {
		return nil, nil, fmt.Errorf("unable to parse kubeconfig: %v", err)
	}

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
		// GetOIDCConfig has already logged the specific cause; wrap so it
		// survives rather than reporting every failure as an unmarshal error.
		return nil, nil, fmt.Errorf("could not read the OIDC auth provider configuration for endpoint %s: %w", cnsiRecord.GUID, err)
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
	slog.Debug("GetUserFromToken (OIDC)", "endpoint", cnsiGUID, "token", tokenRecord.TokenGUID)
	return c.portalProxy.GetCNSIUserFromOAuthToken(cnsiGUID, tokenRecord)
}

func (c *OIDCKubeAuth) GetOIDCConfig(k *config.KubeConfigUser) (*KubeConfigAuthProviderOIDC, error) {

	if k.User.AuthProvider.Name != "oidc" {
		return nil, errors.New("user doesn't use OIDC")
	}

	OIDCConfig := &KubeConfigAuthProviderOIDC{}
	err := config.UnMarshalHelper(k.User.AuthProvider.Config, OIDCConfig)
	if err != nil {
		const msg = "can not unmarshal the OIDC auth provider configuration"
		slog.Error(msg, "kubeConfigUser", k.Name, "error", err)
		return nil, fmt.Errorf("%s: %w", msg, err)
	}

	claims, err := jwtClaims([]byte(OIDCConfig.IDToken))
	if err != nil {
		const msg = "can not parse the OIDC JWT access token"
		slog.Error(msg, "kubeConfigUser", k.Name, "error", err)
		return nil, fmt.Errorf("%s: %w", msg, err)
	}

	// RFC 7519 defines exp as a NumericDate - seconds since the epoch, so a
	// JSON number, which decodes to float64. This asserted a string and then
	// parsed it as RFC 3339, so it could never succeed against a conformant
	// token and every OIDC connect failed here.
	expirySeconds, ok := claims["exp"].(float64)
	if !ok {
		const msg = "can not get Access Token expiry time claim"
		slog.Error(msg, "kubeConfigUser", k.Name, "claim", claims["exp"])
		return nil, errors.New(msg)
	}

	OIDCConfig.Expiry = time.Unix(int64(expirySeconds), 0)

	return OIDCConfig, nil
}

func (c *OIDCKubeAuth) DoFlowRequest(cnsiRequest *api.CNSIRequest, req *http.Request) (*http.Response, error) {
	slog.Debug("DoFlowRequest (OIDC)", "endpoint", cnsiRequest.GUID, "user", cnsiRequest.UserGUID)
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

package auth

import (
	"log/slog"
	"net/http"
	"strings"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v5"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

const AuthConnectTypeKubeToken = "k8s-token"

// KubeTokenAuth uses a token (e.g. service account token)
type KubeTokenAuth struct {
	portalProxy api.PortalProxy
}

// InitKubeTokenAuth
func InitKubeTokenAuth(portalProxy api.PortalProxy) KubeAuthProvider {
	return &KubeTokenAuth{portalProxy}
}

func (c *KubeTokenAuth) GetName() string {
	return AuthConnectTypeKubeToken
}

func (c *KubeTokenAuth) AddAuthInfo(info *clientcmdapi.AuthInfo, tokenRec api.TokenRecord) error {
	slog.Debug("AddAuthInfo: KubeTokenAuth", "token", tokenRec.TokenGUID)
	// Just add the token in
	info.Token = tokenRec.AuthToken
	return nil
}

func (c *KubeTokenAuth) FetchToken(cnsiRecord api.CNSIRecord, ec *echo.Context) (*api.TokenRecord, *api.CNSIRecord, error) {
	slog.Debug("FetchToken (KubeTokenAuth)", "endpoint", cnsiRecord.GUID)
	token := strings.Join(strings.Fields(ec.FormValue("token")), "")
	tokenRecord := NewKubeTokenAuthTokenRecord(c.portalProxy, token)
	return tokenRecord, &cnsiRecord, nil
}

func NewKubeTokenAuthTokenRecord(portalProxy api.PortalProxy, token string) *api.TokenRecord {
	tokenRecord := portalProxy.InitEndpointTokenRecord(getLargeExpiryTime(), token, "__NONE__", false)
	tokenRecord.AuthType = AuthConnectTypeKubeToken
	return &tokenRecord
}

func (c *KubeTokenAuth) doTokenFlowRequest(cnsiRequest *api.CNSIRequest, req *http.Request) (*http.Response, error) {
	slog.Debug("K8S Token auth: doTokenFlowRequest", "endpoint", cnsiRequest.GUID, "user", cnsiRequest.UserGUID)

	authHandler := func(tokenRec api.TokenRecord, cnsi api.CNSIRecord) (*http.Response, error) {
		// Token auth has no token refresh or expiry - so much simpler than the OAuth flow
		req.Header.Set("Authorization", "bearer "+tokenRec.AuthToken)
		client := c.portalProxy.GetHttpClientForRequest(req, cnsi.SkipSSLValidation, cnsi.CACert)
		return client.Do(req)
	}
	return c.portalProxy.DoAuthFlowRequest(cnsiRequest, req, authHandler)
}

func (c *KubeTokenAuth) RegisterJetstreamAuthType(portal api.PortalProxy) {
	// Register auth type with Jetstream
	c.portalProxy.AddAuthProvider(c.GetName(), api.AuthProvider{
		Handler:  c.doTokenFlowRequest,
		UserInfo: c.GetUserFromToken,
	})
}

func (c *KubeTokenAuth) GetUserFromToken(cnsiGUID string, tokenRecord *api.TokenRecord) (*api.ConnectedUser, bool) {
	slog.Debug("GetUserFromToken (KubeTokenAuth)", "endpoint", cnsiGUID, "token", tokenRecord.TokenGUID)

	// See if we can get token info - if we can, use it
	_, err := c.portalProxy.GetUserTokenInfo(tokenRecord.AuthToken)
	if err == nil {
		return c.portalProxy.GetCNSIUserFromOAuthToken(cnsiGUID, tokenRecord)
	}

	parts := strings.Split(tokenRecord.AuthToken, ":")
	if len(parts) != 2 {
		// err is why the token info lookup above failed; it is the reason we
		// fell back to splitting the raw token, so report it here.
		slog.Error("could not get the user information from the token",
			"endpoint", cnsiGUID, "token", tokenRecord.TokenGUID, "error", err)
		return nil, false
	}

	return &api.ConnectedUser{
		GUID:   parts[0],
		Name:   parts[0],
		Scopes: make([]string, 0),
	}, true
}

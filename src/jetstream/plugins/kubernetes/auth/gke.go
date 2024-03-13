package auth

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"

	"github.com/SermoDigital/jose/jws"
)

const (
	gkeConfigType       = "authorized_user"
	googleOAuthEndpoint = "https://www.googleapis.com/oauth2/v4/token"
)

// GKEConfig is the format of the config file we expect for GKE authentication
type GKEConfig struct {
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
	RefreshToken string `json:"refresh_token"`
	Type         string `json:"type"`
	Email        string `json:"email"`
}

// GKEKubeAuth is GKE Authentication for Kubernetes
type GKEKubeAuth struct {
	portalProxy api.PortalProxy
}

const authConnectTypeGKE = "gke-auth"

// InitGKEKubeAuth creates a GKEKubeAuth
func InitGKEKubeAuth(portalProxy api.PortalProxy) KubeAuthProvider {
	return &GKEKubeAuth{portalProxy: portalProxy}
}

// GetName returns the provider name
func (c *GKEKubeAuth) GetName() string {
	return authConnectTypeGKE
}

func (c *GKEKubeAuth) AddAuthInfo(info *clientcmdapi.AuthInfo, tokenRec api.TokenRecord) error {
	gkeInfo := &GKEConfig{}
	err := json.Unmarshal([]byte(tokenRec.RefreshToken), &gkeInfo)
	if err != nil {
		return err
	}

	info.Token = tokenRec.AuthToken
	return nil
}

// FetchToken will create a token for the GKE Authentication using the POSTed data
func (c *GKEKubeAuth) FetchToken(cnsiRecord api.CNSIRecord, ec echo.Context) (*api.TokenRecord, *api.CNSIRecord, error) {
	log.Debug("FetchToken (GKE)")

	// We should already have the refresh token in the body sent to us
	req := ec.Request()

	// Need to extract the parameters from the request body
	defer req.Body.Close()
	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return nil, nil, err
	}

	gkeInfo := &GKEConfig{}
	err = json.Unmarshal(body, &gkeInfo)
	if err != nil {
		return nil, nil, err
	}

	// Type needs to be "authorized_user"
	if gkeInfo.Type != gkeConfigType || len(gkeInfo.RefreshToken) == 0 {
		return nil, nil, errors.New("Invalid configuration file")
	}

	oauthToken, err := c.refreshGKEToken(cnsiRecord.SkipSSLValidation, gkeInfo.ClientID, gkeInfo.ClientSecret, gkeInfo.RefreshToken)
	if err != nil {
		return nil, nil, fmt.Errorf("Could not refresh the GKE token: %v+", err)
	}

	token, err := jws.ParseJWT([]byte(oauthToken.IDToken))
	if err != nil {
		log.Info(err)
		return nil, nil, errors.New("Can not parse JWT Access token")
	}

	email := token.Claims().Get("email")
	if emailAddress, ok := email.(string); ok {
		gkeInfo.Email = emailAddress
	}

	tokenInfo, err := json.Marshal(gkeInfo)
	if err != nil {
		return nil, nil, err
	}

	// Create a new token record - we need to store the client ID and secret as well, so cheekily use the refresh token for this
	tokenRecord := c.portalProxy.InitEndpointTokenRecord(0, oauthToken.AccessToken, string(tokenInfo), false)
	tokenRecord.AuthType = authConnectTypeGKE
	return &tokenRecord, &cnsiRecord, nil
}

// GetUserFromToken gets the username from the GKE Token
func (c *GKEKubeAuth) GetUserFromToken(cnsiGUID string, tokenRecord *api.TokenRecord) (*api.ConnectedUser, bool) {
	log.Debug("GetUserFromToken (GKE)")

	gkeInfo := &GKEConfig{}
	err := json.Unmarshal([]byte(tokenRecord.RefreshToken), &gkeInfo)
	if err != nil {
		return nil, false
	}

	return &api.ConnectedUser{
		GUID: gkeInfo.Email,
		Name: gkeInfo.Email,
	}, true
}

func (c *GKEKubeAuth) DoFlowRequest(cnsiRequest *api.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("doGKEFlowRequest")

	authHandler := c.portalProxy.OAuthHandlerFunc(cnsiRequest, req, c.RefreshGKEToken)
	return c.portalProxy.DoAuthFlowRequest(cnsiRequest, req, authHandler)
}

// RefreshGKEToken will refresh a GKE token
func (c *GKEKubeAuth) RefreshGKEToken(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t api.TokenRecord, err error) {
	log.Debug("RefreshGKEToken")
	now := time.Now()

	userToken, ok := c.portalProxy.GetCNSITokenRecordWithDisconnected(cnsiGUID, userGUID)
	if !ok {
		return t, fmt.Errorf("Info could not be found for user with GUID %s", userGUID)
	}

	// Refresh token is the GKE info
	var gkeInfo GKEConfig
	err = json.Unmarshal([]byte(userToken.RefreshToken), &gkeInfo)
	if err != nil {
		return userToken, fmt.Errorf("Could not get the GKE info from the refresh token: %v+", err)
	}

	oauthToken, err := c.refreshGKEToken(skipSSLValidation, gkeInfo.ClientID, gkeInfo.ClientSecret, gkeInfo.RefreshToken)
	if err != nil {
		return userToken, fmt.Errorf("Could not refresh the GKE token: %v+", err)
	}

	userToken.AuthToken = oauthToken.AccessToken

	duration := time.Duration(oauthToken.ExpiresIn) * time.Second
	expiry := now.Add(duration).Unix()
	userToken.TokenExpiry = expiry

	return userToken, nil
}

func (c *GKEKubeAuth) refreshGKEToken(skipSSLValidation bool, clientID, clientSecret, refreshToken string) (u api.UAAResponse, err error) {
	log.Debug("refreshGKEToken")
	tokenInfo := api.UAAResponse{}

	// Go and get a new access token
	httpClient := c.portalProxy.GetHttpClient(skipSSLValidation, "")
	body := fmt.Sprintf("client_secret=%s&refresh_token=%s&client_id=%s&grant_type=refresh_token", url.QueryEscape(clientSecret), url.QueryEscape(refreshToken), url.QueryEscape(clientID))
	resp, err := httpClient.Post(googleOAuthEndpoint, "application/x-www-form-urlencoded", strings.NewReader(body))
	if err != nil {
		return tokenInfo, err
	}

	// Check status code
	if resp.StatusCode != 200 {
		return tokenInfo, fmt.Errorf("Failed to get access token: %s", resp.Status)
	}

	// Parse the response
	defer resp.Body.Close()
	respBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return tokenInfo, err
	}

	err = json.Unmarshal(respBody, &tokenInfo)
	return tokenInfo, err
}

func (c *GKEKubeAuth) RegisterJetstreamAuthType(portal api.PortalProxy) {
	// Register auth type with Jetstream
	c.portalProxy.AddAuthProvider(c.GetName(), api.AuthProvider{
		Handler:  c.DoFlowRequest,
		UserInfo: c.GetUserFromToken,
	})
}

package userinvite

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"time"
	"unicode"

	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// RefreshToken will refresh the token for the client
func (invite *UserInvite) RefreshToken(cfGUID, clientID, clientSecret string) (*interfaces.UAAResponse, *interfaces.TokenRecord, error) {
	endpoint, err := invite.checkEndpoint(cfGUID)
	if err != nil {
		return nil, nil, err
	}

	uaaRecord, tokenRecord, err := invite.refreshToken(clientID, clientSecret, endpoint)
	if err != nil {
		return nil, nil, err
	}

	if err = invite.portalProxy.SaveEndpointToken(cfGUID, UserInviteUserID, *tokenRecord); err != nil {
		return nil, nil, interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Unable to save user invite token",
			"Unable to save user invite token: %+v", err,
		)
	}

	return uaaRecord, tokenRecord, nil
}

func (invite *UserInvite) refreshToken(clientID, clientSecret string, endpoint interfaces.CNSIRecord) (*interfaces.UAAResponse, *interfaces.TokenRecord, error) {
	now := time.Now()
	clientSecret = strings.TrimSpace(clientSecret)
	authEndpoint := fmt.Sprintf("%s/oauth/token", endpoint.TokenEndpoint)

	form := url.Values{}
	form.Set("client_id", clientID)
	form.Set("client_secret", clientSecret)
	form.Set("grant_type", "client_credentials")
	// Need to use JWT token_format to work with CF
	form.Set("token_format", "jwt")

	req, err := http.NewRequest("POST", authEndpoint, strings.NewReader(form.Encode()))
	if err != nil {
		msg := "Failed to create request for UAA: %v"
		log.Warnf(msg, err)
		return nil, nil, fmt.Errorf(msg, err)
	}

	client := invite.portalProxy.GetHttpClientForRequest(req, endpoint.SkipSSLValidation)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationForm)

	res, err := client.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Warnf("Error performing http request - response: %v, error: %v", res, err)

		// Try and get the error details form the WWW-Authenticate hehader
		errMsg := "Error checking UAA Client"
		data := parseAuthHeader(res.Header.Get(wwwAuthHeader))
		if len(data["error_description"]) > 0 {
			errMsg = fmt.Sprintf("Could not check Client: %s", data["error_description"])
		}

		return nil, nil, interfaces.NewHTTPShadowError(
			res.StatusCode,
			errMsg,
			errMsg,
		)
	}

	defer res.Body.Close()

	// Check error code
	if res.StatusCode != http.StatusOK {
		errMessage := "Error validating Client ID and Client Secret"
		authError := &interfaces.UAAErrorResponse{}
		uaaResponse, _ := ioutil.ReadAll(res.Body)
		if err := json.Unmarshal([]byte(uaaResponse), authError); err == nil {
			errMessage = errMessage + " - " + authError.ErrorDescription
		}
		return nil, nil, interfaces.NewHTTPShadowError(
			res.StatusCode,
			errMessage,
			errMessage+" %+v", err,
		)
	}

	var uaaResponse interfaces.UAAResponse
	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&uaaResponse); err != nil {
		return nil, nil, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Error parsing response from UAA",
			"Error parsing response from UAA: %+v", err,
		)
	}

	duration := time.Duration(uaaResponse.ExpiresIn) * time.Second
	expiry := now.Add(duration).Unix()
	tokenRecord := &interfaces.TokenRecord{
		RefreshToken: fmt.Sprintf("%s:%s", clientID, clientSecret),
		AuthToken:    uaaResponse.AccessToken,
		TokenExpiry:  expiry,
		AuthType:     UAAClientAuthType,
	}

	return &uaaResponse, tokenRecord, nil
}

func (invite *UserInvite) checkEndpoint(cfGUID string) (interfaces.CNSIRecord, error) {
	// Check that there is an endpoint with the specified ID and that it is a Cloud Foundry endpoint
	endpoint, err := invite.portalProxy.GetCNSIRecord(cfGUID)
	if err != nil {
		// Could find the endpoint
		return interfaces.CNSIRecord{}, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Can not find enpoint",
			"Can not find enpoint: %s", cfGUID,
		)
	}

	if endpoint.CNSIType != "cf" {
		return interfaces.CNSIRecord{}, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Not a Cloud Foundry endpoint",
			"Not a Cloud Foundry endpoint: %s", cfGUID,
		)
	}

	return endpoint, nil
}

func parseAuthHeader(v string) map[string]string {
	lastQuote := rune(0)
	comma := rune(',')
	f := func(c rune) bool {
		switch {
		case c == lastQuote:
			lastQuote = rune(0)
			return false
		case lastQuote != rune(0):
			return false
		case unicode.In(c, unicode.Quotation_Mark):
			lastQuote = c
			return false
		default:
			return c == comma
		}
	}
	m := strings.FieldsFunc(v, f)
	nameValues := make(map[string]string)
	for _, nv := range m {
		p := strings.Index(nv, "=")
		if p != -1 {
			name := strings.TrimSpace(nv[:p])
			value := strings.TrimSpace(nv[p+1:])
			value = value[1 : len(value)-1]
			nameValues[name] = value
		}
	}

	return nameValues
}

func (invite *UserInvite) doUAAClientAuthFlow(cnsiRequest *interfaces.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("doUAAClientAuthFlow")
	authHandler := invite.portalProxy.OAuthHandlerFunc(cnsiRequest, req, invite.refreshUAAClientToken)
	return invite.portalProxy.DoAuthFlowRequest(cnsiRequest, req, authHandler)
}

func (invite *UserInvite) getCNSIUserFromUAAClientToken(cnsiGUID string, cfTokenRecord *interfaces.TokenRecord) (*interfaces.ConnectedUser, bool) {
	log.Debug("getCNSIUserFromUAAClientToken")
	return &interfaces.ConnectedUser{}, true
}

func (invite *UserInvite) refreshUAAClientToken(skipSSLValidation bool, cnsiGUID, userGUID, clientID, clientSecret, tokenEndpoint string) (t interfaces.TokenRecord, err error) {
	log.Debug("refreshUAAClientToken")
	refreshedToken := &interfaces.TokenRecord{}

	// See if we can get a token for the invite user
	token, ok := invite.portalProxy.GetCNSITokenRecord(cnsiGUID, userGUID)
	if !ok {
		// Not configured
		return *refreshedToken, errors.New("Can not find existing token")
	}

	client := strings.Split(token.RefreshToken, ":")
	if len(client) != 2 {
		return *refreshedToken, errors.New("Invalid token - expecting client ID and client secret")
	}

	_, refreshedToken, err = invite.RefreshToken(cnsiGUID, client[0], client[1])
	return *refreshedToken, err
}

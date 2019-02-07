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

type StatusResponse struct {
	EndpointGUID string `json:"endpoint_guid"`
	Enabled      bool   `json:"enabled"`
	ClientID     string `json:"client_id"`
}

const wwwAuthHeader = "www-authenticate"

// Admin functions for managing User Invite credentials for a given Cloud Foundry

func (invite *UserInvite) status(c echo.Context) error {
	log.Debug("Invite Status")
	cfGUID := c.Param("id")

	// Check that there is an endpoint with the specified ID and that it is a Cloud Foundry endpoint
	endpoint, err := invite.portalProxy.GetCNSIRecord(cfGUID)
	if err != nil {
		// Could find the endpoint
		return errors.New("Can not find endpoint")
	}

	if endpoint.CNSIType != "cf" {
		return errors.New("Not a Cloud Foundry endpoint")
	}

	response := &StatusResponse{
		EndpointGUID: cfGUID,
		Enabled:      false,
	}

	// See if we can get a token for the invite user
	token, ok := invite.portalProxy.GetCNSITokenRecord(cfGUID, UserInviteUserID)
	if !ok {
		response.Enabled = true
		// AuthToken is clientID:clientSecret
		clientDetails := strings.Split(token.AuthToken, ":")
		response.ClientID = clientDetails[0]
	}

	jsonString, err := json.Marshal(response)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

// Configure
func (invite *UserInvite) configure(c echo.Context) error {
	log.Debug("Configure Invite token")
	cfGUID := c.Param("id")

	clientID := c.FormValue("client_id")
	clientSecret := c.FormValue("client_secret")

	if len(clientID) == 0 || len(clientSecret) == 0 {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Invalid request - must specify client ID and client secret",
			"Invalid request - must specify client ID and client secret",
		)
	}

	err := invite.RefreshToken(cfGUID, clientID, clientSecret)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write([]byte("{\"status\": \"ok\"}"))
	return nil
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

func (invite *UserInvite) refreshToken(clientID, clientSecret string, endpoint interfaces.CNSIRecord) (interfaces.TokenRecord, error) {
	now := time.Now()

	clientSecret = strings.TrimSpace(clientSecret)

	authEndpoint := fmt.Sprintf("%s/oauth/token", endpoint.TokenEndpoint)

	// Validate that this works

	//client_id=login&client_secret=loginsecret&grant_type=client_credentials&token_format=opaque

	form := url.Values{}
	form.Set("client_id", clientID)
	form.Set("client_secret", clientSecret)
	form.Set("grant_type", "client_credentials")
	form.Set("token_format", "opaque")

	req, err := http.NewRequest("POST", authEndpoint, strings.NewReader(form.Encode()))
	if err != nil {
		msg := "Failed to create request for UAA: %v"
		log.Errorf(msg, err)
		return interfaces.TokenRecord{}, fmt.Errorf(msg, err)
	}

	client := invite.portalProxy.GetHttpClientForRequest(req, endpoint.SkipSSLValidation)

	//req.SetBasicAuth(clientID, clientSecret)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationForm)

	res, err := client.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		log.Warnf("%v+", err)

		// Try and get the error details form the WWW-Authenticate hehader
		errMsg := "Error checking UAA Client"
		data := parseAuthHeader(res.Header.Get(wwwAuthHeader))
		if len(data["error_description"]) > 0 {
			errMsg = fmt.Sprintf("Could not check Client: %s", data["error_description"])
		}

		return interfaces.TokenRecord{}, interfaces.NewHTTPShadowError(
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
		return interfaces.TokenRecord{}, interfaces.NewHTTPShadowError(
			res.StatusCode,
			errMessage,
			errMessage+" %v+", err,
		)
	}

	var uaaResponse interfaces.UAAResponse
	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&uaaResponse); err != nil {
		return interfaces.TokenRecord{}, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Error parsing response from UAA",
			"Error parsing response from UAA: %v+", err,
		)
	}

	duration := time.Duration(uaaResponse.ExpiresIn) * time.Second
	expiry := now.Add(duration).Unix()
	return interfaces.TokenRecord{
		RefreshToken: fmt.Sprintf("%s:%s", clientID, clientSecret),
		AuthToken:    uaaResponse.AccessToken,
		TokenExpiry:  expiry,
		AuthType:     "uaa_client",
	}, nil
}

func (invite *UserInvite) RefreshToken(cfGUID, clientID, clientSecret string) error {

	endpoint, err := invite.checkEndpoint(cfGUID)
	if err != nil {
		return err
	}

	tokenRecord, err := invite.refreshToken(clientID, clientSecret, endpoint)
	if err != nil {
		return err
	}

	err = invite.portalProxy.SaveEndpointToken(cfGUID, UserInviteUserID, tokenRecord)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Unable to save user invite token",
			"Unable to save user invite toke: %v+", err,
		)
	}

	return nil
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

func (invite *UserInvite) remove(c echo.Context) error {
	log.Debug("Delete Invite token")
	cfGUID := c.Param("id")

	// Check that there is an endpoint with the specified ID and that it is a Cloud Foundry endpoint
	endpoint, err := invite.portalProxy.GetCNSIRecord(cfGUID)
	if err != nil {
		// Could find the endpoint
		return errors.New("Can not find endpoint")
	}

	if endpoint.CNSIType != "cf" {
		return errors.New("Not a Cloud Foundry endpoint")
	}

	err = invite.portalProxy.DeleteEndpointToken(cfGUID, UserInviteUserID)
	if err != nil {
		return errors.New("Umable to delete user invite token")
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write([]byte("{\"status\": \"ok\"}"))
	return nil
}

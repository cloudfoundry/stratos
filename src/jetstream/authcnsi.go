package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/cnsis"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/tokens"
)

// CFAdminIdentifier - The scope that Cloud Foundry uses to convey administrative level perms
const CFAdminIdentifier = "cloud_controller.admin"

// Start SSO flow for an Endpoint
func (p *portalProxy) ssoLoginToCNSI(c echo.Context) error {
	log.Debug("ssoLoginToCNSI")
	endpointGUID := c.QueryParam("guid")
	if len(endpointGUID) == 0 {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need Endpoint GUID passed as form param")
	}

	_, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}

	state := c.QueryParam("state")
	if len(state) == 0 {
		err := interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			"SSO Login: State parameter missing",
			"SSO Login: State parameter missing")
		return err
	}

	cnsiRecord, err := p.GetCNSIRecord(endpointGUID)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Requested endpoint not registered",
			"No Endpoint registered with GUID %s: %s", endpointGUID, err)
	}

	// Check if this is first time in the flow, or via the callback
	code := c.QueryParam("code")

	if len(code) == 0 {
		// First time around
		// Use the standard SSO Login Callback endpoint, so this can be whitelisted for Stratos and Endpoint login
		returnURL := getSSORedirectURI(state, state, endpointGUID)
		redirectURL := fmt.Sprintf("%s/oauth/authorize?response_type=code&client_id=%s&redirect_uri=%s",
			cnsiRecord.AuthorizationEndpoint, cnsiRecord.ClientId, url.QueryEscape(returnURL))
		c.Redirect(http.StatusTemporaryRedirect, redirectURL)
		return nil
	}

	// Callback
	_, err = p.DoLoginToCNSI(c, endpointGUID, false)
	status := "ok"
	if err != nil {
		status = "fail"
	}

	// Take the user back to Stratos on the endpoints page
	redirect := fmt.Sprintf("/endpoints?cnsi_guid=%s&status=%s", endpointGUID, status)
	c.Redirect(http.StatusTemporaryRedirect, redirect)
	return nil
}

// Connect to the given Endpoint
// Note, an admin user can connect an endpoint as a system endpoint to share it with others
func (p *portalProxy) loginToCNSI(c echo.Context) error {
	log.Debug("loginToCNSI")
	cnsiGUID := c.FormValue("cnsi_guid")
	var systemSharedToken = false

	if len(cnsiGUID) == 0 {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need Endpoint GUID passed as form param")
	}

	systemSharedValue := c.FormValue("system_shared")
	if len(systemSharedValue) > 0 {
		systemSharedToken = systemSharedValue == "true"
	}

	resp, err := p.DoLoginToCNSI(c, cnsiGUID, systemSharedToken)
	if err != nil {
		return err
	}

	jsonString, err := json.Marshal(resp)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func (p *portalProxy) DoLoginToCNSI(c echo.Context, cnsiGUID string, systemSharedToken bool) (*interfaces.LoginRes, error) {

	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return nil, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Requested endpoint not registered",
			"No Endpoint registered with GUID %s: %s", cnsiGUID, err)
	}

	// Get the User ID since we save the CNSI token against the Console user guid, not the CNSI user guid so that we can look it up easily
	userID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}

	// Register as a system endpoint?
	if systemSharedToken {
		// User needs to be an admin
		user, err := p.StratosAuthService.GetUser(userID)
		if err != nil {
			return nil, echo.NewHTTPError(http.StatusUnauthorized, "Can not connect System Shared endpoint - could not check user")
		}

		if !user.Admin {
			return nil, echo.NewHTTPError(http.StatusUnauthorized, "Can not connect System Shared endpoint - user is not an administrator")
		}

		// We are all good to go - change the userID, so we record this token against the system-shared user and not this specific user
		// This is how we identify system-shared endpoint tokens
		userID = tokens.SystemSharedUserGuid
	}

	// Ask the endpoint type to connect
	for _, plugin := range p.Plugins {
		endpointPlugin, err := plugin.GetEndpointPlugin()
		if err != nil {
			// Plugin doesn't implement an Endpoint Plugin interface, skip
			continue
		}

		endpointType := endpointPlugin.GetType()
		if cnsiRecord.CNSIType == endpointType {
			tokenRecord, isAdmin, err := endpointPlugin.Connect(c, cnsiRecord, userID)
			if err != nil {
				if shadowError, ok := err.(interfaces.ErrHTTPShadow); ok {
					return nil, shadowError
				}
				return nil, interfaces.NewHTTPShadowError(
					http.StatusBadRequest,
					"Could not connect to the endpoint",
					"Could not connect to the endpoint: %s", err)
			}

			err = p.setCNSITokenRecord(cnsiGUID, userID, *tokenRecord)
			if err != nil {
				return nil, interfaces.NewHTTPShadowError(
					http.StatusBadRequest,
					"Failed to save Token for endpoint",
					"Error occurred: %s", err)
			}

			// Validate the connection - some endpoints may want to validate that the connected endpoint
			err = endpointPlugin.Validate(userID, cnsiRecord, *tokenRecord)
			if err != nil {
				// Clear the token
				p.ClearCNSIToken(cnsiRecord, userID)
				return nil, interfaces.NewHTTPShadowError(
					http.StatusBadRequest,
					"Could not connect to the endpoint",
					"Could not connect to the endpoint: %s", err)
			}

			resp := &interfaces.LoginRes{
				Account:     userID,
				TokenExpiry: tokenRecord.TokenExpiry,
				APIEndpoint: cnsiRecord.APIEndpoint,
				Admin:       isAdmin,
			}

			cnsiUser, ok := p.GetCNSIUserFromToken(cnsiGUID, tokenRecord)
			if ok {
				// If this is a system shared endpoint, then remove some metadata that should be send back to other users
				santizeInfoForSystemSharedTokenUser(cnsiUser, systemSharedToken)
				resp.User = cnsiUser
			} else {
				// Need to record a user
				resp.User = &interfaces.ConnectedUser{
					GUID:   "Unknown",
					Name:   "Unknown",
					Scopes: []string{"read"},
					Admin:  true,
				}
			}

			return resp, nil
		}
	}

	return nil, interfaces.NewHTTPShadowError(
		http.StatusBadRequest,
		"Endpoint connection not supported",
		"Endpoint connection not supported")
}

func (p *portalProxy) DoLoginToCNSIwithConsoleUAAtoken(c echo.Context, theCNSIrecord interfaces.CNSIRecord) error {
	userID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return errors.New("could not find correct session value")
	}
	uaaToken, err := p.GetUAATokenRecord(userID)
	if err == nil { // Found the user's UAA token
		u, err := p.GetUserTokenInfo(uaaToken.AuthToken)
		if err != nil {
			return errors.New("could not parse current user UAA token")
		}
		cfEndpointSpec, _ := p.GetEndpointTypeSpec("cf")
		cnsiInfo, _, err := cfEndpointSpec.Info(theCNSIrecord.APIEndpoint.String(), true)
		if err != nil {
			log.Fatal("Could not get the info for Cloud Foundry", err)
			return err
		}

		uaaURL, err := url.Parse(cnsiInfo.TokenEndpoint)
		if err != nil {
			return fmt.Errorf("invalid authorization endpoint URL %s %s", cnsiInfo.TokenEndpoint, err)
		}

		if uaaURL.String() == p.GetConfig().ConsoleConfig.UAAEndpoint.String() { // CNSI UAA server matches Console UAA server
			uaaToken.LinkedGUID = uaaToken.TokenGUID
			err = p.setCNSITokenRecord(theCNSIrecord.GUID, u.UserGUID, uaaToken)

			// Update the endpoint to indicate that SSO Login is okay
			repo, dbErr := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
			if dbErr == nil {
				theCNSIrecord.SSOAllowed = true
				repo.Update(theCNSIrecord, p.Config.EncryptionKeyInBytes)
			}
			// Return error from the login
			return err
		}
		return fmt.Errorf("the auto-registered endpoint UAA server does not match console UAA server")
	}
	log.Warn("Could not find current user UAA token")
	return err
}

func santizeInfoForSystemSharedTokenUser(cnsiUser *interfaces.ConnectedUser, isSysystemShared bool) {
	if isSysystemShared {
		cnsiUser.GUID = tokens.SystemSharedUserGuid // Used by front end also
		cnsiUser.Scopes = make([]string, 0)
		cnsiUser.Name = "system_shared"
	}
}

func (p *portalProxy) ConnectOAuth2(c echo.Context, cnsiRecord interfaces.CNSIRecord) (*interfaces.TokenRecord, error) {
	uaaRes, u, _, err := p.FetchOAuth2Token(cnsiRecord, c)
	if err != nil {
		return nil, err
	}
	tokenRecord := p.InitEndpointTokenRecord(u.TokenExpiry, uaaRes.AccessToken, uaaRes.RefreshToken, false)
	return &tokenRecord, nil
}

func (p *portalProxy) FetchOAuth2Token(cnsiRecord interfaces.CNSIRecord, c echo.Context) (*interfaces.UAAResponse, *interfaces.JWTUserTokenInfo, *interfaces.CNSIRecord, error) {
	endpoint := cnsiRecord.AuthorizationEndpoint

	tokenEndpoint := fmt.Sprintf("%s/oauth/token", endpoint)

	uaaRes, u, err := p.login(c, cnsiRecord.SkipSSLValidation, cnsiRecord.ClientId, cnsiRecord.ClientSecret, tokenEndpoint)

	if err != nil {
		if httpError, ok := err.(interfaces.ErrHTTPRequest); ok {
			// Try and parse the Response into UAA error structure (p.login only handles UAA requests)
			errMessage := ""
			authError := &interfaces.UAAErrorResponse{}
			if err := json.Unmarshal([]byte(httpError.Response), authError); err == nil {
				errMessage = fmt.Sprintf(": %s", authError.ErrorDescription)
			}
			return nil, nil, nil, interfaces.NewHTTPShadowError(
				httpError.Status,
				fmt.Sprintf("Could not connect to the endpoint%s", errMessage),
				"Could not connect to the endpoint: %s", err)
		}

		return nil, nil, nil, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Login failed",
			"Login failed: %v", err)
	}
	return uaaRes, u, &cnsiRecord, nil
}

func (p *portalProxy) logoutOfCNSI(c echo.Context) error {
	log.Debug("logoutOfCNSI")

	cnsiGUID := c.FormValue("cnsi_guid")

	if len(cnsiGUID) == 0 {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need CNSI GUID passed as form param")
	}

	userGUID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return fmt.Errorf("Could not find correct session value: %s", err)
	}

	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return fmt.Errorf("Unable to load CNSI record: %s", err)
	}

	// Get the existing token to see if it is connected as a system shared endpoint
	tr, ok := p.GetCNSITokenRecord(cnsiGUID, userGUID)
	if ok && tr.SystemShared {
		// User needs to be an admin
		user, err := p.StratosAuthService.GetUser(userGUID)
		if err != nil {
			return echo.NewHTTPError(http.StatusUnauthorized, "Can not disconnect System Shared endpoint - could not check user")
		}

		if !user.Admin {
			return echo.NewHTTPError(http.StatusUnauthorized, "Can not disconnect System Shared endpoint - user is not an administrator")
		}
		userGUID = tokens.SystemSharedUserGuid
	}

	// Clear the token
	return p.ClearCNSIToken(cnsiRecord, userGUID)
}

func (p *portalProxy) DoAuthFlowRequest(cnsiRequest *interfaces.CNSIRequest, req *http.Request, authHandler interfaces.AuthHandlerFunc) (*http.Response, error) {

	// get a cnsi token record and a cnsi record
	tokenRec, cnsi, err := p.getCNSIRequestRecords(cnsiRequest)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Endpoint records: %v", err)
	}
	return authHandler(tokenRec, cnsi)
}

// Clear the CNSI token
func (p *portalProxy) ClearCNSIToken(cnsiRecord interfaces.CNSIRecord, userGUID string) error {
	// If cnsi is cf AND cf is auto-register only clear the entry
	p.Config.AutoRegisterCFUrl = strings.TrimRight(p.Config.AutoRegisterCFUrl, "/")
	if cnsiRecord.CNSIType == "cf" && p.GetConfig().AutoRegisterCFUrl == cnsiRecord.APIEndpoint.String() {
		log.Debug("Setting token record as disconnected")

		tokenRecord := p.InitEndpointTokenRecord(0, "cleared_token", "cleared_token", true)
		if err := p.setCNSITokenRecord(cnsiRecord.GUID, userGUID, tokenRecord); err != nil {
			return fmt.Errorf("Unable to clear token: %s", err)
		}
	} else {
		log.Debug("Deleting Token")
		if err := p.deleteCNSIToken(cnsiRecord.GUID, userGUID); err != nil {
			return fmt.Errorf("Unable to delete token: %s", err)
		}
	}

	return nil
}

func (p *portalProxy) GetCNSIUser(cnsiGUID string, userGUID string) (*interfaces.ConnectedUser, bool) {
	user, _, ok := p.GetCNSIUserAndToken(cnsiGUID, userGUID)
	return user, ok
}

func (p *portalProxy) GetCNSIUserAndToken(cnsiGUID string, userGUID string) (*interfaces.ConnectedUser, *interfaces.TokenRecord, bool) {
	log.Debug("GetCNSIUserAndToken")

	// get the uaa token record
	cfTokenRecord, ok := p.GetCNSITokenRecord(cnsiGUID, userGUID)
	if !ok {
		msg := "Unable to retrieve CNSI token record."
		log.Debug(msg)
		return nil, nil, false
	}

	cnsiUser, ok := p.GetCNSIUserFromToken(cnsiGUID, &cfTokenRecord)

	// If this is a system shared endpoint, then remove some metadata that should not be send back to other users
	santizeInfoForSystemSharedTokenUser(cnsiUser, cfTokenRecord.SystemShared)

	return cnsiUser, &cfTokenRecord, ok
}

func (p *portalProxy) GetCNSIUserFromToken(cnsiGUID string, cfTokenRecord *interfaces.TokenRecord) (*interfaces.ConnectedUser, bool) {
	log.Debug("GetCNSIUserFromToken")

	// Custom handler for the Auth type available?
	authProvider := p.GetAuthProvider(cfTokenRecord.AuthType)
	if authProvider.UserInfo != nil {
		return authProvider.UserInfo(cnsiGUID, cfTokenRecord)
	}

	// Default
	return p.GetCNSIUserFromOAuthToken(cnsiGUID, cfTokenRecord)
}

func (p *portalProxy) GetCNSIUserFromBasicToken(cnsiGUID string, cfTokenRecord *interfaces.TokenRecord) (*interfaces.ConnectedUser, bool) {
	return &interfaces.ConnectedUser{
		GUID: cfTokenRecord.RefreshToken,
		Name: cfTokenRecord.RefreshToken,
	}, true
}

func (p *portalProxy) GetCNSIUserFromOAuthToken(cnsiGUID string, cfTokenRecord *interfaces.TokenRecord) (*interfaces.ConnectedUser, bool) {
	var cnsiUser *interfaces.ConnectedUser
	var scope = []string{}

	// get the scope out of the JWT token data
	userTokenInfo, err := p.GetUserTokenInfo(cfTokenRecord.AuthToken)
	if err != nil {
		msg := "Unable to find scope information in the CNSI UAA Auth Token: %s"
		log.Errorf(msg, err)
		return nil, false
	}

	// add the uaa entry to the output
	cnsiUser = &interfaces.ConnectedUser{
		GUID:   userTokenInfo.UserGUID,
		Name:   userTokenInfo.UserName,
		Scopes: userTokenInfo.Scope,
	}
	scope = userTokenInfo.Scope

	// is the user an CF admin?
	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		msg := "Unable to load CNSI record: %s"
		log.Errorf(msg, err)
		return nil, false
	}
	// TODO should be an extension point
	if cnsiRecord.CNSIType == "cf" {
		cnsiAdmin := strings.Contains(strings.Join(scope, ""), p.Config.CFAdminIdentifier)
		cnsiUser.Admin = cnsiAdmin
	}

	return cnsiUser, true
}

// Helper to initialize a token record using the specified parameters
func (p *portalProxy) InitEndpointTokenRecord(expiry int64, authTok string, refreshTok string, disconnect bool) interfaces.TokenRecord {
	tokenRecord := interfaces.TokenRecord{
		AuthToken:    authTok,
		RefreshToken: refreshTok,
		TokenExpiry:  expiry,
		Disconnected: disconnect,
		AuthType:     interfaces.AuthTypeOAuth2,
	}

	return tokenRecord
}

func (p *portalProxy) deleteCNSIToken(cnsiID string, userGUID string) error {
	log.Debug("deleteCNSIToken")

	err := p.unsetCNSITokenRecord(cnsiID, userGUID)
	if err != nil {
		log.Errorf("%v", err)
		return err
	}

	return nil
}

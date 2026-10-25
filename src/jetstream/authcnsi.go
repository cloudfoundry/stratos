package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"strings"

	"github.com/labstack/echo/v5"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/api/config"
	"github.com/cloudfoundry/stratos/src/jetstream/repository/tokens"
)

// CFAdminIdentifier - The scope that Cloud Foundry uses to convey administrative level perms
const CFAdminIdentifier = "cloud_controller.admin"

// Start SSO flow for an Endpoint
func (p *portalProxy) ssoLoginToCNSI(c *echo.Context) error {
	slog.Debug("ssoLoginToCNSI")
	endpointGUID := c.QueryParam("guid")
	if len(endpointGUID) == 0 {
		return api.NewHTTPShadowError(
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
		err := api.NewHTTPShadowError(
			http.StatusUnauthorized,
			"SSO Login: State parameter missing",
			"SSO Login: State parameter missing")
		return err
	}

	cnsiRecord, err := p.GetCNSIRecord(endpointGUID)
	if err != nil {
		return api.NewHTTPShadowError(
			http.StatusBadRequest,
			"Requested endpoint not registered",
			"No Endpoint registered with GUID %s: %s", endpointGUID, err)
	}

	// Check if this is first time in the flow, or via the callback
	code := c.QueryParam("code")

	if len(code) == 0 {
		// First time around
		// Use the standard SSO Login Callback endpoint, so this can be allow-listed for Stratos and Endpoint login
		returnURL := getSSORedirectURI(state, state, endpointGUID)
		redirectURL := fmt.Sprintf("%s/oauth/authorize?response_type=code&client_id=%s&redirect_uri=%s",
			cnsiRecord.AuthorizationEndpoint, cnsiRecord.ClientId, url.QueryEscape(returnURL))
		return c.Redirect(http.StatusTemporaryRedirect, redirectURL)
	}

	// Callback
	_, err = p.DoLoginToCNSI(c, endpointGUID, false)
	status := "ok"
	if err != nil {
		status = "fail"
	}

	// Take the user back to Stratos on the endpoints page
	redirect := fmt.Sprintf("/endpoints?cnsi_guid=%s&status=%s", endpointGUID, status)
	return c.Redirect(http.StatusTemporaryRedirect, redirect)
}

// Connect to the given Endpoint
// Note, an admin user can connect an endpoint as a system endpoint to share it with others

// loginToCNSI godoc
// @Summary Connect to the given endpoint
// @Description An admin user can connect an endpoint as a system endpoint to share it with others.
// @Accept	x-www-form-urlencoded
// @Produce	json
// @Param cnsi_guid formData string true "Endpoint GUID"
// @Param system_shared formData string false "Register as a system endpoint" Enums(true, false)
// @Param connect_type formData string false "Connection type" Enums(creds, none)
// @Param username formData string false "Username"
// @Param password formData string false "Password"
// @Success 201 {object} api.LoginRes "Connected endpoint object"
// @Failure 400 {object} api.ErrorResponseBody "Error response"
// @Failure 401 {object} api.ErrorResponseBody "Error response"
// @Security ApiKeyAuth
// @Router /tokens [post]
func (p *portalProxy) loginToCNSI(c *echo.Context) error {
	slog.Debug("loginToCNSI")

	var systemSharedToken = false

	params := new(api.LoginToCNSIParams)
	err := api.BindOnce(params, c)
	if err != nil {
		return err
	}
	slog.Debug("loginToCNSI", "params", params)

	if len(params.CNSIGUID) == 0 {
		return api.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need Endpoint GUID passed as form param")
	}

	systemSharedValue := params.SystemShared
	if len(systemSharedValue) > 0 {
		systemSharedToken = systemSharedValue == "true"
	}

	resp, err := p.DoLoginToCNSI(c, params.CNSIGUID, systemSharedToken)
	if err != nil {
		return err
	}

	jsonString, err := json.Marshal(resp)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	_, err = c.Response().Write(jsonString)
	return err
}

func (p *portalProxy) DoLoginToCNSI(c *echo.Context, cnsiGUID string, systemSharedToken bool) (*api.LoginRes, error) {

	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return nil, api.NewHTTPShadowError(
			http.StatusBadRequest,
			"Requested endpoint not registered",
			"No Endpoint registered with GUID %s: %s", cnsiGUID, err)
	}

	// Get the User ID since we save the CNSI token against the Console user guid, not the CNSI user guid so that we can look it up easily
	userID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}

	var replaced []*api.CNSIRecord

	// With user endpoints on (enabled or admin_only), a personal endpoint
	// (one with a creator) can be connected to only by its creator; anyone
	// else, admins included, is refused.
	if p.GetConfig().UserEndpointsEnabled != config.UserEndpointsConfigEnum.Disabled {

		if len(cnsiRecord.Creator) != 0 && cnsiRecord.Creator != userID {
			return nil, echo.NewHTTPError(http.StatusUnauthorized, "Can not connect - users are not allowed to connect to personal endpoints created by other users")
		}

		// A connected alternative at the same URL is disconnected, but only
		// once this connection works (below).
		cnsiList, err := p.listCNSIByAPIEndpoint(cnsiRecord.APIEndpoint.String())
		if err != nil {
			return nil, echo.NewHTTPError(
				http.StatusBadRequest,
				"Failed to retrieve list of CNSIs",
			).Wrap(fmt.Errorf("failed to retrieve list of CNSIs: %v", err))
		}

		for _, cnsi := range sameURLAlternatives(cnsiRecord, cnsiList, userID) {
			if _, ok := p.GetCNSITokenRecord(cnsi.GUID, userID); ok {
				replaced = append(replaced, cnsi)
			}
		}
	}

	// Register as a system endpoint?
	if systemSharedToken {
		user, err := p.StratosAuthService.GetUser(userID)
		if err != nil {
			return nil, echo.NewHTTPError(http.StatusUnauthorized, "Can not connect System Shared endpoint - could not check user")
		}

		// User needs to be an admin
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
				return nil, connectFailure(err)
			}

			err = p.setCNSITokenRecord(cnsiGUID, userID, *tokenRecord)
			if err != nil {
				return nil, api.NewHTTPShadowError(
					http.StatusBadRequest,
					"Failed to save Token for endpoint",
					"Error occurred: %s", err)
			}

			// Validate the connection - some endpoints may want to validate that the connected endpoint
			err = endpointPlugin.Validate(userID, cnsiRecord, *tokenRecord)
			if err != nil {
				// Clear the token
				if clearErr := p.ClearCNSIToken(cnsiRecord, userID); clearErr != nil {
					slog.Warn("unable to clear the token for the endpoint", "endpoint", cnsiGUID, "user", userID, "error", clearErr)
				}
				return nil, connectFailure(err)
			}

			for _, cnsi := range replaced {
				if clearErr := p.ClearCNSIToken(*cnsi, userID); clearErr != nil {
					slog.Warn("unable to clear the token for the endpoint", "endpoint", cnsi.GUID, "user", userID, "error", clearErr)
				}
			}

			resp := &api.LoginRes{
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
				resp.User = &api.ConnectedUser{
					GUID:   "Unknown",
					Name:   "Unknown",
					Scopes: []string{"read"},
					Admin:  true,
				}
			}

			return resp, nil
		}
	}

	return nil, api.NewHTTPShadowError(
		http.StatusBadRequest,
		"Endpoint connection not supported",
		"Endpoint connection not supported")
}

func (p *portalProxy) DoLoginToCNSIwithConsoleUAAtoken(c *echo.Context, theCNSIrecord api.CNSIRecord) error {
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
		cnsiInfo, _, err := cfEndpointSpec.Info(theCNSIrecord.APIEndpoint.String(), true, "")
		if err != nil {
			slog.Error("could not get the info for Cloud Foundry", "endpoint", theCNSIrecord.GUID, "error", err)
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
			repo, dbErr := p.GetStoreFactory().EndpointStore()
			if dbErr == nil {
				theCNSIrecord.SSOAllowed = true
				if updateErr := repo.Update(theCNSIrecord, p.Config.EncryptionKeyInBytes); updateErr != nil {
					slog.Warn("unable to update the endpoint to allow SSO login", "endpoint", theCNSIrecord.GUID, "error", updateErr)
				}
			}
			// Return error from the login
			return err
		}
		return fmt.Errorf("the auto-registered endpoint UAA server does not match console UAA server")
	}
	slog.Warn("Could not find the current user UAA token")
	return err
}

func santizeInfoForSystemSharedTokenUser(cnsiUser *api.ConnectedUser, isSysystemShared bool) {
	if isSysystemShared {
		cnsiUser.GUID = tokens.SystemSharedUserGuid // Used by front end also
		cnsiUser.Scopes = make([]string, 0)
		cnsiUser.Name = "system_shared"
	}
}

func (p *portalProxy) ConnectOAuth2(c *echo.Context, cnsiRecord api.CNSIRecord) (*api.TokenRecord, error) {
	uaaRes, u, _, err := p.FetchOAuth2Token(cnsiRecord, c)
	if err != nil {
		return nil, err
	}
	tokenRecord := p.InitEndpointTokenRecord(u.TokenExpiry, uaaRes.AccessToken, uaaRes.RefreshToken, false)
	return &tokenRecord, nil
}

func (p *portalProxy) FetchOAuth2Token(cnsiRecord api.CNSIRecord, c *echo.Context) (*api.UAAResponse, *api.JWTUserTokenInfo, *api.CNSIRecord, error) {
	endpoint := cnsiRecord.AuthorizationEndpoint

	tokenEndpoint := fmt.Sprintf("%s/oauth/token", endpoint)

	uaaRes, u, err := p.login(c, cnsiRecord.SkipSSLValidation, cnsiRecord.CACert, cnsiRecord.ClientId, cnsiRecord.ClientSecret, tokenEndpoint)

	if err != nil {
		// Status 0: UAA did not answer, so there is no UAA error to report.
		if httpError, ok := err.(api.ErrHTTPRequest); ok && httpError.Status != 0 {
			// Try and parse the Response into UAA error structure (p.login only handles UAA requests)
			errMessage := ""
			authError := &api.UAAErrorResponse{}
			if err := json.Unmarshal([]byte(httpError.Response), authError); err == nil {
				errMessage = fmt.Sprintf(": %s", authError.ErrorDescription)
			}
			_, reason, _ := classifyConnectError(err)
			return nil, nil, nil, api.NewHTTPShadowErrorWithReason(
				httpError.Status,
				reason,
				fmt.Sprintf("Could not connect to the endpoint%s", errMessage),
				"Could not connect to the endpoint: %s", err)
		}

		if _, reason, _ := classifyConnectError(err); reason != "" {
			return nil, nil, nil, connectFailure(err)
		}

		return nil, nil, nil, api.NewHTTPShadowError(
			http.StatusBadRequest,
			"Login failed",
			"Login failed: %v", err)
	}
	return uaaRes, u, &cnsiRecord, nil
}

// logoutOfCNSI godoc
// @Summary Disconnect from endpoint
// @Description
// @Accept	x-www-form-urlencoded
// @Produce	json
// @Param cnsi_guid path string true "Endpoint GUID"
// @Success 200
// @Failure 400 {object} api.ErrorResponseBody "Error response"
// @Failure 401 {object} api.ErrorResponseBody "Error response"
// @Security ApiKeyAuth
// @Router /tokens/{cnsi_guid} [delete]
func (p *portalProxy) logoutOfCNSI(c *echo.Context) error {
	slog.Debug("logoutOfCNSI")

	cnsiGUID := c.Param("cnsi_guid")

	if len(cnsiGUID) == 0 {
		return api.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need CNSI GUID passed as form param")
	}

	userGUID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return fmt.Errorf("could not find correct session value: %s", err)
	}

	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return fmt.Errorf("unable to load CNSI record: %s", err)
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

func (p *portalProxy) DoAuthFlowRequest(cnsiRequest *api.CNSIRequest, req *http.Request, authHandler api.AuthHandlerFunc) (*http.Response, error) {

	// get a cnsi token record and a cnsi record
	tokenRec, cnsi, err := p.getCNSIRequestRecords(cnsiRequest)
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve Endpoint records: %v", err)
	}
	return authHandler(tokenRec, cnsi)
}

// Clear the CNSI token
func (p *portalProxy) ClearCNSIToken(cnsiRecord api.CNSIRecord, userGUID string) error {
	// If cnsi is cf AND cf is auto-register only clear the entry
	p.Config.AutoRegisterCFUrl = strings.TrimRight(p.Config.AutoRegisterCFUrl, "/")
	if cnsiRecord.CNSIType == "cf" && p.GetConfig().AutoRegisterCFUrl == cnsiRecord.APIEndpoint.String() {
		slog.Debug("Setting the token record as disconnected", "endpoint", cnsiRecord.GUID, "user", userGUID)

		tokenRecord := p.InitEndpointTokenRecord(0, "cleared_token", "cleared_token", true)
		if err := p.setCNSITokenRecord(cnsiRecord.GUID, userGUID, tokenRecord); err != nil {
			return fmt.Errorf("unable to clear token: %s", err)
		}
	} else {
		slog.Debug("Deleting the token", "endpoint", cnsiRecord.GUID, "user", userGUID)
		if err := p.deleteCNSIToken(cnsiRecord.GUID, userGUID); err != nil {
			return fmt.Errorf("unable to delete token: %s", err)
		}
	}

	return nil
}

func (p *portalProxy) GetCNSIUser(cnsiGUID string, userGUID string) (*api.ConnectedUser, bool) {
	user, _, ok := p.GetCNSIUserAndToken(cnsiGUID, userGUID)
	return user, ok
}

func (p *portalProxy) GetCNSIUserAndToken(cnsiGUID string, userGUID string) (*api.ConnectedUser, *api.TokenRecord, bool) {
	slog.Debug("GetCNSIUserAndToken", "endpoint", cnsiGUID, "user", userGUID)

	// get the uaa token record
	cfTokenRecord, ok := p.GetCNSITokenRecord(cnsiGUID, userGUID)
	if !ok {
		msg := "Unable to retrieve CNSI token record."
		slog.Debug(msg, "endpoint", cnsiGUID, "user", userGUID)
		return nil, nil, false
	}

	cnsiUser, ok := p.GetCNSIUserFromToken(cnsiGUID, &cfTokenRecord)

	// If this is a system shared endpoint, then remove some metadata that should not be send back to other users
	santizeInfoForSystemSharedTokenUser(cnsiUser, cfTokenRecord.SystemShared)

	return cnsiUser, &cfTokenRecord, ok
}

func (p *portalProxy) GetCNSIUserFromToken(cnsiGUID string, cfTokenRecord *api.TokenRecord) (*api.ConnectedUser, bool) {
	slog.Debug("GetCNSIUserFromToken", "endpoint", cnsiGUID)

	// Custom handler for the Auth type available?
	authProvider := p.GetAuthProvider(cfTokenRecord.AuthType)
	if authProvider.UserInfo != nil {
		return authProvider.UserInfo(cnsiGUID, cfTokenRecord)
	}

	// Default
	return p.GetCNSIUserFromOAuthToken(cnsiGUID, cfTokenRecord)
}

func (p *portalProxy) GetCNSIUserFromBasicToken(cnsiGUID string, cfTokenRecord *api.TokenRecord) (*api.ConnectedUser, bool) {
	return &api.ConnectedUser{
		GUID: cfTokenRecord.RefreshToken,
		Name: cfTokenRecord.RefreshToken,
	}, true
}

func (p *portalProxy) GetCNSIUserFromOAuthToken(cnsiGUID string, cfTokenRecord *api.TokenRecord) (*api.ConnectedUser, bool) {
	var cnsiUser *api.ConnectedUser

	// get the scope out of the JWT token data
	userTokenInfo, err := p.GetUserTokenInfo(cfTokenRecord.AuthToken)
	if err != nil {
		slog.Error("unable to find scope information in the CNSI UAA Auth Token",
			"endpoint", cnsiGUID, "error", err)
		return nil, false
	}

	// add the uaa entry to the output
	cnsiUser = &api.ConnectedUser{
		GUID:   userTokenInfo.UserGUID,
		Name:   userTokenInfo.UserName,
		Scopes: userTokenInfo.Scope,
	}
	scope := userTokenInfo.Scope

	// is the user an CF admin?
	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		slog.Error("unable to load the CNSI record", "endpoint", cnsiGUID, "error", err)
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
func (p *portalProxy) InitEndpointTokenRecord(expiry int64, authTok string, refreshTok string, disconnect bool) api.TokenRecord {
	tokenRecord := api.TokenRecord{
		AuthToken:    authTok,
		RefreshToken: refreshTok,
		TokenExpiry:  expiry,
		Disconnected: disconnect,
		AuthType:     api.AuthTypeOAuth2,
		Enabled:      true,
	}

	return tokenRecord
}

func (p *portalProxy) deleteCNSIToken(cnsiID string, userGUID string) error {
	slog.Debug("deleteCNSIToken", "endpoint", cnsiID, "user", userGUID)

	err := p.unsetCNSITokenRecord(cnsiID, userGUID)
	if err != nil {
		slog.Error("unable to unset the CNSI token record", "endpoint", cnsiID, "user", userGUID, "error", err)
		return err
	}

	return nil
}

// Reasons a connect failed, sent as "reason" in the error response body
// so the frontend can tell them apart without reading the message.
const (
	// The endpoint answered 401 or 403 to the credentials.
	connectReasonAuthFailed = "auth_failed"
	// The endpoint did not answer, or answered with a 5xx.
	connectReasonUnreachable = "unreachable"
	// The TLS connection failed, e.g. the certificate is not trusted.
	connectReasonTLS = "tls"
)

// connectFailure turns an error from an endpoint plugin's Connect or
// Validate into the response the user sees. An error the plugin already
// shaped is kept as it is. Otherwise the status, reason and message come
// from classifyConnectError, and the full error goes to the log.
func connectFailure(err error) error {
	var shadowError api.ErrHTTPShadow
	if errors.As(err, &shadowError) {
		return shadowError
	}
	status, reason, why := classifyConnectError(err)
	return api.NewHTTPShadowErrorWithReason(
		status,
		reason,
		"Could not connect to the endpoint: "+why,
		"Could not connect to the endpoint: %s", err)
}

// classifyConnectError says why a connect failed: the response status, a
// connectReason (empty when none applies) and a message for the user.
//   - An answer from the endpoint (api.ErrHTTPRequest, as built by
//     api.LogHTTPError) is reported by its status, and its message when it
//     has one: 401 and 403 keep their status, a 5xx becomes 502, anything
//     else 400.
//   - A request that got no answer becomes 502, as a TLS failure or as
//     unreachable.
//   - Any other error is the plugin's own message, with 400.
func classifyConnectError(err error) (int, string, string) {
	var httpError api.ErrHTTPRequest
	if errors.As(err, &httpError) {
		if httpError.Status == 0 {
			// No response: what failed is the request, in InnerError.
			if httpError.InnerError == nil {
				return http.StatusBadGateway, connectReasonUnreachable, "the endpoint did not answer"
			}
			return classifyRequestFailure(httpError.InnerError)
		}
		answered := fmt.Sprintf("%d %s", httpError.Status, http.StatusText(httpError.Status))
		if message := answerMessage(httpError.Response); message != "" {
			answered += ": " + message
		}
		switch {
		case httpError.Status == http.StatusUnauthorized:
			return httpError.Status, connectReasonAuthFailed, "the endpoint rejected the credentials (" + answered + ")"
		case httpError.Status == http.StatusForbidden:
			return httpError.Status, connectReasonAuthFailed, "the endpoint refused access with these credentials (" + answered + ")"
		case httpError.Status >= 500:
			return http.StatusBadGateway, connectReasonUnreachable, "the endpoint answered " + answered
		default:
			return http.StatusBadRequest, "", "the endpoint answered " + answered
		}
	}
	if isTLSFailure(err) || isUnreachable(err) {
		return classifyRequestFailure(err)
	}
	return http.StatusBadRequest, "", err.Error()
}

// answerMessage is the "message" of a JSON answer, as Kubernetes (a
// Status), GitHub and GitLab give with an error status. Empty otherwise.
func answerMessage(body string) string {
	var answer struct {
		Message string `json:"message"`
	}
	if json.Unmarshal([]byte(body), &answer) != nil {
		return ""
	}
	return strings.TrimSpace(answer.Message)
}

// classifyRequestFailure reports a request that got no response.
func classifyRequestFailure(err error) (int, string, string) {
	if isTLSFailure(err) {
		return http.StatusBadGateway, connectReasonTLS, "a TLS connection to the endpoint failed (" + err.Error() + ")"
	}
	return http.StatusBadGateway, connectReasonUnreachable, "the endpoint could not be reached (" + err.Error() + ")"
}

func isTLSFailure(err error) bool {
	var verification *tls.CertificateVerificationError
	var unknownAuthority x509.UnknownAuthorityError
	var hostname x509.HostnameError
	var invalid x509.CertificateInvalidError
	var recordHeader tls.RecordHeaderError
	var alert tls.AlertError
	return errors.As(err, &verification) ||
		errors.As(err, &unknownAuthority) ||
		errors.As(err, &hostname) ||
		errors.As(err, &invalid) ||
		errors.As(err, &recordHeader) ||
		errors.As(err, &alert)
}

func isUnreachable(err error) bool {
	var netErr net.Error
	return errors.As(err, &netErr) || errors.Is(err, context.DeadlineExceeded)
}

// sameURLAlternatives returns the endpoints at the same URL that stand in
// for target: a user's own endpoint replaces the system endpoint of its
// type in the list, so only one of the pair stays connected. System
// endpoints never replace each other.
func sameURLAlternatives(target api.CNSIRecord, sameURL []*api.CNSIRecord, userID string) []*api.CNSIRecord {
	var alternatives []*api.CNSIRecord
	for _, cnsi := range sameURL {
		if cnsi.GUID == target.GUID || cnsi.CNSIType != target.CNSIType {
			continue
		}
		ownReplacesSystem := target.Creator == userID && len(cnsi.Creator) == 0
		systemReplacesOwn := len(target.Creator) == 0 && cnsi.Creator == userID
		if ownReplacesSystem || systemReplacesOwn {
			alternatives = append(alternatives, cnsi)
		}
	}
	return alternatives
}

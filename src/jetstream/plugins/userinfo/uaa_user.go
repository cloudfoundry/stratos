package userinfo

import (
	"bytes"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/labstack/echo/v5"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// UaaUserInfo for UAA User Info
type UaaUserInfo struct {
	portalProxy api.PortalProxy
	echo        *echo.Context
}

// InitUaaUserInfo creates a new UAA user info provider
func InitUaaUserInfo(portalProxy api.PortalProxy, c *echo.Context) Provider {
	return &UaaUserInfo{portalProxy: portalProxy, echo: c}
}

// GetUserInfo gets info for the specified user
func (userInfo *UaaUserInfo) GetUserInfo(id string) (int, []byte, *http.Header, error) {
	target := fmt.Sprintf("Users/%s", id)
	return userInfo.uaa(target, nil)
}

// UpdateUserInfo updates the user's info
func (userInfo *UaaUserInfo) UpdateUserInfo(profile *uaaUser) (int, error) {
	target := fmt.Sprintf("Users/%s", profile.ID)
	statusCode, _, _, err := userInfo.uaa(target, profile.Raw)
	return statusCode, err
}

// UpdatePassword updates the user's password
func (userInfo *UaaUserInfo) UpdatePassword(id string, passwordInfo *passwordChangeInfo) (int, error) {
	target := fmt.Sprintf("Users/%s/password", id)
	statusCode, _, _, err := userInfo.uaa(target, passwordInfo.Raw)
	return statusCode, err
}

func (userInfo *UaaUserInfo) uaa(target string, body []byte) (int, []byte, *http.Header, error) {
	slog.Debug("uaa request", "target", target)

	// Check session
	_, err := userInfo.portalProxy.GetSessionInt64Value(userInfo.echo, "exp")
	if err != nil {
		msg := "Could not find session date"
		slog.Error(msg, "error", err)
		return http.StatusForbidden, nil, nil, echo.NewHTTPError(http.StatusForbidden, msg)
	}

	sessionUser, err := userInfo.portalProxy.GetSessionStringValue(userInfo.echo, "user_id")
	if err != nil {
		msg := "Could not find user_id in Session"
		slog.Error(msg, "error", err)
		return http.StatusForbidden, nil, nil, echo.NewHTTPError(http.StatusForbidden, msg)
	}

	uaaEndpoint := userInfo.portalProxy.GetConfig().ConsoleConfig.UAAEndpoint

	// Now get the URL of the request and remove the path to give the path of the API that is being requested
	url := fmt.Sprintf("%s/%s", uaaEndpoint, target)

	username, err := userInfo.portalProxy.GetStratosAuthService().GetUsername(sessionUser)
	if err != nil {
		return http.StatusInternalServerError, nil, nil, err
	}

	// Check for custom header - if present, verify the user's password before making the request
	password := userInfo.echo.Request().Header.Get("x-stratos-password")
	if len(password) > 0 {
		// Need to verify the user's login
		err := userInfo.portalProxy.RefreshUAALogin(username, password, false)
		if err != nil {
			return http.StatusInternalServerError, nil, nil, err
		}
	}

	statusCode, body, headers, err := userInfo.doAPIRequest(sessionUser, url, userInfo.echo.Request(), body)
	if err != nil {
		return http.StatusInternalServerError, nil, nil, err
	}

	// Refresh the access token
	if statusCode == 401 {
		_, err := userInfo.portalProxy.RefreshUAAToken(sessionUser)
		if err != nil {
			return http.StatusInternalServerError, nil, nil, err
		}
		statusCode, body, headers, err = userInfo.doAPIRequest(sessionUser, url, userInfo.echo.Request(), body)
		if err != nil {
			return http.StatusInternalServerError, nil, nil, err
		}
	}

	// If we have the user's password, log them in again
	// This is used when the API call that is being made revokes the current access and refresh tokens
	if len(password) > 0 {
		newPassword := userInfo.echo.Request().Header.Get("x-stratos-password-new")
		if len(newPassword) > 0 {
			password = newPassword
		}
		err := userInfo.portalProxy.RefreshUAALogin(username, password, true)
		if err != nil {
			return http.StatusInternalServerError, nil, nil, err
		}
	}

	return statusCode, body, headers, nil

}

func (userInfo *UaaUserInfo) doAPIRequest(sessionUser string, url string, echoReq *http.Request, body []byte) (int, []byte, *http.Header, error) {
	// Proxy the request to the UAA on behalf of the user
	slog.Debug("doAPIRequest", "url", url, "user", sessionUser)

	tokenRec, err := userInfo.portalProxy.GetUAATokenRecord(sessionUser)
	if err != nil {
		slog.Debug("Can not locate token for user", "user", sessionUser, "error", err)
		return 0, nil, nil, echo.NewHTTPError(http.StatusForbidden, "Can not locate token for user")
	}

	// Proxy the request
	var res *http.Response
	var req *http.Request

	req, err = http.NewRequest(echoReq.Method, url, bytes.NewReader(body))
	if err != nil {
		return 0, nil, nil, err
	}

	// Add the authorization header
	req.Header.Set("Authorization", "bearer "+tokenRec.AuthToken)
	if echoReq.Method == http.MethodPost || echoReq.Method == http.MethodPut {
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json")
		copyHeaderIfSet(echoReq, req, "If-Match")
		copyHeaderIfSet(echoReq, req, "X-Identity-Zone-Id")
		copyHeaderIfSet(echoReq, req, "X-Identity-Zone-Subdomain")
	}

	client := userInfo.portalProxy.GetHttpClient(userInfo.portalProxy.GetConfig().ConsoleConfig.SkipSSLValidation, "")
	res, err = client.Do(req)
	if err != nil {
		slog.Debug("request failed", "url", url, "error", err)
		return 0, nil, nil, fmt.Errorf("Request failed: %v", err)
	}

	data, err := io.ReadAll(res.Body)
	defer func() { _ = res.Body.Close() }()

	slog.Debug("User profile request completed OK", "url", url)
	return res.StatusCode, data, &res.Header, err
}

func copyHeaderIfSet(src *http.Request, dest *http.Request, name string) {
	if value, ok := src.Header[name]; ok {
		if len(value) > 0 {
			// We only expect headers to be single valued
			dest.Header.Set(name, value[0])
		}
	}
}

func fwdResponseHeaders(src *http.Header, dest http.Header) {
	slog.Debug("fwdResponseHeaders")

	if src == nil {
		return
	}

	for k, headers := range *src {
		switch {
		// Skip these
		//  - "Referer" causes CF to fail with a 403
		//  - "Connection", "x-cap-*" and "Cookie" are consumed by us
		case k == "Connection", k == "Cookie", k == "Referer", k == "Accept-Encoding",
			strings.HasPrefix(strings.ToLower(k), "x-cap-"),
			strings.HasPrefix(strings.ToLower(k), "x-forwarded-"):

		// Forwarding everything else
		default:
			for _, h := range headers {
				dest.Add(k, h)
			}
		}
	}
}

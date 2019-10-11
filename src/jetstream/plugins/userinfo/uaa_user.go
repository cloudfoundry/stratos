package userinfo

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// UaaUserInfo for UAA User Info
type UaaUserInfo struct {
	portalProxy interfaces.PortalProxy
	echo        echo.Context
}

// InitUaaUserInfo creates a new UAA user info provider
func InitUaaUserInfo(portalProxy interfaces.PortalProxy, c echo.Context) Provider {
	return &UaaUserInfo{portalProxy: portalProxy, echo: c}
}

// GetUserInfo gets info for the specified user
func (userInfo *UaaUserInfo) GetUserInfo(id string) (int, []byte, error) {
	target := fmt.Sprintf("Users/%s", id)
	return userInfo.uaa(target, nil)
}

// UpdateUserInfo updates the user's info
func (userInfo *UaaUserInfo) UpdateUserInfo(profile *uaaUser) (error) {
	target := fmt.Sprintf("Users/%s", profile.ID)
	_, _, err := userInfo.uaa(target, profile.Raw)
	return err
}

// UpdatePassword updates the user's password
func (userInfo *UaaUserInfo) UpdatePassword(id string, passwordInfo *passwordChangeInfo) (error) {
	target := fmt.Sprintf("Users/%s/password", id)
	_, _, err := userInfo.uaa(target, passwordInfo.Raw)
	return err
}

func (userInfo *UaaUserInfo) uaa(target string, body []byte) (int, []byte, error)  {
	log.Debug("uaa request")

	// Check session
	_, err := userInfo.portalProxy.GetSessionInt64Value(userInfo.echo, "exp")
	if err != nil {
		msg := "Could not find session date"
		log.Error(msg)
		return http.StatusForbidden, nil, echo.NewHTTPError(http.StatusForbidden, msg)
	}

	sessionUser, err := userInfo.portalProxy.GetSessionStringValue(userInfo.echo, "user_id")
	if err != nil {
		msg := "Could not find user_id in Session"
		log.Error(msg)
		return http.StatusForbidden, nil, echo.NewHTTPError(http.StatusForbidden, msg)
	}

	uaaEndpoint := userInfo.portalProxy.GetConfig().ConsoleConfig.UAAEndpoint

	// Now get the URL of the request and remove the path to give the path of the API that is being requested
	url := fmt.Sprintf("%s/%s", uaaEndpoint, target)

	username, err := userInfo.portalProxy.GetUsername(sessionUser)
	if err != nil {
		return http.StatusInternalServerError, nil, err
	}

	// Check for custom header - if present, verify the user's password before making the request
	password := userInfo.echo.Request().Header.Get("x-stratos-password")
	if len(password) > 0 {
		// Need to verify the user's login
		err := userInfo.portalProxy.RefreshUAALogin(username, password, false)
		if err != nil {
			return  http.StatusInternalServerError, nil, err
		}
	}

	statusCode, body, err := userInfo.doAPIRequest(sessionUser, url, userInfo.echo.Request(), body)
	if err != nil {
		return http.StatusInternalServerError, nil, err
	}

	// Refresh the access token
	if statusCode == 401 {
		_, err := userInfo.portalProxy.RefreshUAAToken(sessionUser)
		if err != nil {
			return  http.StatusInternalServerError, nil, err
		}
		statusCode, body, err = userInfo.doAPIRequest(sessionUser, url, userInfo.echo.Request(), body)
		if err != nil {
			return  http.StatusInternalServerError, nil, err
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
			return  http.StatusInternalServerError, nil, err
		}
	}

	return statusCode, body, nil

}

func (userInfo *UaaUserInfo) doAPIRequest(sessionUser string, url string, echoReq *http.Request, body []byte) (int, []byte, error) {
	// Proxy the request to the UAA on behalf of the user
	log.Debugf("doAPIRequest: %s", url)

	tokenRec, err := userInfo.portalProxy.GetUAATokenRecord(sessionUser)
	if err != nil {
		return 0, nil, echo.NewHTTPError(http.StatusForbidden, "Can not locate token for user")
	}

	// Proxy the request
	var res *http.Response
	var req *http.Request

	req, err = http.NewRequest(echoReq.Method, url, bytes.NewReader(body))
	if err != nil {
		return 0, nil, err
	}

	// Copy original headers through, except custom portal-proxy Headers
	fwdHeaders(echoReq, req)

	req.Header.Set("Authorization", "bearer "+tokenRec.AuthToken)

	client := userInfo.portalProxy.GetHttpClient(userInfo.portalProxy.GetConfig().ConsoleConfig.SkipSSLValidation)
	res, err = client.Do(req)
	if err != nil {
		return 0, nil, fmt.Errorf("Request failed: %v", err)
	}

	data, err := ioutil.ReadAll(res.Body)
	defer res.Body.Close()

	return res.StatusCode, data, err
}

func fwdHeaders(uaaReq *http.Request, req *http.Request) {
	log.Debug("fwdHeaders")

	for k, headers := range uaaReq.Header {
		switch {
		// Skip these
		//  - "Referer" causes CF to fail with a 403
		//  - "Connection", "x-cap-*" and "Cookie" are consumed by us
		case k == "Connection", k == "Cookie", k == "Referer", strings.HasPrefix(strings.ToLower(k), "x-cap-"):

		// Forwarding everything else
		default:
			for _, h := range headers {
				req.Header.Add(k, h)
			}
		}
	}
}

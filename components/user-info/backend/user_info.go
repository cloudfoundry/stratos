package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"

	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
)

func (userInfo *UserInfo) uaa(c echo.Context) error {

	log.Info("UAA REQUEST")

	uaaEndpoint := userInfo.portalProxy.GetConfig().ConsoleConfig.UAAEndpoint

	// Proxy the request to the UAA on behalf of the user

	// Check session
	sessionExpireTime, err := userInfo.portalProxy.GetSessionInt64Value(c, "exp")
	if err != nil {
		msg := "Could not find session date"
		log.Error(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	log.Info(sessionExpireTime)

	sessionUser, err := userInfo.portalProxy.GetSessionStringValue(c, "user_id")
	if err != nil {
		msg := "Could not find user_id in Session"
		log.Error(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	tokenRec, err := userInfo.portalProxy.GetUAATokenRecord(sessionUser)
	if err != nil {
		return echo.NewHTTPError(http.StatusForbidden, "Can not locate token for user")
	}

	log.Info(c.Path())

	path := c.Path()
	// We know this is a wildcard path, so remove the trailing '*'
	//path = path[:len(path)-1]

	// Now get the URL of the request and remove the path to give the path of the API that is being requested
	target := c.Request().URL().Path()

	log.Infof("Target URL: %s", target)
	target = target[(len(path) - 1):]

	log.Infof("Target URL: %s", target)

	url := fmt.Sprintf("%s/%s", uaaEndpoint, target)

	log.Info(url)

	uaaRequest := c.Request()

	// Proxy the request
	//	var body io.Reader
	var res *http.Response
	var req *http.Request

	// if len(uaaRequest.Body) > 0 {
	// 	body = bytes.NewReader(uaaRequest.Body)
	// }
	req, err = http.NewRequest(uaaRequest.Method(), url, uaaRequest.Body())
	if err != nil {
		return err
	}

	// Copy original headers through, except custom portal-proxy Headers
	//fwdCNSIStandardHeaders(uaaRequest, req)

	req.Header.Set("Authorization", "bearer "+tokenRec.AuthToken)

	client := userInfo.portalProxy.GetHttpClient(userInfo.portalProxy.GetConfig().ConsoleConfig.SkipSSLValidation)
	res, err = client.Do(req)
	if err != nil {
		return fmt.Errorf("Request failed: %v", err)
	}

	data, err := ioutil.ReadAll(res.Body)
	defer res.Body.Close()

	// in passthrough mode, set the status code to that of the single response
	c.Response().WriteHeader(res.StatusCode)

	// we don't care if this fails
	_, _ = c.Response().Write(data)

	// if res.StatusCode != 401 {
	// 	return nil
	// }

	// Access token must have expired

	return nil
}

func fwdCNSIStandardHeaders(uaaReq *http.Request, req *http.Request) {
	log.Debug("fwdCNSIStandardHeaders")
	for k, v := range uaaReq.Header {
		switch {
		// Skip these
		//  - "Referer" causes CF to fail with a 403
		//  - "Connection", "X-Cnap-*" and "Cookie" are consumed by us
		case k == "Connection", k == "Cookie", k == "Referer", strings.HasPrefix(strings.ToLower(k), "x-cnap-"):

		// Forwarding everything else
		default:
			req.Header[k] = v
		}
	}
}

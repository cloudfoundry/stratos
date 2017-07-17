package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"

	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine"
)

func (userInfo *UserInfo) uaa(c echo.Context) error {

	log.Info("UAA REQUEST")

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

	uaaEndpoint := userInfo.portalProxy.GetConfig().ConsoleConfig.UAAEndpoint
	path := c.Path()
	// We know this is a wildcard path, so remove the trailing '*'
	//path = path[:len(path)-1]

	// Now get the URL of the request and remove the path to give the path of the API that is being requested
	target := c.Request().URL().Path()
	target = target[(len(path) - 1):]
	url := fmt.Sprintf("%s/%s", uaaEndpoint, target)

	statusCode, body, err := userInfo.doApiRequest(sessionUser, url, c.Request())
	if err != nil {
		return err
	}

	log.Info("Call finished")
	log.Infof("Status code: %d", statusCode)

	// Refresh the access token
	if statusCode == 401 {
		log.Info("Updating access token for the UAA")
		_, err := userInfo.portalProxy.RefreshUAAToken(sessionUser)
		if err != nil {
			log.Error("Failed to refresh UAA Token")
			log.Error(err)
			return err
		}

		statusCode, body, err = userInfo.doApiRequest(sessionUser, url, c.Request())
		if err != nil {
			log.Error("Failed to make API Call")
			return err
		}
	}

	c.Response().WriteHeader(statusCode)

	// we don't care if this fails
	_, _ = c.Response().Write(body)

	return nil
}

func (userInfo *UserInfo) doApiRequest(sessionUser string, url string, echoReq engine.Request) (stausCode int, body []byte, err error) {
	// Proxy the request to the UAA on behalf of the user

	log.Infof("doApiRequest: %s", url)

	tokenRec, err := userInfo.portalProxy.GetUAATokenRecord(sessionUser)
	if err != nil {
		return 0, nil, echo.NewHTTPError(http.StatusForbidden, "Can not locate token for user")
	}

	// Proxy the request
	//	var body io.Reader
	var res *http.Response
	var req *http.Request

	// if len(uaaRequest.Body) > 0 {
	// 	body = bytes.NewReader(uaaRequest.Body)
	// }
	req, err = http.NewRequest(echoReq.Method(), url, echoReq.Body())
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

func fwdHeaders(uaaReq engine.Request, req *http.Request) {
	log.Debug("fwdHeaders")
	for _, k := range uaaReq.Header().Keys() {
		switch {
		// Skip these
		//  - "Referer" causes CF to fail with a 403
		//  - "Connection", "X-Cnap-*" and "Cookie" are consumed by us
		case k == "Connection", k == "Cookie", k == "Referer", strings.HasPrefix(strings.ToLower(k), "x-cnap-"):

		// Forwarding everything else
		default:
			req.Header[k] = []string{uaaReq.Header().Get(k)}
		}
	}
}

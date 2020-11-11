package userinfo

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"

	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo/v4"
)

// Module init will register plugin
func init() {
	interfaces.AddPlugin("userinfo", nil, Init)
}

// UserInfo is a plugin to fetch user info from the UAA
type UserInfo struct {
	portalProxy interfaces.PortalProxy
}

// Init creates a new UserInfo
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &UserInfo{portalProxy: portalProxy}, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (userInfo *UserInfo) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (userInfo *UserInfo) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetRoutePlugin gets the route plugin for this plugin
func (userInfo *UserInfo) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return userInfo, nil
}

// AddAdminGroupRoutes adds the admin routes for this plugin to the Echo server
func (userInfo *UserInfo) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

// AddSessionGroupRoutes adds the session routes for this plugin to the Echo server
func (userInfo *UserInfo) AddSessionGroupRoutes(echoGroup *echo.Group) {

	// Only make available specific endpoints for the User Profile for now
	// Get the user information for the current user session
	echoGroup.GET("/users/:id", userInfo.userInfo)
	echoGroup.PUT("/users/:id", userInfo.updateUserInfo)
	echoGroup.PUT("/users/:id/password", userInfo.updateUserPassword)
}

// Init performs plugin initialization
func (userInfo *UserInfo) Init() error {

	return nil
}

func (userInfo *UserInfo) getProvider(c echo.Context) Provider {
	log.Debugf("getUserInfoProvider: %v", userInfo.portalProxy.GetConfig().AuthEndpointType)
	if interfaces.AuthEndpointTypes[userInfo.portalProxy.GetConfig().AuthEndpointType] == interfaces.Local {
		return InitLocalUserInfo(userInfo.portalProxy)
	} else if interfaces.AuthEndpointTypes[userInfo.portalProxy.GetConfig().AuthEndpointType] == interfaces.AuthNone {
		return InitNoAuthUserInfo(userInfo.portalProxy)
	}

	return InitUaaUserInfo(userInfo.portalProxy, c)
}

func (userInfo *UserInfo) preFlightChecks(c echo.Context) (string, error) {
	// Check session
	_, err := userInfo.portalProxy.GetSessionInt64Value(c, "exp")
	if err != nil {
		msg := "Could not find session date"
		log.Error(msg)
		return "", echo.NewHTTPError(http.StatusForbidden, msg)
	}

	sessionUser, err := userInfo.portalProxy.GetSessionStringValue(c, "user_id")
	if err != nil {
		msg := "Could not find user_id in Session"
		log.Error(msg)
		return "", echo.NewHTTPError(http.StatusForbidden, msg)
	}

	id := c.Param("id")
	if id != sessionUser {
		return id, echo.NewHTTPError(http.StatusForbidden, "Invalid user id")
	}

	return id, nil
}

// get user info for the current user
func (userInfo *UserInfo) userInfo(c echo.Context) error {
	id, err := userInfo.preFlightChecks(c)
	if err != nil {
		return err
	}

	provider := userInfo.getProvider(c)
	statusCode, body, headers, err := provider.GetUserInfo(id)
	if err != nil {
		return err
	}

	fwdResponseHeaders(headers, c.Response().Header())

	c.Response().WriteHeader(statusCode)
	_, _ = c.Response().Write(body)

	return nil
}

// update the user info for the current user
func (userInfo *UserInfo) updateUserInfo(c echo.Context) error {
	_, err := userInfo.preFlightChecks(c)
	if err != nil {
		return err
	}

	provider := userInfo.getProvider(c)

	body, err := ioutil.ReadAll(c.Request().Body)
	if err != nil {
		log.Errorf("Unexpected response: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid message body")
	}

	updatedProfile := &uaaUser{}
	updatedProfile.Raw = body
	err = json.Unmarshal(body, updatedProfile)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid message body")
	}

	statusCode, err := provider.UpdateUserInfo(updatedProfile)
	if err != nil {
		if httpError, ok := err.(interfaces.ErrHTTPShadow); ok {
			return httpError
		}

		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Unable to update user profile",
			"Unable to update user profile: %v", err,
		)
	}

	c.Response().WriteHeader(statusCode)

	return nil
}

// update the user info for the current user
func (userInfo *UserInfo) updateUserPassword(c echo.Context) error {
	id, err := userInfo.preFlightChecks(c)
	if err != nil {
		return err
	}

	provider := userInfo.getProvider(c)

	body, err := ioutil.ReadAll(c.Request().Body)
	if err != nil {
		log.Errorf("Unexpected response: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid message body")
	}

	passwordInfo := &passwordChangeInfo{}
	passwordInfo.Raw = body
	err = json.Unmarshal(body, passwordInfo)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid message body")
	}

	statusCode, err := provider.UpdatePassword(id, passwordInfo)
	if err != nil {
		if httpError, ok := err.(interfaces.ErrHTTPShadow); ok {
			return httpError
		}

		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Unable to update user password",
			"Unable to update user password: %v", err,
		)
	}

	c.Response().WriteHeader(statusCode)

	return nil
}

package userinvite

import (
	"errors"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	//log "github.com/sirupsen/logrus"
)

// UserInvite is a plugin to allow user invitations
type UserInvite struct {
	portalProxy interfaces.PortalProxy
	Config      *Config
}

// UserInviteUserID is the User ID for the user invitation token
const UserInviteUserID = "00000000-1111-2222-3333-444444444455"

// UserInvitePluginConfigSetting is config value send back to the client to indicate if user invite is enabled
const UserInvitePluginConfigSetting = "userInvitationsEnabled"

// Init creates a new UserInvite
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	init := &UserInvite{portalProxy: portalProxy}
	c, err := init.LoadConfig()
	if err != nil {
		return init, err
	}

	init.Config = c
	return init, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (userinvite *UserInvite) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (userinvite *UserInvite) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return userinvite, nil
}

// GetRoutePlugin gets the route plugin for this plugin
func (userinvite *UserInvite) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return userinvite, nil
}

// AddAdminGroupRoutes adds the admin routes for this plugin to the Echo server
func (userinvite *UserInvite) AddAdminGroupRoutes(echoGroup *echo.Group) {
	echoGroup.GET("/invite/:id", userinvite.status)
	echoGroup.POST("/invite/:id", userinvite.configure)
	echoGroup.DELETE("/invite/:id", userinvite.remove)
}

// AddSessionGroupRoutes adds the session routes for this plugin to the Echo server
func (userinvite *UserInvite) AddSessionGroupRoutes(echoGroup *echo.Group) {

	// User Info
	echoGroup.POST("/invite/send/:id", userinvite.invite)
}

// Init performs plugin initialization
func (userinvite *UserInvite) Init() error {
	err := userinvite.ValidateConfig(userinvite.Config)
	if err != nil {
		userinvite.portalProxy.GetConfig().PluginConfig[UserInvitePluginConfigSetting] = "false"
		return err
	}

	userinvite.portalProxy.GetConfig().PluginConfig[UserInvitePluginConfigSetting] = "true"
	return nil
}

package userinvite

import (
	"errors"
	"fmt"

	"github.com/cloudfoundry-community/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

// Module init will register plugin
func init() {
	api.AddPlugin("userinvite", []string{"cloudfoundry"}, Init)
}

// UserInvite is a plugin to allow user invitations
type UserInvite struct {
	portalProxy api.PortalProxy
	Config      *Config
}

// UserInviteUserID is the User ID for the user invitation token
const UserInviteUserID = "00000000-1111-2222-3333-444444444455"

// UserInvitePluginConfigSetting is config value send back to the client to indicate if user invite is enabled
const UserInvitePluginConfigSetting = "userInvitationsEnabled"

// UAAClientAuthType is the Auth Type for client id/client secret
const UAAClientAuthType = "uaa-client"

// Init creates a new UserInvite
func Init(portalProxy api.PortalProxy) (api.StratosPlugin, error) {

	init := &UserInvite{portalProxy: portalProxy}
	c, err := init.LoadConfig(*portalProxy.Env())
	if err != nil {
		return init, err
	}

	init.Config = c
	return init, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (userinvite *UserInvite) GetMiddlewarePlugin() (api.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (userinvite *UserInvite) GetEndpointPlugin() (api.EndpointPlugin, error) {
	return userinvite, nil
}

// GetRoutePlugin gets the route plugin for this plugin
func (userinvite *UserInvite) GetRoutePlugin() (api.RoutePlugin, error) {
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
	userinvite.portalProxy.AddLoginHook(5, userinvite.initClientToken)
	userinvite.portalProxy.AddAuthProvider(UAAClientAuthType, api.AuthProvider{
		Handler:  userinvite.doUAAClientAuthFlow,
		UserInfo: userinvite.getCNSIUserFromUAAClientToken,
	})

	return nil
}

func (userinvite *UserInvite) initClientToken(context echo.Context) error {
	// Do we have a valid cf guid?
	if userinvite.portalProxy.GetConfig().CloudFoundryInfo == nil ||
		len(userinvite.portalProxy.GetConfig().CloudFoundryInfo.EndpointGUID) == 0 {
		return nil
	}
	cfGuid := userinvite.portalProxy.GetConfig().CloudFoundryInfo.EndpointGUID

	// Can the plugin be configured?
	if userinvite.portalProxy.GetConfig().PluginConfig == nil ||
		userinvite.portalProxy.GetConfig().PluginConfig[UserInvitePluginConfigSetting] != "true" {
		return nil
	}

	// Is the client token already initialised?
	if _, ok := userinvite.portalProxy.GetCNSITokenRecord(cfGuid, UserInviteUserID); ok {
		return nil
	}

	// Do we have the required config?
	if userinvite.Config.Client == nil ||
		len(userinvite.Config.Client.ID) == 0 ||
		len(userinvite.Config.Client.Secret) == 0 {
		return nil
	}

	// Attempt to use config values to create token
	if _, _, err := userinvite.RefreshToken(cfGuid, userinvite.Config.Client.ID, userinvite.Config.Client.Secret); err != nil {
		return fmt.Errorf("Failed to verify invite client id and secret: %v", err)
	}

	log.Info("Invite User UAA client initialized")
	return nil
}

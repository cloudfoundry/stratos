package main

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"github.com/govau/cf-common/env"
	"github.com/labstack/echo"
	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/console_config"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces/config"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/localusers"
)

const (
	setupRequestRegex       = "^/pp/v1/setup$"
	setupUpdateRequestRegex = "^/pp/v1/setup/update$"
	versionRequestRegex     = "^/pp/v1/version$"
	backendRequestRegex     = "^/pp/v1/"
	systemGroupName         = "env"
)

func (p *portalProxy) setupConsole(c echo.Context) error {

	consoleRepo, err := console_config.NewPostgresConsoleConfigRepository(p.DatabaseConnectionPool)
	if err != nil {
		return echo.NewHTTPError(http.StatusForbidden, "Failed to connect to Database!")
	}

	// Check if alerady set up
	if p.GetConfig().ConsoleConfig.IsSetupComplete() {
		return c.NoContent(http.StatusServiceUnavailable)
	}

	consoleConfig := new(interfaces.ConsoleConfig)
	url, err := url.Parse(c.FormValue("uaa_endpoint"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid UAA Endpoint value")
	}

	consoleConfig.UAAEndpoint = url
	// Default auth endpoint to the same value as UAA Endpoint when setup via the UI setup (for now)
	consoleConfig.AuthorizationEndpoint = url
	username := c.FormValue("username")
	password := c.FormValue("password")
	consoleConfig.ConsoleClient = c.FormValue("console_client")
	consoleConfig.ConsoleClientSecret = c.FormValue("console_client_secret")

	skipSSLValidation, err := strconv.ParseBool(c.FormValue("skip_ssl_validation"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid Skip SSL Validation value")
	}
	consoleConfig.SkipSSLValidation = skipSSLValidation

	ssoLogin, err := strconv.ParseBool(c.FormValue("use_sso"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid Use SSO value")
	}
	consoleConfig.UseSSO = ssoLogin

	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Failed to store Console configuration data",
			"Failed to establish DB connection due to %s", err)
	}

	// Authenticate with UAA
	authEndpoint := fmt.Sprintf("%s/oauth/token", url)
	uaaRes, err := p.getUAATokenWithCreds(skipSSLValidation, username, password, consoleConfig.ConsoleClient, consoleConfig.ConsoleClientSecret, authEndpoint)
	if err != nil {

		errInfo, ok := err.(interfaces.ErrHTTPRequest)
		if ok {
			if errInfo.Status == 0 {
				if strings.Contains(errInfo.Error(), "x509: certificate") {
					return interfaces.NewHTTPShadowError(
						http.StatusBadRequest,
						"Could not connect to the UAA - Certificate error - check Skip SSL validation setting",
						"Could not connect to the UAA - Certificate error - check Skip SSL validation setting: %+v", err)
				}
				return interfaces.NewHTTPShadowError(
					http.StatusBadRequest,
					"Could not connect to the UAA - check UAA Endpoint URL",
					"Could not connect to the UAA - check UAA Endpoint URL: %+v", err)
			}
		}
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Failed to authenticate with UAA - check Client ID, Secret and credentials",
			"Failed to authenticate with UAA due to %s", err)
	}

	userTokenInfo, err := p.GetUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Failed to authenticate with UAA - check Client ID, Secret and credentials",
			"Failed to authenticate with UAA due to %s", err)
	}

	// Persist to database
	err = saveConsoleConfig(consoleRepo, consoleConfig)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Failed to store Console configuration data",
			"Console configuration data storage failed due to %s", err)
	}

	c.JSON(http.StatusOK, userTokenInfo)
	return nil
}

func saveConsoleConfig(consoleRepo console_config.Repository, consoleConfig *interfaces.ConsoleConfig) error {
	log.Debugf("Saving ConsoleConfig: %+v", consoleConfig)

	if err := consoleRepo.SetValue(systemGroupName, "UAA_ENDPOINT", consoleConfig.UAAEndpoint.String()); err != nil {
		return err
	}

	if err := consoleRepo.SetValue(systemGroupName, "AUTHORIZATION_ENDPOINT", consoleConfig.AuthorizationEndpoint.String()); err != nil {
		return err
	}

	if err := consoleRepo.SetValue(systemGroupName, "CONSOLE_CLIENT", consoleConfig.ConsoleClient); err != nil {
		return err
	}

	if err := consoleRepo.SetValue(systemGroupName, "CONSOLE_CLIENT_SECRET", consoleConfig.ConsoleClientSecret); err != nil {
		return err
	}

	if err := consoleRepo.SetValue(systemGroupName, "SKIP_SSL_VALIDATION", strconv.FormatBool(consoleConfig.SkipSSLValidation)); err != nil {
		return err
	}

	if err := consoleRepo.SetValue(systemGroupName, "SSO_LOGIN", strconv.FormatBool(consoleConfig.UseSSO)); err != nil {
		return err
	}

	return nil
}

func updateConsoleConfig(consoleRepo console_config.Repository, consoleConfig *interfaces.ConsoleConfig) error {
	log.Debugf("Update ConsoleConfig: %+v", consoleConfig)

	return consoleRepo.SetValue(systemGroupName, "CONSOLE_ADMIN_SCOPE", consoleConfig.ConsoleAdminScope)
}

func (p *portalProxy) setupConsoleUpdate(c echo.Context) error {

	consoleRepo, err := console_config.NewPostgresConsoleConfigRepository(p.DatabaseConnectionPool)
	if err != nil {
		return echo.NewHTTPError(http.StatusForbidden, "Failed to connect to Database!")
	}

	// Check if already set up
	if p.GetConfig().ConsoleConfig.IsSetupComplete() {
		return c.NoContent(http.StatusServiceUnavailable)
	}

	consoleConfig := new(interfaces.ConsoleConfig)
	consoleConfig.ConsoleAdminScope = c.FormValue("console_admin_scope")

	if err != nil {
		return fmt.Errorf("Unable to initialise console backend config due to: %+v", err)
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Failed to store Console configuration data",
			"Failed to establish DB connection due to %s", err)
	}

	err = updateConsoleConfig(consoleRepo, consoleConfig)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Failed to store Console configuration data",
			"Console configuration data storage failed due to %s", err)
	}
	c.NoContent(http.StatusOK)
	log.Infof("Updated Stratos setup")
	return nil
}

func (p *portalProxy) initialiseConsoleConfig(envLookup *env.VarSet) (*interfaces.ConsoleConfig, error) {
	log.Debug("initialiseConsoleConfig")

	consoleConfig := &interfaces.ConsoleConfig{}
	if err := config.Load(consoleConfig, envLookup.Lookup); err != nil {
		return consoleConfig, fmt.Errorf("Unable to load Console configuration. %v", err)
	}

	if len(consoleConfig.AuthEndpointType) == 0 {
		//return consoleConfig, errors.New("AUTH_ENDPOINT_TYPE not found")
		//Until front-end support is implemented, default to "remote" if AUTH_ENDPOINT_TYPE is not set
		consoleConfig.AuthEndpointType = string(interfaces.Remote)
	}

	val, endpointTypeSupported := interfaces.AuthEndpointTypes[consoleConfig.AuthEndpointType]
	if endpointTypeSupported {
		if val == interfaces.Local {
			//Auth endpoint type is set to "local", so load the local user config
			err := initialiseLocalUsersConfiguration(consoleConfig, p)
			if err != nil {
				return consoleConfig, err
			}
		} else if val == interfaces.Remote {
			// Auth endpoint type is set to "remote", so need to load local user config vars
			// Nothing to do
		} else {
			//Auth endpoint type has been set to an invalid value
			return consoleConfig, errors.New("AUTH_ENDPOINT_TYPE must be set to either \"local\" or \"remote\"")
		}
	} else {
		return consoleConfig, errors.New("AUTH_ENDPOINT_TYPE not found")
	}

	// Default authorization endpoint to be UAA endpoint
	if consoleConfig.AuthorizationEndpoint == nil {
		// No Authorization endpoint
		consoleConfig.AuthorizationEndpoint = consoleConfig.UAAEndpoint
		log.Infof("Using UAA Endpoint for Auth Endpoint: %s", consoleConfig.AuthorizationEndpoint)
	}

	return consoleConfig, nil
}

func initialiseLocalUsersConfiguration(consoleConfig *interfaces.ConsoleConfig, p *portalProxy) error {

	var err error
	localUserName, found := p.Env().Lookup("LOCAL_USER")
	if !found {
		err = errors.New("LOCAL_USER not found")
	}
	localUserPassword, found := p.Env().Lookup("LOCAL_USER_PASSWORD")
	if !found {
		err = errors.New("LOCAL_USER_PASSWORD not found")
	}
	localUserScope, found := p.Env().Lookup("LOCAL_USER_SCOPE")
	if !found {
		err = errors.New("LOCAL_USER_SCOPE not found")
	}
	if err != nil {
		return err
	}

	consoleConfig.LocalUserScope = localUserScope
	consoleConfig.LocalUser = localUserName
	consoleConfig.LocalUserPassword = localUserPassword

	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf("Unable to initialise Stratos local users config due to: %+v", err)
		return err
	}
	userGUID := uuid.NewV4().String()
	password := localUserPassword
	passwordHash, err := HashPassword(password)
	if err != nil {
		log.Errorf("Unable to initialise Stratos local user due to: %+v", err)
		return err
	}
	scope := localUserScope
	email := ""
	user := interfaces.LocalUser{UserGUID: userGUID, PasswordHash: passwordHash, Username: localUserName, Email: email, Scope: scope}
	err = localUsersRepo.AddLocalUser(user)
	if err != nil {
		log.Errorf("Unable to add Stratos local user due to: %+v", err)
	}

	return err
}

var setupComplete = false

func (p *portalProxy) SetupMiddleware() echo.MiddlewareFunc {

	return func(h echo.HandlerFunc) echo.HandlerFunc {

		if !setupComplete {
			// Check again to see if setup is complete
			// Load the config from the database again
			setupComplete = checkSetupComplete(p)
		}

		if setupComplete {
			// No-op in case the instance has been setup
			return func(c echo.Context) error {
				return h(c)
			}
		}

		// Check URL - only let setup and vesions requests through
		return func(c echo.Context) error {
			requestURLPath := c.Request().URL.Path

			isSetupRequest, _ := regexp.MatchString(setupRequestRegex, requestURLPath)
			if !isSetupRequest {
				isSetupRequest, _ = regexp.MatchString(setupUpdateRequestRegex, requestURLPath)
			}
			if isSetupRequest {
				return h(c)
			}

			isVersionRequest, _ := regexp.MatchString(versionRequestRegex, requestURLPath)
			if isVersionRequest {
				return h(c)
			}
			// Request is not a setup request, refuse backend requests and allow all others
			isBackendRequest, _ := regexp.MatchString(backendRequestRegex, requestURLPath)
			if !isBackendRequest {
				return h(c)
			}

			// Request was a backend request other than a setup or version request
			c.Response().Header().Add("Stratos-Setup-Required", "true")
			return c.NoContent(http.StatusServiceUnavailable)
		}
	}
}

func checkSetupComplete(portalProxy *portalProxy) bool {

	consoleRepo, err := console_config.NewPostgresConsoleConfigRepository(portalProxy.DatabaseConnectionPool)
	if err != nil {
		log.Warn("Failed to connect to Database!")
		return false
	}

	// This will reload the env config
	console_config.InitializeConfEnvProvider(consoleRepo)

	// Now that the config DB is an env provider, we can just use the env to fetch the setup values
	consoleConfig, err := portalProxy.initialiseConsoleConfig(portalProxy.Env())
	if err != nil {
		log.Errorf("Unable to load console config; %+v", err)
		return false
	}

	// If setup is complete, then store the config
	if consoleConfig.IsSetupComplete() {
		showStratosConfig(consoleConfig)
		portalProxy.Config.ConsoleConfig = consoleConfig
		portalProxy.Config.SSOLogin = consoleConfig.UseSSO
	}

	return consoleConfig.IsSetupComplete()
}

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
	"github.com/labstack/echo/v4"
	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/crypto"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/console_config"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces/config"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/localusers"
)

const (
	setupRequestRegex      = "^/pp/v1/setup/save$"
	setupCheckRequestRegex = "^/pp/v1/setup/check$"
	versionRequestRegex    = "^/pp/v1/version$"
	pingRequestRegex       = "^/pp/v1/ping$"
	backendRequestRegex    = "^/pp/v1/"
	apiRequestRegex        = "^/api/v1/"
	systemGroupName        = "env"
)

func parseConsoleConfigFromForm(c echo.Context) (*interfaces.ConsoleConfig, error) {
	consoleConfig := new(interfaces.ConsoleConfig)

	// Local admin user configuration?
	password := c.FormValue("local_admin_password")
	if len(password) > 0 {
		consoleConfig.LocalUserPassword = password
		consoleConfig.AuthEndpointType = "local"
		return consoleConfig, nil
	}

	url, err := url.Parse(c.FormValue("uaa_endpoint"))
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid UAA Endpoint value")
	}

	consoleConfig.UAAEndpoint = url
	// Default auth endpoint to the same value as UAA Endpoint when setup via the UI setup (for now)
	consoleConfig.AuthorizationEndpoint = url
	consoleConfig.ConsoleClient = c.FormValue("console_client")
	consoleConfig.ConsoleClientSecret = c.FormValue("console_client_secret")

	skipSSLValidation, err := strconv.ParseBool(c.FormValue("skip_ssl_validation"))
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid Skip SSL Validation value")
	}
	consoleConfig.SkipSSLValidation = skipSSLValidation

	ssoLogin, err := strconv.ParseBool(c.FormValue("use_sso"))
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid Use SSO value")
	}
	consoleConfig.UseSSO = ssoLogin
	consoleConfig.ConsoleAdminScope = c.FormValue("console_admin_scope")

	return consoleConfig, nil
}

// Check the initial parameter set and fetch the list of available scopes
// This does not persist the configuration to the database at this stage
func (p *portalProxy) setupGetAvailableScopes(c echo.Context) error {

	// Check if already set up
	if p.GetConfig().ConsoleConfig.IsSetupComplete() {
		return c.NoContent(http.StatusServiceUnavailable)
	}

	consoleConfig, err := parseConsoleConfigFromForm(c)
	if err != nil {
		return err
	}

	username := c.FormValue("username")
	password := c.FormValue("password")

	// Authenticate with UAA
	authEndpoint := fmt.Sprintf("%s/oauth/token", consoleConfig.UAAEndpoint)
	uaaRes, err := p.getUAATokenWithCreds(consoleConfig.SkipSSLValidation, username, password, consoleConfig.ConsoleClient, consoleConfig.ConsoleClientSecret, authEndpoint)
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

	c.JSON(http.StatusOK, userTokenInfo)
	return nil
}

func saveConsoleConfig(consoleRepo console_config.Repository, consoleConfig *interfaces.ConsoleConfig) error {
	if interfaces.AuthEndpointTypes[consoleConfig.AuthEndpointType] == interfaces.Local {
		return saveLocalUserConsoleConfig(consoleRepo, consoleConfig)
	}

	return saveUAAConsoleConfig(consoleRepo, consoleConfig)
}

func saveLocalUserConsoleConfig(consoleRepo console_config.Repository, consoleConfig *interfaces.ConsoleConfig) error {

	log.Debug("saveLocalUserConsoleConfig")

	if err := consoleRepo.SetValue(systemGroupName, "AUTH_ENDPOINT_TYPE", "local"); err != nil {
		return err
	}

	if err := consoleRepo.SetValue(systemGroupName, "CONSOLE_ADMIN_SCOPE", "stratos.admin"); err != nil {
		return err
	}

	if err := consoleRepo.SetValue(systemGroupName, "LOCAL_USER", "admin"); err != nil {
		return err
	}

	if err := consoleRepo.SetValue(systemGroupName, "LOCAL_USER_SCOPE", "stratos.admin"); err != nil {
		return err
	}

	// Do not save the raw password - we will create the account during setup, so we don't need it beyond that
	// We need to store a value so that console believes everything is setup - but we have created the account
	// already, so we don't need to save the actual password
	if err := consoleRepo.SetValue(systemGroupName, "LOCAL_USER_PASSWORD", "--"); err != nil {
		return err
	}

	return nil
}

func saveUAAConsoleConfig(consoleRepo console_config.Repository, consoleConfig *interfaces.ConsoleConfig) error {
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

	if err := consoleRepo.SetValue(systemGroupName, "CONSOLE_ADMIN_SCOPE", consoleConfig.ConsoleAdminScope); err != nil {
		return err
	}

	return nil
}

// Save the console setup data to the database
func (p *portalProxy) setupSaveConfig(c echo.Context) error {

	log.Debug("setupSaveConfig")

	consoleRepo, err := console_config.NewPostgresConsoleConfigRepository(p.DatabaseConnectionPool)
	if err != nil {
		return echo.NewHTTPError(http.StatusForbidden, "Failed to connect to Database!")
	}

	// Check if already set up
	if p.GetConfig().ConsoleConfig.IsSetupComplete() {
		return c.NoContent(http.StatusServiceUnavailable)
	}

	consoleConfig, err := parseConsoleConfigFromForm(c)
	if err != nil {
		return err
	}

	err = saveConsoleConfig(consoleRepo, consoleConfig)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Failed to store Console configuration data",
			"Console configuration data storage failed due to %s", err)
	}

	// If setting up with a local admin user, then log the user in
	if interfaces.AuthEndpointTypes[consoleConfig.AuthEndpointType] == interfaces.Local {
		consoleConfig.LocalUser = "admin"
		if consoleConfig.IsSetupComplete() {
			p.GetConfig().ConsoleConfig.AuthEndpointType = "local"
			p.InitStratosAuthService(interfaces.Local)
			c.Request().Form.Add("username", "admin")
			c.Request().Form.Add("password", consoleConfig.LocalUserPassword)
			c.Request().RequestURI = "/pp/v1/login"
			setupInitialiseLocalUsersConfiguration(consoleConfig, p)
			return p.consoleLogin(c)
		}
	}

	c.NoContent(http.StatusOK)
	return nil
}

func (p *portalProxy) initialiseConsoleConfig(envLookup *env.VarSet) (*interfaces.ConsoleConfig, error) {
	log.Debug("initialiseConsoleConfig")

	consoleConfig := &interfaces.ConsoleConfig{}
	if err := config.Load(consoleConfig, envLookup.Lookup); err != nil {
		return consoleConfig, fmt.Errorf("Unable to load Console configuration. %v", err)
	}

	if consoleConfig.AuthEndpointType == "" {
		//return consoleConfig, errors.New("AUTH_ENDPOINT_TYPE not found")
		//Until front-end support is implemented, default to "remote" if AUTH_ENDPOINT_TYPE is not set
		consoleConfig.AuthEndpointType = string(interfaces.Remote)
	}

	val, endpointTypeSupported := interfaces.AuthEndpointTypes[consoleConfig.AuthEndpointType]
	if endpointTypeSupported {
		if val == interfaces.AuthNone {
			return consoleConfig, nil
		} else if val == interfaces.Local {
			//Auth endpoint type is set to "local", so load the local user config
			err := initialiseLocalUsersConfiguration(consoleConfig, p)
			if err != nil {
				return consoleConfig, err
			}
		} else if val == interfaces.Remote {
			// Auth endpoint type is set to "remote", so need to load local user config vars
			// Default authorization endpoint to be UAA endpoint
			if consoleConfig.AuthorizationEndpoint == nil {
				// No Authorization endpoint
				consoleConfig.AuthorizationEndpoint = consoleConfig.UAAEndpoint
				log.Debugf("Using UAA Endpoint for Auth Endpoint: %s", consoleConfig.AuthorizationEndpoint)
			}
		} else {
			//Auth endpoint type has been set to an invalid value
			return consoleConfig, errors.New("AUTH_ENDPOINT_TYPE must be set to either \"local\" or \"remote\"")
		}
	} else {
		return consoleConfig, errors.New("AUTH_ENDPOINT_TYPE not found")
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

	return setupInitialiseLocalUsersConfiguration(consoleConfig, p)
}

func setupInitialiseLocalUsersConfiguration(consoleConfig *interfaces.ConsoleConfig, p *portalProxy) error {

	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf("Unable to initialise Stratos local users config due to: %+v", err)
		return err
	}

	userGUID := uuid.NewV4().String()
	password := consoleConfig.LocalUserPassword
	passwordHash, err := crypto.HashPassword(password)
	if err != nil {
		log.Errorf("Unable to initialise Stratos local user due to: %+v", err)
		return err
	}
	scope := consoleConfig.LocalUserScope
	email := ""
	user := interfaces.LocalUser{UserGUID: userGUID, PasswordHash: passwordHash, Username: consoleConfig.LocalUser, Email: email, Scope: scope, GivenName: "Admin", FamilyName: "User"}

	// Don't add the user if they already exist
	_, err = localUsersRepo.FindUserGUID(consoleConfig.LocalUser)
	if err == nil {
		// Can't modify the user once created else we loose any updates that might have neen made
		return nil
	}

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
				isSetupRequest, _ = regexp.MatchString(setupCheckRequestRegex, requestURLPath)
			}
			if isSetupRequest {
				return h(c)
			}

			isVersionRequest, _ := regexp.MatchString(versionRequestRegex, requestURLPath)
			if isVersionRequest {
				return h(c)
			}

			isPingRequest, _ := regexp.MatchString(pingRequestRegex, requestURLPath)
			if isPingRequest {
				return h(c)
			}

			// Request is not a setup request, refuse backend requests and allow all others
			isBackendRequest, _ := regexp.MatchString(backendRequestRegex, requestURLPath)
			isAPIRequest, _ := regexp.MatchString(apiRequestRegex, requestURLPath)
			if !(isBackendRequest || isAPIRequest) {
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
		showStratosConfig(portalProxy, consoleConfig)
		portalProxy.Config.ConsoleConfig = consoleConfig
		portalProxy.Config.SSOLogin = consoleConfig.UseSSO
		portalProxy.Config.AuthEndpointType = consoleConfig.AuthEndpointType
		portalProxy.InitStratosAuthService(interfaces.AuthEndpointTypes[consoleConfig.AuthEndpointType])
	}

	return consoleConfig.IsSetupComplete()
}

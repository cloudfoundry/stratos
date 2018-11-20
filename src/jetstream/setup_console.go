package main

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/config"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/console_config"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

type setupMiddleware struct {
	addSetup    bool
	consoleRepo console_config.Repository
	wg          sync.WaitGroup
}

func (p *portalProxy) setupConsole(c echo.Context) error {

	consoleRepo, err := console_config.NewPostgresConsoleConfigRepository(p.DatabaseConnectionPool)
	if err != nil {
		return echo.NewHTTPError(http.StatusForbidden, "Failed to connect to Database!")
	}
	initialised, _ := consoleRepo.IsInitialised()
	if initialised {
		return echo.NewHTTPError(http.StatusForbidden, "Console already setup!")
	}

	consoleConfig := new(interfaces.ConsoleConfig)
	url, err := url.Parse(c.FormValue("uaa_endpoint"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid UAA Endpoint value")
	}
	consoleConfig.UAAEndpoint = url
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
		return fmt.Errorf("Unable to intialise console backend config due to: %+v", err)
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
						"Could not connect to the UAA - Certificate error - check Skip SSL validation setting: %v+", err)
				}
				return interfaces.NewHTTPShadowError(
					http.StatusBadRequest,
					"Could not connect to the UAA - check UAA Endpoint URL",
					"Could not connect to the UAA - check UAA Endpoint URL: %v+", err)
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

	// Check if partial data already exists
	err = consoleRepo.SaveConsoleConfig(consoleConfig)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Failed to store Console configuration data",
			"Console configuration data storage failed due to %s", err)
	}

	setSSOFromConfig(p, consoleConfig)

	c.JSON(http.StatusOK, userTokenInfo)
	return nil
}

func (p *portalProxy) setupConsoleUpdate(c echo.Context) error {

	consoleRepo, err := console_config.NewPostgresConsoleConfigRepository(p.DatabaseConnectionPool)
	if err != nil {
		return echo.NewHTTPError(http.StatusForbidden, "Failed to connect to Database!")
	}
	initialised, _ := consoleRepo.IsInitialised()
	if initialised {
		return echo.NewHTTPError(http.StatusForbidden, "Console already setup!")
	}

	consoleConfig := new(interfaces.ConsoleConfig)
	consoleConfig.ConsoleAdminScope = c.FormValue("console_admin_scope")

	if err != nil {
		return fmt.Errorf("Unable to intialise console backend config due to: %+v", err)
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Failed to store Console configuration data",
			"Failed to establish DB connection due to %s", err)
	}

	err = consoleRepo.UpdateConsoleConfig(consoleConfig)
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

func (p *portalProxy) initialiseConsoleConfig(consoleRepo console_config.Repository) (*interfaces.ConsoleConfig, error) {
	log.Debug("initialiseConsoleConfig")

	consoleConfig := new(interfaces.ConsoleConfig)
	uaaEndpoint, err := config.GetValue("UAA_ENDPOINT")
	if err != nil {
		return consoleConfig, errors.New("UAA_Endpoint not found")
	}

	consoleClient, err := config.GetValue("CONSOLE_CLIENT")
	if err != nil {
		return consoleConfig, errors.New("CONSOLE_CLIENT not found")
	}

	consoleClientSecret, err := config.GetValue("CONSOLE_CLIENT_SECRET")
	if err != nil {
		// Special case, mostly this is blank, so assume its blank
		consoleClientSecret = ""
	}

	consoleAdminScope, err := config.GetValue("CONSOLE_ADMIN_SCOPE")
	if err != nil {
		return consoleConfig, errors.New("CONSOLE_ADMIN_SCOPE not found")
	}

	skipSslValidation, err := config.GetValue("SKIP_SSL_VALIDATION")
	if err != nil {
		return consoleConfig, errors.New("SKIP_SSL_VALIDATION not found")
	}

	if consoleConfig.UAAEndpoint, err = url.Parse(uaaEndpoint); err != nil {
		return consoleConfig, fmt.Errorf("Unable to parse UAA Endpoint: %v", err)
	}

	consoleConfig.ConsoleAdminScope = consoleAdminScope
	consoleConfig.ConsoleClient = consoleClient
	consoleConfig.ConsoleClientSecret = consoleClientSecret
	consoleConfig.SkipSSLValidation, err = strconv.ParseBool(skipSslValidation)
	if err != nil {
		return consoleConfig, fmt.Errorf("Invalid value for Skip SSL Validation property %v", err)
	}

	err = p.SaveConsoleConfig(consoleConfig, consoleRepo)
	if err != nil {
		return consoleConfig, fmt.Errorf("Failed to save config due to:  %v", err)
	}
	return consoleConfig, nil
}

func (p *portalProxy) SaveConsoleConfig(consoleConfig *interfaces.ConsoleConfig, consoleRepoInterface interface{}) error {

	var consoleRepo console_config.Repository
	if consoleRepoInterface == nil {
		newConsoleRepo, err := console_config.NewPostgresConsoleConfigRepository(p.DatabaseConnectionPool)
		if err != nil {
			return fmt.Errorf("Unable to intialise console backend config due to: %+v", err)
		}
		consoleRepo = newConsoleRepo
	} else {
		consoleRepo = consoleRepoInterface.(console_config.Repository)
	}

	err := consoleRepo.SaveConsoleConfig(consoleConfig)
	if err != nil {
		log.Printf("Failed to store Console Config: %+v", err)
		return fmt.Errorf("Failed to store Console Config: %+v", err)
	}
	// Store
	err = consoleRepo.UpdateConsoleConfig(consoleConfig)
	if err != nil {
		log.Printf("Failed to store Console Config: %+v", err)
		return fmt.Errorf("Failed to store Console Config: %+v", err)
	}

	log.Info("Stratos setup has been stored")
	return nil
}

func (p *portalProxy) SetupPoller(setupMiddleware *setupMiddleware) {
	isInitialised, err := setupMiddleware.consoleRepo.IsInitialised()
	for err != nil || !isInitialised {
		time.Sleep(500 * time.Millisecond)
		isInitialised, err = setupMiddleware.consoleRepo.IsInitialised()
	}
	p.Config.ConsoleConfig, _ = setupMiddleware.consoleRepo.GetConsoleConfig()
	setupMiddleware.wg.Add(1)
	setupMiddleware.addSetup = false
	setupMiddleware.wg.Done()
}

func (p *portalProxy) SetupMiddleware(setupMiddleware *setupMiddleware) echo.MiddlewareFunc {

	return func(h echo.HandlerFunc) echo.HandlerFunc {

		setupMiddleware.wg.Wait()
		if !setupMiddleware.addSetup {
			// No-op in case the instance has been setup
			return func(c echo.Context) error {
				return h(c)
			}
		}
		return func(c echo.Context) error {
			isSetupRequest := false

			requestURLPath := c.Request().URL.Path

			// When running in Cloud Foundry or in the combined Docker container URL path starts with /pp
			inCFMode, _ := regexp.MatchString("^/pp", requestURLPath)

			setupRequestRegex := "/v1/setup$"
			setupUpdateRequestRegex := "/v1/setup/update$"
			versionRequestRegex := "/v1/version$"
			backendRequestRegex := "/v1/"

			if inCFMode {
				setupRequestRegex = fmt.Sprintf("^/pp%s", setupRequestRegex)
				setupUpdateRequestRegex = fmt.Sprintf("^/pp%s", setupUpdateRequestRegex)
				versionRequestRegex = fmt.Sprintf("^/pp%s", versionRequestRegex)
				backendRequestRegex = fmt.Sprintf("^/pp%s", backendRequestRegex)
			}

			isSetupRequest, _ = regexp.MatchString(setupRequestRegex, requestURLPath)
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
			// Request was a backend request other than a setup request.
			c.Response().Header().Add("Stratos-Setup-Required", "true")
			return c.NoContent(http.StatusServiceUnavailable)
		}
	}
}

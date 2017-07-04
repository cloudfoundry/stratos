package main

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"sync"
	"time"

	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"

	"github.com/SUSE/stratos-ui/components/app-core/backend/config"
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/console_config"
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
)

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
	consoleConfig.ConsoleAdminRole = c.FormValue("console_admin_role")
	consoleConfig.ConsoleClient = c.FormValue("console_client")
	consoleConfig.ConsoleClientSecret = c.FormValue("console_client_secret")
	skipSSLValidation, err := strconv.ParseBool(c.FormValue("skip_ssl_validation"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid Skip SSL Validation value")
	}
	consoleConfig.SkipSSLValidation = skipSSLValidation

	if err != nil {
		return fmt.Errorf("Unable to intialise console backend config due to: %+v", err)
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Failed to store Console configuration data",
			"Failed to establish DB connection due to %s", err)
	}

	err = consoleRepo.SaveConsoleConfig(consoleConfig)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Failed to store Console configuration data",
			"Console configuration data storage failed due to %s", err)
	}
	c.NoContent(http.StatusOK)
	log.Infof("Console has been setup with the following settings: %+v", consoleConfig)
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
		return consoleConfig, errors.New("CONSOLE_CLIENT_SECRET not found")
	}

	consoleAdminRole, err := config.GetValue("CONSOLE_ADMIN_ROLE")
	if err != nil {
		return consoleConfig, errors.New("CONSOLE_ADMIN_ROLE not found")
	}

	skipSslValidation, err := config.GetValue("SKIP_SSL_VALIDATION")
	if err != nil {
		return consoleConfig, errors.New("SKIP_SSL_VALIDATION not found")
	}

	if consoleConfig.UAAEndpoint, err = url.Parse(uaaEndpoint); err != nil {
		return consoleConfig, fmt.Errorf("Unable to parse UAA Endpoint: %v", err)
	}

	consoleConfig.ConsoleAdminRole = consoleAdminRole
	consoleConfig.ConsoleClient = consoleClient
	consoleConfig.ConsoleClientSecret = consoleClientSecret
	consoleConfig.SkipSSLValidation, err = strconv.ParseBool(skipSslValidation)
	if err != nil {
		return consoleConfig, fmt.Errorf("Invalid value for Skip SSL Validation property %v", err)
	}

	log.Infof("Console has been setup with the following settings: %+v", consoleConfig)
	err = consoleRepo.SaveConsoleConfig(consoleConfig)
	if err != nil {
		log.Printf("Failed to store Console Config: %+v", err)
		return consoleConfig, fmt.Errorf("Failed to store Console Config: %+v", err)
	}
	return consoleConfig, nil
}
func (p *portalProxy) SetupMiddleware(setupMiddleware *setupMiddleware) echo.MiddlewareFunc {

	var wg sync.WaitGroup
	// Continuously check if console_config has been initialised
	configured := false
	go func() {
		isInitialised, err := setupMiddleware.consoleRepo.IsInitialised()
		for err != nil || !isInitialised {
			time.Sleep(10 * time.Second)
			isInitialised, err = setupMiddleware.consoleRepo.IsInitialised()
		}
		p.Config.ConsoleConfig, _ = setupMiddleware.consoleRepo.GetConsoleConfig()
		wg.Add(1)
		configured = true
		wg.Done()
	}()

	return func(h echo.HandlerFunc) echo.HandlerFunc {

		wg.Wait()
		log.Printf("Is Initialised: %+v", configured)
		if configured {
			// Noop in case its configured
			log.Printf("Already configured path!")
			return func(c echo.Context) error {
				return h(c)
			}
		}
		return func(c echo.Context) error {

			log.Printf("URI: %+v" + c.Request().URL().Path())
			if c.Request().URL().Path() == "/v1/setup" {
				return h(c)
			}
			return interfaces.NewHTTPShadowError(
				http.StatusInternalServerError,
				"Console is not setup",
				"Console is not setup",
			)
		}
	}
}

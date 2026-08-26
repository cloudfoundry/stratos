package cloudfoundryhosting

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	"github.com/govau/cf-common/env"
	"github.com/labstack/echo/v5"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// Constants
const (
	VCapApplication                = "VCAP_APPLICATION"
	CFApiURLOverride               = "CF_API_URL"
	CFApiForceSecure               = "CF_API_FORCE_SECURE"
	cfSessionCookieName            = "JSESSIONID"
	ForceEnablePersistenceFeatures = "FORCE_ENABLE_PERSISTENCE_FEATURES"
	SkipAutoRegister               = "SKIP_AUTO_REGISTER"
	SQLiteProviderName             = "sqlite"
	defaultSessionSecret           = "wheeee!"
)

// Module init will register plugin
func init() {
	api.AddPlugin("cloudfoundryhosting", nil, Init)
}

// CFHosting is a plugin to configure Stratos when hosted in Cloud Foundry
type CFHosting struct {
	portalProxy api.PortalProxy
}

// Package initialization
func init() {
	api.RegisterJetstreamConfigPlugin(ConfigInit)
}

// ConfigInit updates the config if needed
func ConfigInit(envLookup *env.VarSet, jetstreamConfig *api.PortalConfig) {

	// Check we are deployed in Cloud Foundry
	if !envLookup.IsSet(VCapApplication) {
		return
	}
	isSQLite := jetstreamConfig.DatabaseProviderName == SQLiteProviderName
	// If session secret is default, make sure we change it
	if jetstreamConfig.SessionStoreSecret == defaultSessionSecret {
		if isSQLite {
			// If SQLIte - create a random value to use, since each app instance has its own DB
			// and sessions should not be accessible across different instances
			jetstreamConfig.SessionStoreSecret = uuid.New().String()
		}
		// If not SQLite then we are using a shared DB
		// Just drop through and we'll later use a random value and log a warning
		// This means each instance has a different session secret - this is not a problem
		// due to session affinity - it means if the instance a user is bound to goes away, their session
		// will also be lost and they will need to log in again
	} else {
		// Else, if not default and is SQLlite - add the App Index to the secret
		// This makes sure we use a different Session Secret per App Instance IF using SQLite
		// Since this is not a shared database across application instances
		if isSQLite && envLookup.IsSet("CF_INSTANCE_INDEX") {
			appInstanceIndex, ok := envLookup.Lookup("CF_INSTANCE_INDEX")
			if ok {
				jetstreamConfig.SessionStoreSecret = jetstreamConfig.SessionStoreSecret + "_" + appInstanceIndex
				slog.Info("Updated the session secret for this Cloud Foundry app instance", "instanceIndex", appInstanceIndex)
			}
		}
	}

	// Update Database migration status depending on app instance index and SQLite
	if !isSQLite && envLookup.IsSet("CF_INSTANCE_INDEX") {
		if appInstanceIndex, ok := envLookup.Lookup("CF_INSTANCE_INDEX"); ok {
			if index, err := strconv.Atoi(appInstanceIndex); err == nil {
				jetstreamConfig.CanMigrateDatabaseSchema = (index == 0)
				slog.Info("Skipping the DB migration: not instance index 0", "instanceIndex", index)
			}
		}
	}
}

// Init creates a new CFHosting plugin
func Init(portalProxy api.PortalProxy) (api.StratosPlugin, error) {

	return &CFHosting{portalProxy: portalProxy}, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (ch *CFHosting) GetMiddlewarePlugin() (api.MiddlewarePlugin, error) {
	if ch.portalProxy.Env().IsSet(VCapApplication) {
		return ch, nil
	}
	return nil, errors.New("Not running as a Cloud Foundry application")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (ch *CFHosting) GetEndpointPlugin() (api.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetRoutePlugin gets the route plugin for this plugin
func (ch *CFHosting) GetRoutePlugin() (api.RoutePlugin, error) {
	return nil, errors.New("Not implemented")
}

// Init performs plugin initialization
func (ch *CFHosting) Init() error {

	// Determine if we are running CF by presence of env var "VCAP_APPLICATION" and configure appropriately
	if ch.portalProxy.Env().IsSet(VCapApplication) {
		slog.Info("Detected that Console is deployed as a Cloud Foundry Application")

		// Record that we are deployed in Cloud Foundry
		ch.portalProxy.GetConfig().IsCloudFoundry = true

		ch.portalProxy.GetConfig().ConsoleConfig = new(api.ConsoleConfig)

		// We are using the CF UAA - so the Console must use the same Client and Secret as CF
		ch.portalProxy.GetConfig().ConsoleConfig.ConsoleClient = ch.portalProxy.GetConfig().CFClient
		ch.portalProxy.GetConfig().ConsoleConfig.ConsoleClientSecret = ch.portalProxy.GetConfig().CFClientSecret

		//Set the auth endpoint type for the console
		ch.portalProxy.GetConfig().ConsoleConfig.AuthEndpointType = ch.portalProxy.GetConfig().AuthEndpointType

		// Ensure that the identifier for an admin is the standard Cloud Foundry one
		ch.portalProxy.GetConfig().ConsoleConfig.ConsoleAdminScope = ch.portalProxy.GetConfig().CFAdminIdentifier

		// Allow Console Application manifest to override the Admin Scope if really desired
		stratosAdminScope, ok := ch.portalProxy.Env().Lookup("STRATOS_ADMIN_SCOPE")
		if ok {
			ch.portalProxy.GetConfig().ConsoleConfig.ConsoleAdminScope = stratosAdminScope
			slog.Info("Overrode the Console admin scope", "scope", stratosAdminScope)
		}

		// Need to run as HTTP on the port we were told to use
		ch.portalProxy.GetConfig().HTTPS = false

		port, ok := ch.portalProxy.Env().Lookup("PORT")
		if ok {
			ch.portalProxy.GetConfig().TLSAddress = ":" + port
			slog.Info("Updated the Console address", "address", ch.portalProxy.GetConfig().TLSAddress)
		}

		// Get the cf_api value from the JSON
		var appData api.VCapApplicationData
		vCapApp, _ := ch.portalProxy.Env().Lookup(VCapApplication)
		data := []byte(vCapApp)
		err := json.Unmarshal(data, &appData)
		if err != nil {
			slog.Error("could not get the Cloud Foundry API URL", "error", err)
			os.Exit(1)
		}

		slog.Info("CF API URL", "url", appData.API)

		// Allow the URL to be overridden by an application environment variable
		if ch.portalProxy.Env().IsSet(CFApiURLOverride) {
			apiUrl, _ := ch.portalProxy.Env().Lookup(CFApiURLOverride)
			appData.API = apiUrl
			slog.Info("Overrode the CF API URL from an environment variable", "url", apiUrl)
		}

		if ch.portalProxy.Env().IsSet(CFApiForceSecure) {
			// Force the API URL protocol to be https
			appData.API = strings.Replace(appData.API, "http://", "https://", 1)
			slog.Info("Ensuring the CF API URL is accessed over HTTPS")
		} else {
			slog.Info("No forced override to HTTPS")
		}

		// Ephemeral Database indicates if we are running with a DB like SQLite, which is Ephemeral
		// Only need to do this if the Database we are using is SQLite
		isSQLite := ch.portalProxy.GetConfig().DatabaseProviderName == SQLiteProviderName
		disablePersistenceFeatures := isSQLite
		if ch.portalProxy.Env().IsSet(ForceEnablePersistenceFeatures) {
			// Force the Endpoint Dashboard to be visible?
			disablePersistenceFeatures = !ch.portalProxy.Env().MustBool(ForceEnablePersistenceFeatures)
			if disablePersistenceFeatures {
				slog.Info("Features requiring persistence have been DISABLED")
			} else {
				slog.Info("Features requiring persistence have been ENABLED")
			}
		}
		ch.portalProxy.GetConfig().PluginConfig["disablePersistenceFeatures"] = strconv.FormatBool(disablePersistenceFeatures)
		slog.Info("Features requiring persistence", "enabled", !disablePersistenceFeatures)

		slog.Info("Using the Cloud Foundry API URL", "url", appData.API)
		cfEndpointSpec, _ := ch.portalProxy.GetEndpointTypeSpec("cf")
		newCNSI, _, err := cfEndpointSpec.Info(appData.API, true, "")
		if err != nil {
			slog.Error("could not get the info for Cloud Foundry", "url", appData.API, "error", err)
			os.Exit(1)
		}

		// Override the configuration to set the authorization endpoint
		url, err := url.Parse(newCNSI.AuthorizationEndpoint)
		if err != nil {
			return fmt.Errorf("Invalid authorization endpoint URL %s %s", newCNSI.AuthorizationEndpoint, err)
		}

		ch.portalProxy.GetConfig().ConsoleConfig.AuthorizationEndpoint = url

		// Override the configuration to set the authorization endpoint
		url, err = url.Parse(newCNSI.TokenEndpoint)
		if err != nil {
			return fmt.Errorf("Invalid token endpoint URL %s %s", newCNSI.TokenEndpoint, err)
		}

		ch.portalProxy.GetConfig().ConsoleConfig.UAAEndpoint = url

		slog.Info("Cloud Foundry UAA", "endpoint", ch.portalProxy.GetConfig().ConsoleConfig.UAAEndpoint)

		// Not set in the environment and failed to read from the Secrets file
		// CHECK is this necessary to set here?
		ch.portalProxy.GetConfig().ConsoleConfig.SkipSSLValidation = ch.portalProxy.Env().MustBool("SKIP_SSL_VALIDATION")

		if !ch.portalProxy.Env().IsSet(SkipAutoRegister) {
			slog.Info("Setting the AUTO_REG_CF_URL config", "url", appData.API)
			ch.portalProxy.GetConfig().AutoRegisterCFUrl = appData.API
		} else {
			slog.Info("Skipping auto-register of the CF endpoint", "because", SkipAutoRegister+" is set")
		}

		// Store the space and id of the Console application - we can use these to prevent stop/delete in the front-end
		if ch.portalProxy.GetConfig().CloudFoundryInfo == nil {
			ch.portalProxy.GetConfig().CloudFoundryInfo = &api.CFInfo{}
		}
		ch.portalProxy.GetConfig().CloudFoundryInfo.SpaceGUID = appData.SpaceID
		ch.portalProxy.GetConfig().CloudFoundryInfo.AppGUID = appData.ApplicationID

		slog.Info("All done for Cloud Foundry deployment")
	}
	return nil
}

// EchoMiddleware is the Echo server middleware provided by this plugin
func (ch *CFHosting) EchoMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c *echo.Context) error {

		// If request is a WebSocket request, don't do anything special
		upgrade := c.Request().Header.Get("Upgrade")
		webSocketKey := c.Request().Header.Get("Sec-Websocket-Key")

		if len(upgrade) > 0 && len(webSocketKey) > 0 {
			slog.Info("Not redirecting this request")
			return h(c)
		}

		// Check that we are on HTTPS - redirect if not
		proto := c.Request().Header.Get("X-Forwarded-Proto")
		if len(proto) > 0 {
			if proto != "https" {
				redirect := fmt.Sprintf("https://%s%s", c.Request().Host, c.Request().RequestURI)
				return c.Redirect(301, redirect)
			}
			return h(c)
		}

		return api.NewHTTPShadowError(
			http.StatusBadRequest,
			"X-Forwarded-Proto not found and is required",
			"X-Forwarded-Proto not found and is required",
		)
	}
}

// SessionEchoMiddleware is the Echo server session middleware provided by this plugin
// For cloud foundry session affinity
// Ensure we add a cookie named "JSESSIONID" for Cloud Foundry session affinity
func (ch *CFHosting) SessionEchoMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c *echo.Context) error {
		// Make sure there is a JSESSIONID cookie set to the session ID
		session, err := ch.portalProxy.GetSession(c)
		if err == nil {
			// We have a session
			guid, err := ch.portalProxy.GetSessionValue(c, cfSessionCookieName)
			if err != nil || guid == nil {
				guid = uuid.New().String()
				session.Values[cfSessionCookieName] = guid
				if err := ch.portalProxy.SaveSession(c, session); err != nil {
					slog.Warn("unable to save the session for Cloud Foundry session affinity", "error", err)
				}
			}
			sessionGUID := fmt.Sprintf("%s", guid)
			// Set the JSESSIONID coolie for Cloud Foundry session affinity
			w := c.Response()
			cookie := sessions.NewCookie(cfSessionCookieName, sessionGUID, session.Options)
			// CF hosting always terminates TLS (X-Forwarded-Proto is enforced above)
			cookie.Secure = true
			http.SetCookie(w, cookie)
		}
		return h(c)
	}
}

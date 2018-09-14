package cloudfoundryhosting

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// Constants
const (
	VCapApplication        = "VCAP_APPLICATION"
	CFApiURLOverride       = "CF_API_URL"
	CFApiForceSecure       = "CF_API_FORCE_SECURE"
	cfSessionCookieName    = "JSESSIONID"
	ForceEndpointDashboard = "FORCE_ENDPOINT_DASHBOARD"
	SkipAutoRegister       = "SKIP_AUTO_REGISTER"
)

// CFHosting is a plugin to configure Stratos when hosted in Cloud Foundry
type CFHosting struct {
	portalProxy  interfaces.PortalProxy
	endpointType string
}

// Init creates a new CFHosting plugin
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &CFHosting{portalProxy: portalProxy}, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (ch *CFHosting) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	if ch.portalProxy.Env().IsSet(VCapApplication) {
		return ch, nil
	}
	return nil, errors.New("Not running as a Cloud Foundry application")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (ch *CFHosting) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetRoutePlugin gets the route plugin for this plugin
func (ch *CFHosting) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return nil, errors.New("Not implemented")
}

// Init performs plugin initialization
func (ch *CFHosting) Init() error {
	// Determine if we are running CF by presence of env var "VCAP_APPLICATION" and configure appropriately
	if ch.portalProxy.Env().IsSet(VCapApplication) {
		log.Info("Detected that Console is deployed as a Cloud Foundry Application")

		// Record that we are deployed in Cloud Foundry
		ch.portalProxy.GetConfig().IsCloudFoundry = true

		ch.portalProxy.GetConfig().ConsoleConfig = new(interfaces.ConsoleConfig)
		// We are using the CF UAA - so the Console must use the same Client and Secret as CF
		ch.portalProxy.GetConfig().ConsoleConfig.ConsoleClient = ch.portalProxy.GetConfig().CFClient
		ch.portalProxy.GetConfig().ConsoleConfig.ConsoleClientSecret = ch.portalProxy.GetConfig().CFClientSecret

		// Ensure that the identifier for an admin is the standard Cloud Foundry one
		ch.portalProxy.GetConfig().ConsoleConfig.ConsoleAdminScope = ch.portalProxy.GetConfig().CFAdminIdentifier

		// Allow Console Application manifest to override the Admin Scope if really desired
		stratosAdminScope, ok := ch.portalProxy.Env().Lookup("STRATOS_ADMIN_SCOPE")
		if ok {
			ch.portalProxy.GetConfig().ConsoleConfig.ConsoleAdminScope = stratosAdminScope
			log.Infof("Overriden Console Admin Scope to: %s", stratosAdminScope)
		}

		// Need to run as HTTP on the port we were told to use
		ch.portalProxy.GetConfig().HTTPS = false

		port, ok := ch.portalProxy.Env().Lookup("PORT")
		if ok {
			ch.portalProxy.GetConfig().TLSAddress = ":" + port
			log.Infof("Updated Console address to: %s", ch.portalProxy.GetConfig().TLSAddress)
		}

		// Get the cf_api value from the JSON
		var appData interfaces.VCapApplicationData
		vCapApp, _ := ch.portalProxy.Env().Lookup(VCapApplication)
		data := []byte(vCapApp)
		err := json.Unmarshal(data, &appData)
		if err != nil {
			log.Fatal("Could not get the Cloud Foundry API URL", err)
			return nil
		}

		log.Infof("CF API URL: %s", appData.API)

		// Allow the URL to be overridden by an application environment variable
		if ch.portalProxy.Env().IsSet(CFApiURLOverride) {
			apiUrl, _ := ch.portalProxy.Env().Lookup(CFApiURLOverride)
			appData.API = apiUrl
			log.Infof("Overriden CF API URL from environment variable %s", apiUrl)
		}

		if ch.portalProxy.Env().IsSet(CFApiForceSecure) {
			// Force the API URL protocol to be https
			appData.API = strings.Replace(appData.API, "http://", "https://", 1)
			log.Infof("Ensuring that CF API URL is accessed over HTTPS")
		} else {
			log.Info("No forced override to HTTPS")
		}

		disableEndpointDashboard := true
		if ch.portalProxy.Env().IsSet(ForceEndpointDashboard) {
			// Force the Endpoint Dashboard to be visible?
			disableEndpointDashboard = !ch.portalProxy.Env().MustBool(ForceEndpointDashboard)
		}

		if disableEndpointDashboard {
			log.Info("Endpoint Dashboard has been DISABLED")
		} else {
			log.Info("Endpoint Dashboard has been ENABLED")
		}
		ch.portalProxy.GetConfig().PluginConfig["endpointsDashboardDisabled"] = strconv.FormatBool(disableEndpointDashboard)

		log.Infof("Using Cloud Foundry API URL: %s", appData.API)
		cfEndpointSpec, _ := ch.portalProxy.GetEndpointTypeSpec("cf")
		newCNSI, _, err := cfEndpointSpec.Info(appData.API, true)
		if err != nil {
			log.Fatal("Could not get the info for Cloud Foundry", err)
			return nil
		}

		// Override the configuration to set the authorization endpoint
		url, err := url.Parse(newCNSI.AuthorizationEndpoint)
		if err != nil {
			return fmt.Errorf("Invalid authorization endpoint URL %s %s", newCNSI.AuthorizationEndpoint, err)
		}

		ch.portalProxy.GetConfig().ConsoleConfig.UAAEndpoint = url
		log.Infof("Cloud Foundry UAA is: %s", ch.portalProxy.GetConfig().ConsoleConfig.UAAEndpoint)

		// Not set in the environment and failed to read from the Secrets file TODO is this necessary to set here?
		ch.portalProxy.GetConfig().ConsoleConfig.SkipSSLValidation = ch.portalProxy.Env().MustBool("SKIP_SSL_VALIDATION")

		// Save to Console DB
		err = ch.portalProxy.SaveConsoleConfig(ch.portalProxy.GetConfig().ConsoleConfig, nil)
		if err != nil {
			log.Fatalf("Failed to save console configuration due to %s", err)
			return fmt.Errorf("Failed to save console configuration due to %s", err)
		}

		if !ch.portalProxy.Env().IsSet(SkipAutoRegister) {
			log.Info("Setting AUTO_REG_CF_URL config to ", appData.API)
			ch.portalProxy.GetConfig().AutoRegisterCFUrl = appData.API
		} else {
			log.Info("Skipping auto-register of CF Endpoint - %s is set", SkipAutoRegister)
		}

		// Store the space and id of the ConsocfLoginHookle application - we can use these to prevent stop/delete in the front-end
		ch.portalProxy.GetConfig().CloudFoundryInfo = &interfaces.CFInfo{
			SpaceGUID: appData.SpaceID,
			AppGUID:   appData.ApplicationID,
		}

		log.Info("All done for Cloud Foundry deployment")
	}
	return nil
}

// EchoMiddleware is the Echo server middleware provided by this plugin
func (ch *CFHosting) EchoMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {

		// If request is a WebSocket request, don't do anything special
		if c.Request().Header().Contains("Upgrade") &&
			c.Request().Header().Contains("Sec-Websocket-Key") {
			log.Infof("Not redirecting this request")
			return h(c)
		}

		// Check that we are on HTTPS - redirect if not
		if c.Request().Header().Contains("X-Forwarded-Proto") {
			proto := c.Request().Header().Get("X-Forwarded-Proto")
			if proto != "https" {
				redirect := fmt.Sprintf("https://%s%s", c.Request().Host(), c.Request().URI())
				return c.Redirect(301, redirect)
			}
			return h(c)
		}

		return interfaces.NewHTTPShadowError(
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
	return func(c echo.Context) error {
		// Make sure there is a JSESSIONID cookie set to the session ID
		session, err := ch.portalProxy.GetSession(c)
		if err == nil {
			// We have a session
			guid, err := ch.portalProxy.GetSessionValue(c, cfSessionCookieName)
			if err != nil || guid == nil {
				guid = uuid.NewV4().String()
				session.Values[cfSessionCookieName] = guid
				ch.portalProxy.SaveSession(c, session)
			}
			sessionGUID := fmt.Sprintf("%s", guid)
			// Set the JSESSIONID coolie for Cloud Foundry session affinity
			w := c.Response().(*standard.Response).ResponseWriter
			cookie := sessions.NewCookie(cfSessionCookieName, sessionGUID, session.Options)
			http.SetCookie(w, cookie)
		}
		return h(c)
	}
}

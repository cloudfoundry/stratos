package cloudfoundryhosting

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	log "github.com/Sirupsen/logrus"
	"github.com/gorilla/sessions"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
	uuid "github.com/satori/go.uuid"

	"github.com/SUSE/stratos-ui/config"
	"github.com/SUSE/stratos-ui/repository/interfaces"
)

const (
	VCapApplication        = "VCAP_APPLICATION"
	CFApiURLOverride       = "CF_API_URL"
	CFApiForceSecure       = "CF_API_FORCE_SECURE"
	cfSessionCookieName    = "JSESSIONID"
	ForceEndpointDashboard = "FORCE_ENDPOINT_DASHBOARD"
)

type CFHosting struct {
	portalProxy  interfaces.PortalProxy
	endpointType string
}

func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {

	// Don't load is VCAPApplication env var is not available
	if !config.IsSet(VCapApplication) {
		return nil, nil
	}

	return &CFHosting{portalProxy: portalProxy}, nil
}

func (ch *CFHosting) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	if config.IsSet(VCapApplication) {
		return ch, nil
	}
	return nil, errors.New("Not running as a Cloud Foundry application")
}

func (ch *CFHosting) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented!")
}

func (ch *CFHosting) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return nil, errors.New("Not implemented!")
}

func (ch *CFHosting) Init() error {

	// Determine if we are running CF by presence of env var "VCAP_APPLICATION" and configure appropriately
	log.Info("Detected that Console is deployed as a Cloud Foundry Application")

	ch.portalProxy.GetConfig().ConsoleConfig = new(interfaces.ConsoleConfig)
	// We are using the CF UAA - so the Console must use the same Client and Secret as CF
	ch.portalProxy.GetConfig().ConsoleConfig.ConsoleClient = ch.portalProxy.GetConfig().CFClient
	ch.portalProxy.GetConfig().ConsoleConfig.ConsoleClientSecret = ch.portalProxy.GetConfig().CFClientSecret

	// Ensure that the identifier for an admin is the standard Cloud Foundry one
	ch.portalProxy.GetConfig().ConsoleConfig.ConsoleAdminScope = ch.portalProxy.GetConfig().CFAdminIdentifier

	// Allow Console Application manifest to override the Admin Scope if really desired
	if config.IsSet("STRATOS_ADMIN_SCOPE") {
		stratosAdminScope, err := config.GetValue("STRATOS_ADMIN_SCOPE")
		if err == nil {
			ch.portalProxy.GetConfig().ConsoleConfig.ConsoleAdminScope = stratosAdminScope
			log.Infof("Overriden Console Admin Scope to: %s", stratosAdminScope)
		}
	}

	// Need to run as HTTP on the port we were told to use
	ch.portalProxy.GetConfig().HTTPS = false

	if config.IsSet("PORT") {
		port, err := config.GetValue("PORT")
		if err != nil {
			log.Warnf("Unable to read Port")
		} else {

			ch.portalProxy.GetConfig().TLSAddress = ":" + port
			log.Infof("Updated Console address to: %s", ch.portalProxy.GetConfig().TLSAddress)
		}
	}
	// Get the cf_api value from the JSON
	var appData interfaces.VCapApplicationData
	vCapApp, _ := config.GetValue(VCapApplication)
	data := []byte(vCapApp)
	err := json.Unmarshal(data, &appData)
	if err != nil {
		log.Fatal("Could not get the Cloud Foundry API URL", err)
		return nil
	}

	log.Infof("CF API URL: %s", appData.API)

	// Allow the URL to be overridden by an application environment variable
	if config.IsSet(CFApiURLOverride) {
		apiUrl, _ := config.GetValue(CFApiURLOverride)
		appData.API = apiUrl
		log.Infof("Overriden CF API URL from environment variable %s", apiUrl)
	}

	if config.IsSet(CFApiForceSecure) {
		// Force the API URL protocol to be https
		appData.API = strings.Replace(appData.API, "http://", "https://", 1)
		log.Infof("Ensuring that CF API URL is accessed over HTTPS")
	} else {
		log.Info("No forced override to HTTPS")
	}

	disableEndpointDashboard := true
	if config.IsSet(ForceEndpointDashboard) {
		// Force the Endpoint Dashboard to be visible?
		if forceStr, err := config.GetValue(ForceEndpointDashboard); err == nil {
			if force, err := strconv.ParseBool(forceStr); err == nil {
				disableEndpointDashboard = !force
			}
		}
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

	skipSsl, err := config.GetValue("SKIP_SSL_VALIDATION")
	if err != nil {
		// Not set in the environment and failed to read from the Secrets file
		ch.portalProxy.GetConfig().ConsoleConfig.SkipSSLValidation = false
	}

	skipSslBool, err := strconv.ParseBool(skipSsl)
	if err != nil {
		// Not set in the environment and failed to read from the Secrets file
		ch.portalProxy.GetConfig().ConsoleConfig.SkipSSLValidation = false
	}

	ch.portalProxy.GetConfig().ConsoleConfig.SkipSSLValidation = skipSslBool

	// Save to Console DB
	err = ch.portalProxy.SaveConsoleConfig(ch.portalProxy.GetConfig().ConsoleConfig, nil)
	if err != nil {
		log.Fatalf("Failed to save console configuration due to %s", err)
		return fmt.Errorf("Failed to save console configuration due to %s", err)
	}

	log.Info("Setting AUTO_REG_CF_URL config to ", appData.API)
	ch.portalProxy.GetConfig().AutoRegisterCFUrl = appData.API

	// Store the space and id of the ConsocfLoginHookle application - we can use these to prevent stop/delete in the front-end
	ch.portalProxy.GetConfig().CloudFoundryInfo = &interfaces.CFInfo{
		SpaceGUID: appData.SpaceID,
		AppGUID:   appData.ApplicationID,
	}

	log.Info("All done for Cloud Foundry deployment")
	return nil
}

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

package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
	"github.com/satori/go.uuid"
	"github.com/gorilla/sessions"
	"github.com/labstack/echo/engine/standard"

	"github.com/hpcloud/portal-proxy/components/core/backend/config"
	"github.com/hpcloud/portal-proxy/components/core/backend/repository/interfaces"
)

const (
	VCapApplication        = "VCAP_APPLICATION"
	CFApiURLOverride       = "CF_API_URL"
	CFApiForceSecure       = "CF_API_FORCE_SECURE"
	cfSessionCookieName    = "JSESSIONID"
)

type CFHosting struct {
	portalProxy  interfaces.PortalProxy
	endpointType string
}

func Init(portalProxy interfaces.PortalProxy) (interfaces.GeneralPlugin, error) {
	return &CFHosting{portalProxy: portalProxy}, nil
}

func (ch CFHosting) Init() error {
	// Determine if we are running CF by presence of env var "VCAP_APPLICATION" and configure appropriately
	if config.IsSet(VCapApplication) {
		log.Info("Detected that Console is deployed as a Cloud Foundry Application")

		// We are using the CF UAA - so the Console must use the same Client and Secret as CF
		ch.portalProxy.GetConfig().ConsoleClient = ch.portalProxy.GetConfig().HCFClient
		ch.portalProxy.GetConfig().ConsoleClientSecret = ch.portalProxy.GetConfig().HCFClientSecret

		// Ensure that the identifier for an admin is the standard Cloud Foundry one
		ch.portalProxy.GetConfig().UAAAdminIdentifier = ch.portalProxy.GetConfig().CFAdminIdentifier

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
			log.Infof("Overrriden CF API URL from environment variable %s", apiUrl)
		}

		if config.IsSet(CFApiForceSecure) {
			// Force the API URL protocol to be https
			appData.API = strings.Replace(appData.API, "http://", "https://", 1)
			log.Infof("Ensuring that CF API URL is accessed over HTTPS")
		} else {
			log.Info("No forced override to HTTPS")
		}

		log.Infof("Using Cloud Foundry API URL: %s", appData.API)
		cfEndpointSpec, _ := ch.portalProxy.GetEndpointTypeSpec("cf")
		newCNSI, err := cfEndpointSpec.Info(appData.API, true)
		if err != nil {
			log.Fatal("Could not get the info for Cloud Foundry", err)
			return nil
		}

		// Override the configuration to set the authorization endpoint
		ch.portalProxy.GetConfig().UAAEndpoint = newCNSI.AuthorizationEndpoint
		log.Infof("Cloud Foundry UAA is: %s", ch.portalProxy.GetConfig().UAAEndpoint)

		// Auto-register the Cloud Foundry
		cfCnsi, regErr := ch.portalProxy.DoRegisterEndpoint("Cloud Foundry", appData.API, true, cfEndpointSpec.Info)
		if regErr != nil {
			log.Fatal("Could not auto-register the Cloud Foundry endpoint", err)
			ch.portalProxy.GetConfig().CloudFoundryInfo = &interfaces.CFInfo{
				SpaceGUID: appData.SpaceID,
				AppGUID:   appData.ApplicationID,
			}
			return nil
		}

		// Store the space and id of the ConsocfLoginHookle application - we can use these to prevent stop/delete in the front-end
		ch.portalProxy.GetConfig().CloudFoundryInfo = &interfaces.CFInfo{
			SpaceGUID: appData.SpaceID,
			AppGUID:   appData.ApplicationID,
			EndpointGUID:   cfCnsi.GUID,
		}

		// Add login hook to automatically conneect to the Cloud Foundry when the user logs in
		ch.portalProxy.GetConfig().LoginHook = ch.cfLoginHook

		log.Info("All done for Cloud Foundry deployment")
	}
	return nil
}

func (ch *CFHosting) cfLoginHook(c echo.Context) error {
	log.Debug("Auto connecting to the Cloud Foundry instance")
	cfInfo := ch.portalProxy.GetConfig().CloudFoundryInfo
	_, err := ch.portalProxy.DoLoginToCNSI(c, cfInfo.EndpointGUID)
	return err
}

func (ch *CFHosting) EchoMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {

		// If request is a WebSocket request, don't do anything special
		if  c.Request().Header().Contains("Upgrade") &&
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
func (ch *CFHosting)  SessionEchoMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
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


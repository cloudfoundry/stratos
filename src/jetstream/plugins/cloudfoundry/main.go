package cloudfoundry

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/url"
	"strings"

	"errors"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
)

// CloudFoundrySpecification - Plugin to support Cloud Foundry endpoint type
type CloudFoundrySpecification struct {
	portalProxy  interfaces.PortalProxy
	endpointType string
}

const (
	EndpointType  = "cf"
	CLIENT_ID_KEY = "CF_CLIENT"
)

// Init creates a new CloudFoundrySpecification
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &CloudFoundrySpecification{portalProxy: portalProxy, endpointType: EndpointType}, nil
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (c *CloudFoundrySpecification) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return c, nil
}

// GetRoutePlugin gets the route plugin for this plugin
func (c *CloudFoundrySpecification) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return c, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (c *CloudFoundrySpecification) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")
}

func (c *CloudFoundrySpecification) GetType() string {
	return EndpointType
}

func (c *CloudFoundrySpecification) Register(echoContext echo.Context) error {
	log.Info("CloudFoundry Register...")
	return c.portalProxy.RegisterEndpoint(echoContext, c.Info)
}

func (c *CloudFoundrySpecification) Validate(userGUID string, cnsiRecord interfaces.CNSIRecord, tokenRecord interfaces.TokenRecord) error {
	return nil
}

func (c *CloudFoundrySpecification) Connect(ec echo.Context, cnsiRecord interfaces.CNSIRecord, userId string) (*interfaces.TokenRecord, bool, error) {
	log.Info("CloudFoundry Connect...")

	connectType := ec.FormValue("connect_type")
	if len(connectType) == 0 {
		connectType = interfaces.AuthConnectTypeCreds
	}

	if connectType != interfaces.AuthConnectTypeCreds {
		return nil, false, errors.New("Only username/password accepted for Cloud Foundry endpoints")
	}
	cfAdmin := false
	tokenRecord, err := c.portalProxy.ConnectOAuth2(ec, cnsiRecord)
	if err != nil {
		return nil, false, err
	}

	userTokenInfo, err := c.portalProxy.GetUserTokenInfo(tokenRecord.AuthToken)
	if err == nil {
		cfAdmin = strings.Contains(strings.Join(userTokenInfo.Scope, ""), c.portalProxy.GetConfig().CFAdminIdentifier)
	}

	return tokenRecord, cfAdmin, nil
}

func (c *CloudFoundrySpecification) Init() error {
	// Add login hook to automatically register and connect to the Cloud Foundry when the user logs in
	c.portalProxy.AddLoginHook(0, c.cfLoginHook)
	return nil
}

func (c *CloudFoundrySpecification) cfLoginHook(context echo.Context) error {

	cfAPI, cfCnsi, err := c.fetchAutoRegisterEndpoint()
	// CF auto reg url missing, continue as normal
	if cfAPI == "" {
		return nil
	}

	// CF auto reg cnsi entry missing, attempt to register
	if cfCnsi.CNSIType == "" {
		cfEndpointSpec, _ := c.portalProxy.GetEndpointTypeSpec("cf")

		// Allow the auto-registration name to be configured
		autoRegName := c.portalProxy.GetConfig().AutoRegisterCFName
		if len(autoRegName) == 0 {
			autoRegName = "Cloud Foundry"
		}

		log.Infof("Auto-registering cloud foundry endpoint %s as \"%s\"", cfAPI, autoRegName)

		// Auto-register the Cloud Foundry
		cfCnsi, err = c.portalProxy.DoRegisterEndpoint(autoRegName, cfAPI, true, c.portalProxy.GetConfig().CFClient, c.portalProxy.GetConfig().CFClientSecret, false, "", cfEndpointSpec.Info)
		if err != nil {
			log.Errorf("Could not auto-register Cloud Foundry endpoint: %v", err)
			return nil
		}
	} else {
		log.Infof("Found existing cloud foundry endpoint matching %s. Will not auto-register", cfAPI)
	}

	if c.portalProxy.GetConfig().CloudFoundryInfo == nil {
		c.portalProxy.GetConfig().CloudFoundryInfo = &interfaces.CFInfo{}
	}
	c.portalProxy.GetConfig().CloudFoundryInfo.EndpointGUID = cfCnsi.GUID

	log.Infof("Determining if user should auto-connect to %s.", cfAPI)

	userGUID, err := c.portalProxy.GetSessionStringValue(context, "user_id")
	if err != nil {
		return fmt.Errorf("Could not determine user_id from session: %s", err)
	}

	cfTokenRecord, ok := c.portalProxy.GetCNSITokenRecordWithDisconnected(cfCnsi.GUID, userGUID)
	if ok && cfTokenRecord.Disconnected {
		// There exists a record but it's been cleared. This means user has disconnected manually. Don't auto-reconnect
		log.Infof("No, user should not auto-connect to auto-registered cloud foundry %s (previously disconnected). ", cfAPI)
	} else {
		log.Infof("Yes, user should auto-connect to auto-registered cloud foundry %s.", cfAPI)

		// If using SSO login, then copy the tokens, else connect with the same credentials
		if c.portalProxy.GetConfig().SSOLogin {
			log.Info("Auto-connecting to the auto-registered endpoint with the UAA token")
			err = c.portalProxy.DoLoginToCNSIwithConsoleUAAtoken(context, cfCnsi) // no need to login twice
			if err != nil {
				log.Warnf("Could not use console UAA token to login to auto-registered endpoint: %s", err.Error())
				return err
			}
		} else {
			log.Info("Auto-connecting to the auto-registered endpoint with credentials")
			_, err = c.portalProxy.DoLoginToCNSI(context, cfCnsi.GUID, false)
			if err != nil {
				log.Warnf("Could not auto-connect using credentials to auto-registered endpoint: %s", err.Error())
				return err
			}
		}
	}
	return nil
}

func (c *CloudFoundrySpecification) fetchAutoRegisterEndpoint() (string, interfaces.CNSIRecord, error) {
	cfAPI := c.portalProxy.GetConfig().AutoRegisterCFUrl
	cfAPI = strings.TrimRight(cfAPI, "/")

	if cfAPI == "" {
		return "", interfaces.CNSIRecord{}, nil
	}
	// Error is populated if there was an error OR there was no record
	cfCnsi, err := c.portalProxy.GetCNSIRecordByEndpoint(cfAPI)
	return cfAPI, cfCnsi, err
}

// AddAdminGroupRoutes adds the admin routes for this plugin to the Echo server
func (c *CloudFoundrySpecification) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

// AddSessionGroupRoutes adds the session routes for this plugin to the Echo server
func (c *CloudFoundrySpecification) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// Firehose Stream
	echoGroup.GET("/:cnsiGuid/firehose", c.firehose)

	// Applications Log Streams
	echoGroup.GET("/:cnsiGuid/apps/:appGuid/stream", c.appStream)

	// Application Stream
	echoGroup.GET("/:cnsiGuid/apps/:appGuid/appFirehose", c.appFirehose)
}

func (c *CloudFoundrySpecification) Info(apiEndpoint string, skipSSLValidation bool) (interfaces.CNSIRecord, interface{}, error) {
	log.Debug("Info")
	var v2InfoResponse interfaces.V2Info
	var newCNSI interfaces.CNSIRecord

	newCNSI.CNSIType = EndpointType

	uri, err := url.Parse(apiEndpoint)
	if err != nil {
		return newCNSI, nil, err
	}

	uri.Path = "v2/info"
	h := c.portalProxy.GetHttpClient(skipSSLValidation)

	res, err := h.Get(uri.String())
	if err != nil {
		return newCNSI, nil, err
	}

	if res.StatusCode != 200 {
		buf := &bytes.Buffer{}
		io.Copy(buf, res.Body)
		defer res.Body.Close()

		return newCNSI, nil, fmt.Errorf("%s endpoint returned %d\n%s", uri.String(), res.StatusCode, buf)
	}

	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&v2InfoResponse); err != nil {
		return newCNSI, nil, err
	}

	newCNSI.TokenEndpoint = v2InfoResponse.TokenEndpoint
	newCNSI.AuthorizationEndpoint = v2InfoResponse.AuthorizationEndpoint
	newCNSI.DopplerLoggingEndpoint = v2InfoResponse.DopplerLoggingEndpoint

	return newCNSI, v2InfoResponse, nil
}

func (c *CloudFoundrySpecification) UpdateMetadata(info *interfaces.Info, userGUID string, echoContext echo.Context) {
}

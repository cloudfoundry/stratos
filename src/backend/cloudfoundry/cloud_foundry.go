package cloudfoundry

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/url"

	"errors"

	"github.com/SUSE/stratos-ui/config"
	"github.com/SUSE/stratos-ui/repository/interfaces"
	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
)

type CloudFoundrySpecification struct {
	portalProxy  interfaces.PortalProxy
	endpointType string
}

const (
	EndpointType = "cf"
	CLIENT_ID_KEY = "CF_CLIENT"
)

func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &CloudFoundrySpecification{portalProxy: portalProxy, endpointType: EndpointType}, nil
}

func (c *CloudFoundrySpecification) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return c, nil
}

func (c *CloudFoundrySpecification) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return c, nil
}

func (c *CloudFoundrySpecification) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")
}

func (c *CloudFoundrySpecification) GetType() string {
	return EndpointType
}

func (c *CloudFoundrySpecification) GetClientId() string {
	if clientId, err := config.GetValue(CLIENT_ID_KEY); err == nil {
		return clientId
	}

	return "cf"
}

func (c *CloudFoundrySpecification) Register(echoContext echo.Context) error {
	log.Info("CloudFoundry Register...")
	return c.portalProxy.RegisterEndpoint(echoContext, c.Info)
}

func (c *CloudFoundrySpecification) Init() error {
	// Add login hook to automatically register and connect to the Cloud Foundry when the user logs in
	c.portalProxy.GetConfig().LoginHook = c.cfLoginHook

	return nil
}

func (c *CloudFoundrySpecification) cfLoginHook(context echo.Context) error {

	cfAPI, cfCnsi, err := c.fetchAutoRegisterEndpoint()

	// CF auto reg url missing, continue as normal
	if (cfAPI == "") {
		return nil
	}

	// CF auto reg cnsi entry missing, attempt to register
	if cfCnsi.CNSIType == "" {
		log.Infof("Auto-registering cloud foundry endpoint %s", cfAPI)

		cfEndpointSpec, _ := c.portalProxy.GetEndpointTypeSpec("cf")

		// Auto-register the Cloud Foundry
		cfCnsi, err = c.portalProxy.DoRegisterEndpoint("Cloud Foundry", cfAPI, true, cfEndpointSpec.Info)
		if err != nil {
			log.Fatal("Could not auto-register Cloud Foundry endpoint", err)
			return nil
		}

		if c.portalProxy.GetConfig().CloudFoundryInfo != nil {
			c.portalProxy.GetConfig().CloudFoundryInfo.EndpointGUID = cfCnsi.GUID
		}
	} else {
		log.Infof("Found existing cloud foundry endpoint matching %s. Will not auto-register", cfAPI)
	}

	log.Infof("Determining if user should auto-connect to %s.", cfAPI)

	userGUID, err := c.portalProxy.GetSessionStringValue(context, "user_id")
	if err != nil {
		return fmt.Errorf("Could not determine user_id from session: %s", err)
	}

	cfTokenRecord, ok := c.portalProxy.GetCNSITokenRecordWithDisconnected(cfCnsi.GUID, userGUID)
	if ok && cfTokenRecord.Disconnected {
		// There exists a record but it's been cleared. This means user has disconnected manually. Don't auto-reconnect
		log.Infof("No, user should not auto-connect to auto-registered cloud foundry %s (previsouly disoconnected). ", cfAPI)
	} else {
		log.Infof("Yes, user should auto-connect to auto-registered cloud foundry %s.", cfAPI)
		_, err := c.portalProxy.DoLoginToCNSI(context, cfCnsi.GUID)
		return err;
	}

	return nil
}

func (c *CloudFoundrySpecification) fetchAutoRegisterEndpoint() (string, interfaces.CNSIRecord, error) {
	cfAPI := c.portalProxy.GetConfig().AutoRegisterCFUrl

	if (cfAPI == "") {
		return "", interfaces.CNSIRecord{}, nil
	}
	// Error is populated if there was an error OR there was no record
	cfCnsi, err := c.portalProxy.GetCNSIRecordByEndpoint(cfAPI)
	return cfAPI, cfCnsi, err
}

func (c *CloudFoundrySpecification) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (c *CloudFoundrySpecification) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// Firehose Stream
	echoGroup.GET("/:cnsiGuid/firehose", c.firehose)

	// Applications Log Streams
	echoGroup.GET("/:cnsiGuid/apps/:appGuid/stream", c.appStream)
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

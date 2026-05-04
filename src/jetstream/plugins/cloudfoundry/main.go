package cloudfoundry

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/url"
	"strings"

	"errors"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

// Module init will register plugin
func init() {
	api.AddPlugin("cloudfoundry", nil, Init)
}

// CloudFoundrySpecification - Plugin to support Cloud Foundry endpoint type
type CloudFoundrySpecification struct {
	portalProxy  api.PortalProxy
	endpointType string
	// testProxy overrides portalProxy for unit tests of native handlers.
	// Production code always leaves this nil.
	testProxy nativeCFProxy

	// asyncTracker + asyncTranslator wire this plugin into the stratosjobs
	// contract. Populated at Init() by looking up the stratosjobs plugin
	// through the portal proxy. Nil during plugin boot and in tests that
	// don't install them — deleteNativeApp falls back to pre-contract
	// behavior (bare 202) when either is nil.
	asyncTracker    stratosjobs.Tracker
	asyncTranslator stratosjobs.JobTranslator

	// restageTranslator drives the v3 restage state machine. Separate from
	// asyncTranslator (CFJobTranslator) because restage is composed of many
	// CF v3 calls — it doesn't poll a single /v3/jobs/{guid}.
	restageTranslator stratosjobs.JobTranslator

	// rollbackTranslator drives the v3 rollback state machine
	// (deployment_create + deployment_poll). Separate from
	// restageTranslator because rollback skips the package/build/droplet
	// stages — it reuses an existing revision's droplet via
	// /v3/deployments {revision: ...}.
	rollbackTranslator stratosjobs.JobTranslator
}

const (
	EndpointType  = "cf"
	CLIENT_ID_KEY = "CF_CLIENT"
)

// Init creates a new CloudFoundrySpecification
func Init(portalProxy api.PortalProxy) (api.StratosPlugin, error) {
	return &CloudFoundrySpecification{portalProxy: portalProxy, endpointType: EndpointType}, nil
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (c *CloudFoundrySpecification) GetEndpointPlugin() (api.EndpointPlugin, error) {
	return c, nil
}

// GetRoutePlugin gets the route plugin for this plugin
func (c *CloudFoundrySpecification) GetRoutePlugin() (api.RoutePlugin, error) {
	return c, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (c *CloudFoundrySpecification) GetMiddlewarePlugin() (api.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")
}

func (c *CloudFoundrySpecification) GetType() string {
	return EndpointType
}

func (c *CloudFoundrySpecification) Register(echoContext echo.Context) error {
	log.Info("CloudFoundry Register...")
	return c.portalProxy.RegisterEndpoint(echoContext, c.Info)
}

func (c *CloudFoundrySpecification) Validate(userGUID string, cnsiRecord api.CNSIRecord, tokenRecord api.TokenRecord) error {
	return nil
}

func (c *CloudFoundrySpecification) Connect(ec echo.Context, cnsiRecord api.CNSIRecord, userId string) (*api.TokenRecord, bool, error) {
	log.Info("CloudFoundry Connect...")

	params := new(api.LoginToCNSIParams)
	err := api.BindOnce(params, ec)
	if err != nil {
		return nil, false, err
	}

	connectType := params.ConnectType
	if len(connectType) == 0 {
		connectType = api.AuthConnectTypeCreds
	}

	if connectType != api.AuthConnectTypeCreds {
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

	// If capability metadata was assumed at registration time, re-probe now that
	// the endpoint is confirmed reachable and write confirmed values to the DB.
	c.confirmCapabilityMetadata(cnsiRecord)

	return tokenRecord, cfAdmin, nil
}

// confirmCapabilityMetadata re-probes /v2/info and /v3/info if the stored
// metadata was assumed (both probes failed at registration). Writes confirmed
// values back to the DB so subsequent info requests see real capability flags.
//
// The dual-probe is the same intentional pattern documented at the Info()
// callsite: /v2/info and /v3/info return 404 on the other CF version, so
// probing both is the canonical way to detect what the foundation supports.
func (c *CloudFoundrySpecification) confirmCapabilityMetadata(cnsiRecord api.CNSIRecord) {
	var existing api.CFEndpointMetadata
	if err := json.Unmarshal([]byte(cnsiRecord.Metadata), &existing); err != nil || !existing.Assumed {
		return
	}

	apiEndpoint := cnsiRecord.APIEndpoint.String()
	h := c.portalProxy.GetHttpClient(cnsiRecord.SkipSSLValidation, cnsiRecord.CACert)
	confirmed := api.CFEndpointMetadata{}

	uri, err := url.Parse(apiEndpoint)
	if err != nil {
		return
	}

	v2Uri := *uri
	v2Uri.Path = "v2/info"
	if res, err := h.Get(v2Uri.String()); err == nil {
		defer res.Body.Close()
		if res.StatusCode == 200 {
			var v2 api.V2Info
			if json.NewDecoder(res.Body).Decode(&v2) == nil && v2.AuthorizationEndpoint != "" {
				confirmed.SupportsV2 = true
			}
		}
	}

	v3Uri := *uri
	v3Uri.Path = "v3/info"
	if res, err := h.Get(v3Uri.String()); err == nil {
		defer res.Body.Close()
		if res.StatusCode == 200 {
			var v3 api.V3Info
			if json.NewDecoder(res.Body).Decode(&v3) == nil && v3.Links.Self.Href != "" {
				confirmed.SupportsV3 = true
			}
		}
	}

	if !confirmed.SupportsV2 && !confirmed.SupportsV3 {
		// Still unreachable — leave Assumed=true for the next connect attempt
		return
	}

	if metaBytes, err := json.Marshal(confirmed); err == nil {
		if err := c.portalProxy.UpdateEndpointMetadata(cnsiRecord.GUID, string(metaBytes)); err != nil {
			log.Warnf("CF: could not update capability metadata for %s: %v", cnsiRecord.GUID, err)
		} else {
			log.Infof("CF: confirmed capability metadata for %s: v2=%v v3=%v", cnsiRecord.GUID, confirmed.SupportsV2, confirmed.SupportsV3)
		}
	}
}

func (c *CloudFoundrySpecification) Init() error {
	// Add login hook to automatically register and connect to the Cloud Foundry when the user logs in
	c.portalProxy.AddLoginHook(0, c.cfLoginHook)

	// Wire into the stratosjobs contract. Plugin load order isn't
	// guaranteed — if stratosjobs didn't register yet we log + skip, and
	// deleteNativeApp falls back to bare 202.
	if plug := c.portalProxy.GetPlugin(stratosjobs.PluginName); plug != nil {
		if jobsPlugin, ok := plug.(*stratosjobs.StratosJobs); ok {
			c.asyncTracker = jobsPlugin.Tracker()
			c.asyncTranslator = NewCFJobTranslator(c)
			c.restageTranslator = NewRestageJobTranslator(c)
			c.rollbackTranslator = NewRollbackJobTranslator(c)
		} else {
			log.Warnf("CF plugin: %q found but has unexpected type %T; async-job contract disabled for CF writes", stratosjobs.PluginName, plug)
		}
	} else {
		log.Warnf("CF plugin: stratosjobs plugin not registered; async-job contract disabled for CF writes")
	}

	return nil
}

func (c *CloudFoundrySpecification) cfLoginHook(context echo.Context) error {

	cfAPI, cfCnsi, err := c.fetchAutoRegisterEndpoint()
	// CF auto reg url missing, continue as normal
	if cfAPI == "" {
		return nil
	}

	userGUID, err := c.portalProxy.GetSessionStringValue(context, "user_id")
	if err != nil {
		return fmt.Errorf("Could not determine user_id from session: %s", err)
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
		cfCnsi, err = c.portalProxy.DoRegisterEndpoint(autoRegName, cfAPI, true, c.portalProxy.GetConfig().CFClient, c.portalProxy.GetConfig().CFClientSecret, "", false, "", false, "", cfEndpointSpec.Info)
		if err != nil {
			log.Errorf("Could not auto-register Cloud Foundry endpoint: %v", err)
			return nil
		}
	} else {
		log.Infof("Found existing cloud foundry endpoint matching %s. Will not auto-register", cfAPI)
	}

	if c.portalProxy.GetConfig().CloudFoundryInfo == nil {
		c.portalProxy.GetConfig().CloudFoundryInfo = &api.CFInfo{}
	}
	c.portalProxy.GetConfig().CloudFoundryInfo.EndpointGUID = cfCnsi.GUID

	log.Infof("Determining if user should auto-connect to %s.", cfAPI)

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

func (c *CloudFoundrySpecification) fetchAutoRegisterEndpoint() (string, api.CNSIRecord, error) {
	cfAPI := c.portalProxy.GetConfig().AutoRegisterCFUrl
	cfAPI = strings.TrimRight(cfAPI, "/")

	if cfAPI == "" {
		return "", api.CNSIRecord{}, nil
	}
	// Error is populated if there was an error OR there was no record
	cfCnsi, err := c.portalProxy.GetAdminCNSIRecordByEndpoint(cfAPI)
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

	// Native Stratos routes — v3-backed, Stratos-shaped DTOs
	c.addNativeRoutes(echoGroup)
}

func (c *CloudFoundrySpecification) Info(apiEndpoint string, skipSSLValidation bool, caCert string) (api.CNSIRecord, interface{}, error) {
	log.Debug("Info")
	var v2InfoResponse api.V2Info
	var apiRootResponse api.ApiRoot
	var endpointInfo api.EndpointInfo
	var newCNSI api.CNSIRecord

	newCNSI.CNSIType = EndpointType

	uri, err := url.Parse(apiEndpoint)
	if err != nil {
		return newCNSI, nil, err
	}

	log.Debugf("CF:Info: SkipSSL %t Cert '%s'", skipSSLValidation, caCert)
	h := c.portalProxy.GetHttpClient(skipSSLValidation, caCert)

	// Probe root endpoint to confirm reachability
	res, err := h.Get(uri.String())
	if err != nil {
		return newCNSI, nil, err
	}
	if res.StatusCode != 200 {
		buf := &bytes.Buffer{}
		io.Copy(buf, res.Body)
		res.Body.Close()
		return newCNSI, nil, fmt.Errorf("%s endpoint returned %d\n%s", uri.String(), res.StatusCode, buf)
	}
	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&apiRootResponse); err != nil {
		return newCNSI, nil, err
	}

	metadata := api.CFEndpointMetadata{}

	// Capability detection — intentional dual-probe of /v2/info and /v3/info.
	// This is NOT an unmigrated v2 callsite; it's how Stratos discovers what
	// the foundation supports so downstream handlers know whether to gate
	// V3-only operations (rolling/canary deployments, restage v3 composition).
	// Both endpoints return 404 on the other version's CF, so each probe is
	// soft-fail. Until RFC-0032's v2 sunset (end of 2026), every reachable CF
	// has at least one of the two responding 200; if both fail (TLS / network),
	// we fall through to "assume v2" + Assumed=true, which triggers re-probe
	// at Connect time via confirmCapabilityMetadata.

	// Probe /v2/info — soft failure; v3-only CFs will 404 here
	v2Uri := *uri
	v2Uri.Path = "v2/info"
	if res, err := h.Get(v2Uri.String()); err == nil {
		defer res.Body.Close()
		if res.StatusCode == 200 {
			var v2 api.V2Info
			if json.NewDecoder(res.Body).Decode(&v2) == nil && v2.AuthorizationEndpoint != "" {
				metadata.SupportsV2 = true
				v2InfoResponse = v2
				newCNSI.TokenEndpoint = v2.TokenEndpoint
				newCNSI.AuthorizationEndpoint = v2.AuthorizationEndpoint
				newCNSI.DopplerLoggingEndpoint = v2.DopplerLoggingEndpoint
			}
		}
	}

	// Probe /v3/info — soft failure; v2-only CFs will 404 here
	v3Uri := *uri
	v3Uri.Path = "v3/info"
	if res, err := h.Get(v3Uri.String()); err == nil {
		defer res.Body.Close()
		if res.StatusCode == 200 {
			var v3 api.V3Info
			if json.NewDecoder(res.Body).Decode(&v3) == nil && v3.Links.Self.Href != "" {
				metadata.SupportsV3 = true
			}
		}
	}

	if !metadata.SupportsV2 && !metadata.SupportsV3 {
		// Probes failed (SSL error, timeout, etc.) — assume v2 conservatively.
		// Assumed=true signals Connect() to re-probe once the endpoint is reachable.
		log.Warnf("CF:Info: could not determine API version for %s — assuming v2", apiEndpoint)
		metadata.SupportsV2 = true
		metadata.Assumed = true
	}

	if metaBytes, err := json.Marshal(metadata); err == nil {
		newCNSI.Metadata = string(metaBytes)
	}

	endpointInfo.ApiRoot = apiRootResponse
	endpointInfo.V2Info = v2InfoResponse
	return newCNSI, endpointInfo, nil
}

func (c *CloudFoundrySpecification) UpdateMetadata(info *api.Info, userGUID string, echoContext echo.Context) {
}

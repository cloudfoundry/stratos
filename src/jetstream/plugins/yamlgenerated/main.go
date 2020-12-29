package yamlgenerated

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo/v4"
	"gopkg.in/yaml.v2"

	log "github.com/sirupsen/logrus"
)

// GeneratedPlugin represents a generated plugin
type GeneratedPlugin struct {
	initMethod       func() error
	middlewarePlugin func() (interfaces.MiddlewarePlugin, error)
	endpointPlugin   func() (interfaces.EndpointPlugin, error)
	routePlugin      func() (interfaces.RoutePlugin, error)
}

var authTypeToConnectTypeMap = map[string]string{
	interfaces.AuthTypeHttpBasic: interfaces.AuthConnectTypeCreds,
	interfaces.AuthTypeBearer:    interfaces.AuthConnectTypeBearer,
	interfaces.AuthTypeToken:     interfaces.AuthConnectTypeToken,
}

const defaultTokenUsername = "**token**"

type pluginConfig struct {
	// Name is the endpoint type
	Name string `yaml:"name"`
	// SubType of the endpoint
	SubType string `yaml:"sub_type"`
	// AuthType - for now, only one auth type is supported
	AuthType string `yaml:"auth_type"`
	// UserInfoAPI is the Rest URL to fetch User if
	UserInfoAPI string `yaml:"user_info"`
	// UserInfoPath is the path in the response to the above REST API to get the username from the retrurned JSON
	UserInfoPath string `yaml:"user_info_path"`
}

// Init the plugin
func (gp GeneratedPlugin) Init() error { return gp.initMethod() }
func (gp GeneratedPlugin) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return gp.middlewarePlugin()
}
func (gp GeneratedPlugin) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return gp.endpointPlugin()
}
func (gp GeneratedPlugin) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return gp.routePlugin()
}

// GeneratedEndpointPlugin represents a generated endpoint plugin
type GeneratedEndpointPlugin struct {
	portalProxy  interfaces.PortalProxy
	endpointType string
	subTypes     map[string]pluginConfig
}

func (gep GeneratedEndpointPlugin) GetType() string {
	return gep.endpointType
}

func (gep GeneratedEndpointPlugin) Register(ec echo.Context) error {
	return gep.portalProxy.RegisterEndpoint(ec, gep.Info)
}

func (gep GeneratedEndpointPlugin) Validate(userGUID string, cnsiRecord interfaces.CNSIRecord, tokenRecord interfaces.TokenRecord) error {
	return nil
}

func (gep GeneratedEndpointPlugin) Connect(ec echo.Context, cnsiRecord interfaces.CNSIRecord, userId string) (*interfaces.TokenRecord, bool, error) {
	params := new(interfaces.LoginToCNSIParams)
	err := interfaces.BindOnce(params, ec)
	if err != nil {
		return nil, false, err
	}

	subType, ok := gep.subTypes[cnsiRecord.SubType]
	if !ok {
		return nil, false, fmt.Errorf("Unknown subtype %q for endpoint type %q", cnsiRecord.SubType, gep.GetType())
	}

	authType := subType.AuthType
	expectedConnectType, ok := authTypeToConnectTypeMap[authType]
	if !ok {
		return nil, false, fmt.Errorf("Unknown authentication type %q for endpoint type %q", authType, gep.GetType())
	}

	if expectedConnectType != params.ConnectType {
		return nil, false, fmt.Errorf("Only %q connect type is supported for %q.%q endpoints", expectedConnectType, gep.GetType(), cnsiRecord.SubType)
	}

	var tr *interfaces.TokenRecord

	switch params.ConnectType {
	case interfaces.AuthConnectTypeCreds:
		if params.Username == "" || params.Password == "" {
			return nil, false, errors.New("Need username and password")
		}

		authString := fmt.Sprintf("%s:%s", params.Username, params.Password)
		base64EncodedAuthString := base64.StdEncoding.EncodeToString([]byte(authString))

		tr = &interfaces.TokenRecord{
			AuthType:     interfaces.AuthTypeHttpBasic,
			AuthToken:    base64EncodedAuthString,
			RefreshToken: params.Username,
		}
	case interfaces.AuthConnectTypeBearer:
		authString := ec.FormValue("token")
		base64EncodedAuthString := base64.StdEncoding.EncodeToString([]byte(authString))

		tr = &interfaces.TokenRecord{
			AuthType:  interfaces.AuthTypeBearer,
			AuthToken: base64EncodedAuthString,
		}
		tr.RefreshToken = gep.fetchUsername(subType, &cnsiRecord, tr)
	case interfaces.AuthConnectTypeToken:
		authString := ec.FormValue("token")
		base64EncodedAuthString := base64.StdEncoding.EncodeToString([]byte(authString))

		tr = &interfaces.TokenRecord{
			AuthType:  interfaces.AuthTypeToken,
			AuthToken: base64EncodedAuthString,
		}
		tr.RefreshToken = gep.fetchUsername(subType, &cnsiRecord, tr)
	}

	return tr, false, nil
}

// We support a basic mechanism for fetching the username of the user if configured
func (gep GeneratedEndpointPlugin) fetchUsername(config pluginConfig, cnsiRecord *interfaces.CNSIRecord, tr *interfaces.TokenRecord) string {
	if config.UserInfoAPI == "" || config.UserInfoPath == "" {
		// Not configured
		return defaultTokenUsername
	}

	// Make a request to the user info endpoint
	resp, err := gep.portalProxy.DoProxySingleRequestWithToken(cnsiRecord.GUID, tr, "GET", config.UserInfoAPI, nil, nil)
	if err != nil {
		return defaultTokenUsername
	}

	if resp.StatusCode != http.StatusOK {
		return defaultTokenUsername
	}

	// Find the username from the returned document
	var data map[string]interface{}
	if err = json.Unmarshal(resp.Response, &data); err == nil {
		name := getJSONValue(data, config.UserInfoPath)
		if len(name) > 0 {
			return name
		}
	}

	return defaultTokenUsername
}

func getJSONValue(data map[string]interface{}, valuePath string) string {
	parts := strings.Split(valuePath, ".")
	value := data[parts[0]]
	if value != nil {
		if len(parts) == 1 {
			// This was the last part
			if sName, ok := value.(string); ok {
				return sName
			}
			return ""
		}
		// Not the last path, so get the next level item
		if sNextLevel, ok := value.(map[string]interface{}); ok {
			return getJSONValue(sNextLevel, strings.Join(parts[1:], "."))
		}
	}

	// Failed to find the value
	return ""
}

// Info gets the info for the endpoint
func (gep GeneratedEndpointPlugin) Info(apiEndpoint string, skipSSLValidation bool) (interfaces.CNSIRecord, interface{}, error) {
	var dummy interface{}
	var newCNSI interfaces.CNSIRecord

	newCNSI.CNSIType = gep.GetType()

	_, err := url.Parse(apiEndpoint)
	if err != nil {
		return newCNSI, nil, err
	}

	newCNSI.TokenEndpoint = apiEndpoint
	newCNSI.AuthorizationEndpoint = apiEndpoint

	return newCNSI, dummy, nil
}

// UpdateMetadata allows the pluigin to update the metadata for endpoints - not used in the generic case
func (gep GeneratedEndpointPlugin) UpdateMetadata(info *interfaces.Info, userGUID string, echoContext echo.Context) {
	// no-op
}

// MakePluginsFromConfig will generate plugins for the yaml-configured endpoints
func MakePluginsFromConfig() {
	log.Debug("MakePluginsFromConfig")

	var config []pluginConfig

	yamlFile, err := ioutil.ReadFile("plugins.yaml")
	if err != nil {
		log.Errorf("Can't generate plugins from YAML: %v ", err)
		return
	}

	err = yaml.Unmarshal(yamlFile, &config)
	if err != nil {
		log.Errorf("Failed to unmarshal YAML: %v ", err)
		return
	}

	plugins := make(map[string]GeneratedEndpointPlugin)
	for _, plugin := range config {
		if plugin.Name == "" {
			log.Errorf("Plugin must have a name")
			return
		}

		log.Debugf("Processing plugin for endpoint %s and sub-type %s", plugin.Name, plugin.SubType)

		// Create a plugin if needed then add this sub type to the plugin
		ep, ok := plugins[plugin.Name]
		if !ok {
			ep = createPluginForEndpointType(plugin.Name)
			plugins[plugin.Name] = ep
		}

		// Add this subtype to the plugin - subtype can be empty
		if _, ok := ep.subTypes[plugin.SubType]; ok {
			log.Warnf("Sub-type %s already declared for endpoint type %s - ignoring", plugin.Name, plugin.SubType)
		} else {
			ep.subTypes[plugin.SubType] = plugin
		}
	}
}

func createPluginForEndpointType(endpointType string) GeneratedEndpointPlugin {
	log.Debugf("Generating plugin %s", endpointType)
	gep := GeneratedEndpointPlugin{}
	gep.endpointType = endpointType
	gep.subTypes = make(map[string]pluginConfig)

	gp := GeneratedPlugin{}
	gp.initMethod = func() error { return nil }
	gp.endpointPlugin = func() (interfaces.EndpointPlugin, error) { return gep, nil }
	gp.middlewarePlugin = func() (interfaces.MiddlewarePlugin, error) { return nil, errors.New("Not implemented") }
	gp.routePlugin = func() (interfaces.RoutePlugin, error) { return nil, errors.New("Not implemented") }

	interfaces.AddPlugin(
		endpointType,
		[]string{},
		func(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
			log.Debugf("%s -- initializing", endpointType)
			gep.portalProxy = portalProxy
			return gp, nil
		},
	)
	return gep
}

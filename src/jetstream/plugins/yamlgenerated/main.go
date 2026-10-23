package yamlgenerated

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/url"
	"os"
	"strings"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v5"
	"go.yaml.in/yaml/v4"
)

// GeneratedPlugin represents a generated plugin
type GeneratedPlugin struct {
	initMethod       func() error
	middlewarePlugin func() (api.MiddlewarePlugin, error)
	endpointPlugin   func() (api.EndpointPlugin, error)
	routePlugin      func() (api.RoutePlugin, error)
}

var authTypeToConnectTypeMap = map[string]string{
	api.AuthTypeHttpBasic: api.AuthConnectTypeCreds,
	api.AuthTypeBearer:    api.AuthConnectTypeBearer,
	api.AuthTypeToken:     api.AuthConnectTypeToken,
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
func (gp GeneratedPlugin) GetMiddlewarePlugin() (api.MiddlewarePlugin, error) {
	return gp.middlewarePlugin()
}
func (gp GeneratedPlugin) GetEndpointPlugin() (api.EndpointPlugin, error) {
	return gp.endpointPlugin()
}
func (gp GeneratedPlugin) GetRoutePlugin() (api.RoutePlugin, error) {
	return gp.routePlugin()
}

// GeneratedEndpointPlugin represents a generated endpoint plugin
type GeneratedEndpointPlugin struct {
	portalProxy  api.PortalProxy
	endpointType string
	subTypes     map[string]pluginConfig
}

func (gep GeneratedEndpointPlugin) GetType() string {
	return gep.endpointType
}

func (gep GeneratedEndpointPlugin) Register(ec *echo.Context) error {
	return gep.portalProxy.RegisterEndpoint(ec, gep.Info)
}

// Validate has nothing left to check: Connect already asked the user info
// API with the new token (fetchUsername) and failed if it was refused.
func (gep GeneratedEndpointPlugin) Validate(userGUID string, cnsiRecord api.CNSIRecord, tokenRecord api.TokenRecord) error {
	return nil
}

func (gep GeneratedEndpointPlugin) Connect(ec *echo.Context, cnsiRecord api.CNSIRecord, userId string) (*api.TokenRecord, bool, error) {
	params := new(api.LoginToCNSIParams)
	err := api.BindOnce(params, ec)
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

	var tr *api.TokenRecord

	switch params.ConnectType {
	case api.AuthConnectTypeCreds:
		if len(params.Username) == 0 || len(params.Password) == 0 {
			return nil, false, errors.New("Need username and password")
		}

		authString := fmt.Sprintf("%s:%s", params.Username, params.Password)
		base64EncodedAuthString := base64.StdEncoding.EncodeToString([]byte(authString))

		tr = &api.TokenRecord{
			AuthType:     api.AuthTypeHttpBasic,
			AuthToken:    base64EncodedAuthString,
			RefreshToken: params.Username,
		}
	case api.AuthConnectTypeBearer:
		authString := ec.FormValue("token")
		base64EncodedAuthString := base64.StdEncoding.EncodeToString([]byte(authString))

		tr = &api.TokenRecord{
			AuthType:  api.AuthTypeBearer,
			AuthToken: base64EncodedAuthString,
		}
		if tr.RefreshToken, err = gep.fetchUsername(subType, &cnsiRecord, tr); err != nil {
			return nil, false, err
		}
	case api.AuthConnectTypeToken:
		authString := ec.FormValue("token")
		base64EncodedAuthString := base64.StdEncoding.EncodeToString([]byte(authString))

		tr = &api.TokenRecord{
			AuthType:  api.AuthTypeToken,
			AuthToken: base64EncodedAuthString,
		}
		if tr.RefreshToken, err = gep.fetchUsername(subType, &cnsiRecord, tr); err != nil {
			return nil, false, err
		}
	}

	return tr, false, nil
}

// fetchUsername asks the subtype's user info API (plugins.yaml: /user, i.e.
// GitHub GET /user and GitLab GET /api/v4/user, as a GitLab endpoint URL
// ends in /api/v4) for the user the token belongs to. This is also the
// token check: an error status or a failed request is returned, so a token
// the API refuses does not connect. The request goes through the auth
// handler for the token's type, which uses the endpoint record's Skip SSL
// and CA certificate.
//
// defaultTokenUsername stands in for the name when there is no user info
// API to ask (the token cannot be checked either) or the answer has no name
// at the configured path. The git endpoint details show it as "Unknown".
func (gep GeneratedEndpointPlugin) fetchUsername(config pluginConfig, cnsiRecord *api.CNSIRecord, tr *api.TokenRecord) (string, error) {
	if len(config.UserInfoAPI) == 0 {
		return defaultTokenUsername, nil
	}

	resp, err := gep.portalProxy.DoProxySingleRequestWithToken(cnsiRecord.GUID, tr, "GET", config.UserInfoAPI, nil, nil)
	if err != nil {
		return "", err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		// The connect handler reports a refused token, an unreachable API
		// or a TLS failure from these.
		if resp.Error != nil {
			return "", fmt.Errorf("unable to check the token with %s: %w", config.UserInfoAPI, resp.Error)
		}
		return "", api.ErrHTTPRequest{Status: resp.StatusCode, Response: string(resp.Response)}
	}

	// Find the username from the returned document
	var data map[string]interface{}
	if len(config.UserInfoPath) > 0 && json.Unmarshal(resp.Response, &data) == nil {
		if name := getJSONValue(data, config.UserInfoPath); len(name) > 0 {
			return name, nil
		}
	}
	return defaultTokenUsername, nil
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
func (gep GeneratedEndpointPlugin) Info(apiEndpoint string, skipSSLValidation bool, caCert string) (api.CNSIRecord, interface{}, error) {
	var dummy interface{}
	var newCNSI api.CNSIRecord

	newCNSI.CNSIType = gep.GetType()

	_, err := url.Parse(apiEndpoint)
	if err != nil {
		return newCNSI, nil, err
	}

	newCNSI.TokenEndpoint = apiEndpoint
	newCNSI.AuthorizationEndpoint = apiEndpoint
	newCNSI.CACert = caCert

	return newCNSI, dummy, nil
}

// UpdateMetadata allows the pluigin to update the metadata for endpoints - not used in the generic case
func (gep GeneratedEndpointPlugin) UpdateMetadata(info *api.Info, userGUID string, echoContext *echo.Context) {
	// no-op
}

// MakePluginsFromConfig will generate plugins for the yaml-configured endpoints
func MakePluginsFromConfig() {
	slog.Debug("MakePluginsFromConfig")

	var config []pluginConfig

	yamlFile, err := os.ReadFile("plugins.yaml")
	if err != nil {
		slog.Error("cannot generate plugins from YAML", "file", "plugins.yaml", "error", err)
		return
	}

	err = yaml.Load(yamlFile, &config)
	if err != nil {
		slog.Error("failed to unmarshal the plugins YAML", "file", "plugins.yaml", "error", err)
		return
	}

	plugins := make(map[string]GeneratedEndpointPlugin)
	for _, plugin := range config {
		if len(plugin.Name) == 0 {
			slog.Error("plugin must have a name")
			return
		}

		slog.Debug("Processing plugin", "endpointType", plugin.Name, "subType", plugin.SubType)

		// Create a plugin if needed then add this sub type to the plugin
		ep, ok := plugins[plugin.Name]
		if !ok {
			ep = createPluginForEndpointType(plugin.Name)
			plugins[plugin.Name] = ep
		}

		// Add this subtype to the plugin - subtype can be empty
		if _, ok := ep.subTypes[plugin.SubType]; ok {
			slog.Warn("sub-type already declared for this endpoint type - ignoring",
				"endpointType", plugin.Name, "subType", plugin.SubType)
		} else {
			ep.subTypes[plugin.SubType] = plugin
		}
	}
}

func createPluginForEndpointType(endpointType string) GeneratedEndpointPlugin {
	slog.Debug("Generating plugin", "endpointType", endpointType)
	gep := GeneratedEndpointPlugin{}
	gep.endpointType = endpointType
	gep.subTypes = make(map[string]pluginConfig)

	gp := GeneratedPlugin{}
	gp.initMethod = func() error { return nil }
	gp.endpointPlugin = func() (api.EndpointPlugin, error) { return gep, nil }
	gp.middlewarePlugin = func() (api.MiddlewarePlugin, error) { return nil, errors.New("Not implemented") }
	gp.routePlugin = func() (api.RoutePlugin, error) { return nil, errors.New("Not implemented") }

	api.AddPlugin(
		endpointType,
		[]string{},
		func(portalProxy api.PortalProxy) (api.StratosPlugin, error) {
			slog.Debug("initializing plugin", "endpointType", endpointType)
			gep.portalProxy = portalProxy
			return gp, nil
		},
	)
	return gep
}

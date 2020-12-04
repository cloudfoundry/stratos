package yamlgenerated

import (
	"encoding/base64"
	"errors"
	"fmt"
	"io/ioutil"
	"net/url"
	"strings"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo/v4"
	"gopkg.in/yaml.v2"

	log "github.com/sirupsen/logrus"
)

type GeneratedPlugin struct {
	initMethod       func() error
	middlewarePlugin func() (interfaces.MiddlewarePlugin, error)
	endpointPlugin   func() (interfaces.EndpointPlugin, error)
	routePlugin      func() (interfaces.RoutePlugin, error)
}

var authTypeToConnectTypeMap = map[string]string{
	interfaces.AuthTypeHttpBasic: interfaces.AuthConnectTypeCreds,
	interfaces.AuthTypeBearer:    interfaces.AuthConnectTypeBearer,
}

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

type GeneratedEndpointPlugin struct {
	portalProxy  interfaces.PortalProxy
	endpointType string
	authTypes    map[string]string
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

	authType, ok := gep.authTypes[cnsiRecord.SubType]
	if !ok {
		return nil, false, fmt.Errorf("Unknown subtype %q for endpoint type %q", cnsiRecord.SubType, gep.GetType())
	}

	expectedConnectType, ok := authTypeToConnectTypeMap[authType]
	if !ok {
		return nil, false, fmt.Errorf("Unknown authentication type %q for plugin %q", authType, gep.GetType())
	}

	if expectedConnectType != params.ConnectType {
		return nil, false, fmt.Errorf("Only %q connect type is supported for %q.%q endpoints", expectedConnectType, gep.GetType(), cnsiRecord.SubType)
	}

	var tr *interfaces.TokenRecord

	switch params.ConnectType {
	case interfaces.AuthConnectTypeCreds:
		if len(params.Username) == 0 || len(params.Password) == 0 {
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
			AuthType:     interfaces.AuthTypeBearer,
			AuthToken:    base64EncodedAuthString,
			RefreshToken: "token", // DB needs a non-empty value
		}
	}

	return tr, false, nil
}

func (gep GeneratedEndpointPlugin) Info(apiEndpoint string, skipSSLValidation bool, caCert string) (interfaces.CNSIRecord, interface{}, error) {
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

func (gep GeneratedEndpointPlugin) UpdateMetadata(info *interfaces.Info, userGUID string, echoContext echo.Context) {
	// no-op
}

type PluginConfig struct {
	Name     string `yaml:"name"`
	AuthType string `yaml:"auth_type"`
}

func MakePluginsFromConfig() {
	log.Debug("MakePluginsFromConfig")

	var config []PluginConfig

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

	plugins := make(map[string]map[string]string)

	for _, plugin := range config {
		if len(plugin.Name) == 0 {
			log.Errorf("Plugin must have a name")
			return
		}

		log.Debugf("Generating plugin %s", plugin.Name)

		pieces := strings.SplitN(plugin.Name, ".", 2)
		endpointType, endpointSubtype := pieces[0], ""

		if len(pieces) > 1 {
			endpointSubtype = pieces[1]
		}

		_, ok := plugins[endpointType]
		if !ok {
			plugins[endpointType] = make(map[string]string)
		}

		plugins[endpointType][endpointSubtype] = plugin.AuthType
	}

	for endpointType, authTypes := range plugins {
		gep := GeneratedEndpointPlugin{}
		gep.endpointType = endpointType
		gep.authTypes = authTypes

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
	}
}

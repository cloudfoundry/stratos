package yamlgenerated

import (
	"encoding/base64"
	"errors"
	"fmt"
	"io/ioutil"
	"net/url"

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

func (gp GeneratedPlugin) Init() error { return gp.initMethod() }
func (gp GeneratedPlugin) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	//return nil, errors.New("Not implemented")
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
}

type GeneratedEndpointPluginAuth struct {
	Type     string
	Username string
	Password string
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

	connectType := params.ConnectType
	auth := &GeneratedEndpointPluginAuth{
		Type: connectType,
	}

	switch connectType {
	case interfaces.AuthConnectTypeCreds:
		auth.Username = params.Username
		auth.Password = params.Password
		if connectType == interfaces.AuthConnectTypeCreds && (len(auth.Username) == 0 || len(auth.Password) == 0) {
			return nil, false, errors.New("Need username and password")
		}
	default:
		return nil, false, fmt.Errorf("Only username/password or no authentication is accepted for %s endpoints", gep.GetType())
	}

	authString := fmt.Sprintf("%s:%s", auth.Username, auth.Password)
	base64EncodedAuthString := base64.StdEncoding.EncodeToString([]byte(authString))

	tr := &interfaces.TokenRecord{
		AuthType:     interfaces.AuthTypeHttpBasic,
		AuthToken:    base64EncodedAuthString,
		RefreshToken: auth.Username,
	}

	return tr, false, nil
}

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

func (gep GeneratedEndpointPlugin) UpdateMetadata(info *interfaces.Info, userGUID string, echoContext echo.Context) {
	// no-op
}

type PluginConfig struct {
	Name string `yaml:"name"`
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

	for _, plugin := range config {
		log.Debugf("Generating plugin %s", plugin.Name)

		gep := GeneratedEndpointPlugin{}
		gep.endpointType = plugin.Name

		gp := GeneratedPlugin{}
		gp.initMethod = func() error { return nil }
		gp.endpointPlugin = func() (interfaces.EndpointPlugin, error) { return gep, nil }
		gp.middlewarePlugin = func() (interfaces.MiddlewarePlugin, error) { return nil, errors.New("Not implemented") }
		gp.routePlugin = func() (interfaces.RoutePlugin, error) { return nil, errors.New("Not implemented") }

		interfaces.AddPlugin(
			plugin.Name,
			[]string{},
			func(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
				log.Debugf("%s -- initializing", plugin.Name)

				gep.portalProxy = portalProxy
				return gp, nil
			},
		)
	}
}

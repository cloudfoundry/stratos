package demo

import (
	"errors"

	"strings"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
)

var hiddenEndpoints []string

// DemoSpecification is a plugin to support the demo plugin
type DemoSpecification struct {
	portalProxy interfaces.PortalProxy
}

const (
	EndpointType  = "demo"
	CLIENT_ID_KEY = "DEMO_CLIENT"
)

// Init creates a new DemoSpecification
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &DemoSpecification{portalProxy: portalProxy}, nil
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (m *DemoSpecification) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return m, nil
}

// GetRoutePlugin gets the route plugin for this plugin
func (m *DemoSpecification) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return m, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (m *DemoSpecification) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")
}

// AddAdminGroupRoutes adds the admin routes for this plugin to the Echo server
func (m *DemoSpecification) AddAdminGroupRoutes(echoContext *echo.Group) {
}

// AddSessionGroupRoutes adds the session routes for this plugin to the Echo server
func (m *DemoSpecification) AddSessionGroupRoutes(echoContext *echo.Group) {
	echoContext.POST("/demo/endpoints/:action", m.demo)
}

func (m *DemoSpecification) GetType() string {
	return EndpointType
}

func (m *DemoSpecification) GetClientId() string {
	return m.portalProxy.Env().String(CLIENT_ID_KEY, "demo")
}

func (m *DemoSpecification) Register(echoContext echo.Context) error {
	return errors.New("Not implemented!")
}

func (m *DemoSpecification) Validate(userGUID string, cnsiRecord interfaces.CNSIRecord, tokenRecord interfaces.TokenRecord) error {
	return nil
}

func (m *DemoSpecification) Connect(ec echo.Context, cnsiRecord interfaces.CNSIRecord, userId string) (*interfaces.TokenRecord, bool, error) {
	return nil, false, errors.New("Not implemented!")
}

// Init performs plugin initialization
func (m *DemoSpecification) Init() error {
	return errors.New("Manually disabled")
}

func (m *DemoSpecification) Info(apiEndpoint string, skipSSLValidation bool) (interfaces.CNSIRecord, interface{}, error) {
	var newCNSI interfaces.CNSIRecord
	return newCNSI, nil, errors.New("Not implemented!")
}

func (m *DemoSpecification) UpdateMetadata(info *interfaces.Info, userGUID string, echoContext echo.Context) {
	// Go through again, annotate this time with which have metrics
	for key, values := range info.Endpoints {
		shown := make(map[string]*interfaces.EndpointDetail)
		for n, endpoint := range values {
			if !stringInSlice(endpoint.Name, hiddenEndpoints) {
				shown[n] = endpoint
			}
		}

		// Only return those that are shown
		info.Endpoints[key] = shown
	}
}

func stringInSlice(a string, list []string) bool {
	for _, b := range list {
		if b == a {
			return true
		}
	}
	return false
}

func (m *DemoSpecification) demo(c echo.Context) error {

	action := c.Param("action")
	// podId := c.Param("podId")

	log.Infof("Demo: %s", action)

	if action == "show" {
		hiddenEndpoints = make([]string, 0)
	} else if action == "hide" {
		hiddenEndpoints = make([]string, 0)
		// Hide all endpoints (apart from one named 'cf')

		endpoints, err := m.portalProxy.ListEndpoints()
		if err != nil {
			return err
		}

		for _, endpoint := range endpoints {
			if endpoint.Name != "CF" && endpoint.Name != "cf" {
				hiddenEndpoints = append(hiddenEndpoints, endpoint.Name)
			}
		}
	} else {
		m.unhide(action)
	}

	log.Infof("Hidden Endpoints: %s", strings.Join(hiddenEndpoints, ","))
	return c.JSON(200, hiddenEndpoints)
}

func (m *DemoSpecification) unhide(epType string) {
	endpoints, err := m.portalProxy.ListEndpoints()
	if err != nil {
		return
	}

	for _, endpoint := range endpoints {
		if endpoint.CNSIType == epType {
			hiddenEndpoints = remove(hiddenEndpoints, endpoint.Name)
		}
	}
}

func remove(s []string, r string) []string {
	for i, v := range s {
		if v == r {
			return append(s[:i], s[i+1:]...)
		}
	}
	return s
}

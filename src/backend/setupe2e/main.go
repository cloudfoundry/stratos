package setupe2e

import (
	"errors"
	"net/http"

	"github.com/SUSE/stratos-ui/repository/interfaces"
	"github.com/labstack/echo"
)

type SetupE2EHelper struct {
	portalProxy interfaces.PortalProxy
}

func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &SetupE2EHelper{portalProxy: portalProxy}, nil
}

func (e2e *SetupE2EHelper) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")

}

func (e2e *SetupE2EHelper) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented!")
}

func (e2e *SetupE2EHelper) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return e2e, nil
}

func (e2e *SetupE2EHelper) AddAdminGroupRoutes(echoGroup *echo.Group) {
}

func (e2e *SetupE2EHelper) AddSessionGroupRoutes(echoGroup *echo.Group) {
	echoGroup.POST("/e2e-setup-endpoint", e2e.setupEndpoint)
	echoGroup.POST("/e2e-teardown-endpoint", e2e.tearDownEndpoint)
}

func (e2e *SetupE2EHelper) Init() error {
	return nil
}

func (e2e *SetupE2EHelper) setupEndpoint(c echo.Context) error {

	config := new(Config)
	if err := c.Bind(config); err != nil {
		e2e.setupEndpointForFixture(config.Endpoint, config.Fixture)
		return c.NoContent(http.StatusServiceUnavailable)
	}
	return c.NoContent(http.StatusBadRequest)
}

func (e2e *SetupE2EHelper) tearDownEndpoint(c echo.Context) error {
	config := new(Config)
	if err := c.Bind(config); err != nil {
		e2e.tearDownEndpointForFixture(config.Endpoint, config.Fixture)
		return c.NoContent(http.StatusServiceUnavailable)
	}
	return c.NoContent(http.StatusBadRequest)
}

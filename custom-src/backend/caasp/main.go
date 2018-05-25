package caasp

import (
	"errors"
	"fmt"
	"github.com/SUSE/stratos-ui/config"
	"github.com/SUSE/stratos-ui/repository/interfaces"
	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
	"io/ioutil"
	"net/http"
	"net/url"
	"regexp"
)

type CaaspSpecification struct {
	portalProxy  interfaces.PortalProxy
	endpointType string
}

const (
	EndpointType  = "caasp"
	CLIENT_ID_KEY = "CAASP_CLIENT"
)

func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &CaaspSpecification{portalProxy: portalProxy, endpointType: EndpointType}, nil
}

func (m *CaaspSpecification) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return m, nil
}

func (m *CaaspSpecification) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return m, nil
}

func (m *CaaspSpecification) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")
}

// Caasp endpoint - admin
func (m *CaaspSpecification) AddAdminGroupRoutes(echoContext *echo.Group) {
	echoContext.GET("/caasp/:cnsiGuid/info", m.getCaaspMetadata)
	echoContext.GET("/caasp/:cnsiGuid/kubeConfig", m.getCaaspKubeConfig)
}

// Metrics API endpoints - non-admin
func (m *CaaspSpecification) AddSessionGroupRoutes(echoContext *echo.Group) {
}

func (m *CaaspSpecification) GetType() string {
	return EndpointType
}

func (m *CaaspSpecification) GetClientId() string {
	if clientId, err := config.GetValue(CLIENT_ID_KEY); err == nil {
		return clientId
	}

	return "caasp"
}

func (m *CaaspSpecification) Register(echoContext echo.Context) error {
	return m.portalProxy.RegisterEndpoint(echoContext, m.Info)
}

func (m *CaaspSpecification) Connect(ec echo.Context, cnsiRecord interfaces.CNSIRecord, userId string) (*interfaces.TokenRecord, bool, error) {
	log.Debug("Caasp Connect...")

	connectType := ec.FormValue("connect_type")
	if connectType != interfaces.AuthConnectTypeCreds {
		return nil, false, errors.New("Only username/password is accepted for CaaSP endpoints")
	}

	username := ec.FormValue("username")
	password := ec.FormValue("password")

	if len(username) == 0 || len(password) == 0 {
		return nil, false, errors.New("Need username and password")
	}

	tr := &interfaces.TokenRecord{
		AuthType:     interfaces.AuthTypeHttpBasic,
		AuthToken:    username,
		RefreshToken: password,
	}

	// TODO: We should actually try to login and get the tokens that we need
	return tr, false, nil
}

func (m *CaaspSpecification) Init() error {
	return nil
}

func (m *CaaspSpecification) Info(apiEndpoint string, skipSSLValidation bool) (interfaces.CNSIRecord, interface{}, error) {
	log.Debug("Caasp Info")
	var v2InfoResponse interfaces.V2Info
	var newCNSI interfaces.CNSIRecord

	newCNSI.CNSIType = EndpointType

	_, err := url.Parse(apiEndpoint)
	if err != nil {
		return newCNSI, nil, err
	}

	req, err := http.NewRequest("GET", apiEndpoint, nil)
	if err != nil {
		msg := "Failed to create request for the Caasp Endpoint: %v"
		log.Errorf(msg, err)
		return newCNSI, nil, fmt.Errorf(msg, err)
	}

	var h = m.portalProxy.GetHttpClient(skipSSLValidation)
	res, err := h.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return newCNSI, nil, interfaces.LogHTTPError(res, err)
	}

	// Should be an HTML page
	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)
	log.Info(string(body))

	tokenRegex := "<title>SUSE CaaS Platform: Velum</title>"
	re, err := regexp.Compile(tokenRegex)
	if err != nil {
		return newCNSI, nil, errors.New("Can not compile regex")
	}

	reres := re.FindStringSubmatch(string(body))
	if len(reres) == 0 {
		return newCNSI, nil, errors.New("Does not appear to be a CaaSP Admin endpoint")
	}

	newCNSI.TokenEndpoint = apiEndpoint
	newCNSI.AuthorizationEndpoint = apiEndpoint

	return newCNSI, v2InfoResponse, nil
}

func (m *CaaspSpecification) UpdateMetadata(info *interfaces.Info, userGUID string, echoContext echo.Context) {
}

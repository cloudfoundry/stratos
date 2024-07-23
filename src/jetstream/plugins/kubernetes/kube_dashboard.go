package kubernetes

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	"k8s.io/client-go/rest"

	"github.com/cloudfoundry-community/stratos/src/jetstream/api"
	"github.com/cloudfoundry-community/stratos/src/jetstream/plugins/kubernetes/dashboard"
)

// Get the config for the endpoint
func (k *KubernetesSpecification) getConfig(cnsiRecord *api.CNSIRecord, tokenRecord *api.TokenRecord) (*rest.Config, error) {
	masterURL := cnsiRecord.APIEndpoint.String()
	return k.GetConfigForEndpoint(masterURL, *tokenRecord)
}

// Proxy the request
func (k *KubernetesSpecification) kubeDashboardProxy(c echo.Context) error {
	log.Debug("kubeDashboardTest request")
	var p = k.portalProxy

	cnsiGUID := c.Param("guid")
	userGUID := c.Get("user_id").(string)

	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		// TODO: Use sendError
		return errors.New("Could not get endpoint information")
	}

	// Get token for this users
	tokenRec, ok := p.GetCNSITokenRecord(cnsiGUID, userGUID)
	if !ok {
		// TODO: Use sendError
		return errors.New("Could not get token")
	}

	config, err := k.getConfig(&cnsiRecord, &tokenRec)
	if err != nil {
		// TODO: Use sendError
		return errors.New("Could not get config for this auth type")
	}

	return dashboard.KubeDashboardProxy(c, p, config)
}

// Determine if the specified Kube endpoint has the dashboard installed and ready
func (k *KubernetesSpecification) kubeDashboardStatus(c echo.Context) error {
	var p = k.portalProxy
	endpointGUID := c.Param("guid")
	userGUID := c.Get("user_id").(string)

	// Don't need the token if we're just checking status
	status, _ := dashboard.KubeDashboardStatus(p, endpointGUID, userGUID, false)
	jsonString, err := json.Marshal(status)
	if err != nil {
		return api.NewHTTPShadowError(
			http.StatusBadRequest,
			"Could not Kubernetes Dashboard status",
			"Could not Kubernetes Dashboard status")
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

// Login to the kubernetes dashboard and then redirect to the UI
func (k *KubernetesSpecification) kubeDashboardLogin(c echo.Context) error {
	var p = k.portalProxy
	err := dashboard.KubeDashboardLogin(c, p)
	return err
}

// Creates service account for dashboard access
func (k *KubernetesSpecification) kubeDashboardCreateServiceAccount(c echo.Context) error {
	var p = k.portalProxy
	endpointGUID := c.Param("guid")
	userGUID := c.Get("user_id").(string)

	err := dashboard.CreateServiceAccount(p, endpointGUID, userGUID)
	if err != nil {
		return api.NewHTTPShadowError(http.StatusInternalServerError, err.Error(), err.Error())
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write([]byte("{ \"created\": true }"))
	return nil
}

// Delete service account used for Dashboard access
func (k *KubernetesSpecification) kubeDashboardDeleteServiceAccount(c echo.Context) error {
	var p = k.portalProxy
	endpointGUID := c.Param("guid")
	userGUID := c.Get("user_id").(string)

	err := dashboard.DeleteServiceAccount(p, endpointGUID, userGUID)
	if err != nil {
		return api.NewHTTPShadowError(http.StatusInternalServerError, err.Error(), err.Error())
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write([]byte("{ \"deleted\": true }"))
	return nil
}

// Install dashboard in a cluster
func (k *KubernetesSpecification) kubeDashboardInstallDashboard(c echo.Context) error {
	var p = k.portalProxy
	endpointGUID := c.Param("guid")
	userGUID := c.Get("user_id").(string)

	err := dashboard.InstallDashboard(p, endpointGUID, userGUID)
	if err != nil {
		return api.NewHTTPShadowError(http.StatusInternalServerError, err.Error(), err.Error())
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write([]byte("{ \"installation\": true }"))
	return nil
}

// Delete dashboard in a cluster
func (k *KubernetesSpecification) kubeDashboardDeleteDashboard(c echo.Context) error {
	var p = k.portalProxy
	endpointGUID := c.Param("guid")
	userGUID := c.Get("user_id").(string)

	err := dashboard.DeleteDashboard(p, endpointGUID, userGUID)
	if err != nil {
		return api.NewHTTPShadowError(http.StatusInternalServerError, err.Error(), err.Error())
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write([]byte("{ \"deleted\": true }"))
	return nil
}

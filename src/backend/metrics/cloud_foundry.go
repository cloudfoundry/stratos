package metrics

import (
	"net/http"
	"net/url"

	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
)

// Metrics endpoints - non-admin - for a Cloud Foundry Application
func (m *MetricsSpecification) getCloudFoundryAppMetrics(c echo.Context) error {

	// We need to go and fetch the CF App, to make sure that the user is permitted to access it

	// We'll do this synchronously here for now - this can be done optimistically in parallel in t he future

	// Use the passthrough mechanism to get the App metadata from Cloud Foundry
	appID := c.Param("appId")
	appUrl, _ := url.Parse("/v2/apps/" + appID)
	responses, err := m.portalProxy.ProxyRequest(c, appUrl)
	if err != nil {
		return err
	}

	// Now make the metrics requests to the appropriate metrics endpoint

	var cnsiList []string
	for k, v := range responses {
		log.Info(k)
		// Check Status Code was ok
		if v.StatusCode < 400 {
			cnsiList = append(cnsiList, k)
			log.Info(string(v.Response))
		}
	}

	// cnsList should be filtered to only those apps that the user has permission to access

	return m.portalProxy.SendProxiedResponse(c, responses)
}

// Metrics API endpoints - admin - for a Cloud Foundry deployment
func (m *MetricsSpecification) getCloudFoundryMetrics(c echo.Context) error {
	return echo.NewHTTPError(http.StatusOK, "Not implemented ... yet")
}

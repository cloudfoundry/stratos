package metrics

import (
	"errors"
	"strings"

	log "github.com/sirupsen/logrus"

	"github.com/labstack/echo/v4"
)

// Metrics API endpoints - admin - for a Containers
func (m *MetricsSpecification) getPodMetrics(c echo.Context) error {

	prometheusOp := c.Param("op")
	// podId := c.Param("podId")
	cnsiList := strings.Split(c.Request().Header.Get("x-cap-cnsi-list"), ",")

	// get the user
	userGUID, err := m.portalProxy.GetSessionStringValue(c, "user_id")
	if err != nil {
		return errors.New("Could not find session user_id")
	}

	// For each CNSI, find the metrics endpoint that we need to talk to
	metrics, err2 := m.getMetricsEndpoints(userGUID, cnsiList)
	if err2 != nil {
		log.Error("Error getting metrics ", err2)

		return errors.New("Can not get metric endpoint metadata")
	}

	// Construct the metadata for proxying
	requests := makePrometheusRequestInfos(c, userGUID, metrics, prometheusOp, "", false)
	responses, err := m.portalProxy.DoProxyRequest(requests)
	return m.portalProxy.SendProxiedResponse(c, responses)
}

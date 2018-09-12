package metrics

import (
	"errors"
	"strings"

	log "github.com/sirupsen/logrus"

	"github.com/labstack/echo"
)

// Metrics API endpoints - admin - for a Containers
func (m *MetricsSpecification) getPodMetrics(c echo.Context) error {

	log.Debug("###########In getPodMetrics!")
	prometheusOp := c.Param("op")
	log.Debugf("############op: %s", prometheusOp)
	// podId := c.Param("podId")
	cnsiList := strings.Split(c.Request().Header().Get("x-cap-cnsi-list"), ",")
	log.Debugf("#########CNSI: %+v", cnsiList)

	// get the user
	userGUID, err := m.portalProxy.GetSessionStringValue(c, "user_id")
	if err != nil {
		return errors.New("Could not find session user_id")
	}
	log.Debugf("##########userGUID: %+v", userGUID)

	// For each CNSI, find the metrics endpoint that we need to talk to
	metrics, err2 := m.getMetricsEndpoints(userGUID, cnsiList)
	if err2 != nil {
		log.Error("Error getting metrics", err2)

		return errors.New("Can not get metric endpoint metadata")
	}

	// Construct the metadata for proxying
	requests := makePrometheusRequestInfos(c, userGUID, metrics, prometheusOp, "", false)
	responses, err := m.portalProxy.DoProxyRequest(requests)
	return m.portalProxy.SendProxiedResponse(c, responses)
}

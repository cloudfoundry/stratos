package metrics

import (
	"errors"
	"net/url"
	"strings"

	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

var (
	cellQueryWhiteList = []string{
		"firehose_value_metric_rep_unhealthy_cell",
		"firehose_value_metric_rep_capacity_remaining_containers",
		"firehose_value_metric_rep_capacity_remaining_disk",
		"firehose_value_metric_rep_capacity_remaining_memory",
		"firehose_value_metric_rep_capacity_total_containers",
		"firehose_value_metric_rep_capacity_total_disk",
		"firehose_value_metric_rep_capacity_total_memory",
		"firehose_value_metric_rep_num_cpus",
	}
)

// Metrics endpoints - non-admin - for a Cloud Foundry Application
func (m *MetricsSpecification) getCloudFoundryAppMetrics(c echo.Context) error {

	// We need to go and fetch the CF App, to make sure that the user is permitted to access it

	// We'll do this synchronously here for now - this can be done optimistically in parallel in the future

	// Use the passthrough mechanism to get the App metadata from Cloud Foundry
	appID := c.Param("appId")
	prometheusOp := c.Param("op")
	appURL, _ := url.Parse("/v2/apps/" + appID)
	responses, err := m.portalProxy.ProxyRequest(c, appURL)
	if err != nil {
		return err
	}

	// For an application, we only support the query operation
	if prometheusOp != "query" && prometheusOp != "query_range" {
		return errors.New("Only 'query' or 'query_range' is supported for a Cloud Foundry application")
	}

	// Now make the metrics requests to the appropriate metrics endpoint
	var cnsiList []string
	for k, v := range responses {
		// Check Status Code was ok
		if v.StatusCode < 400 {
			cnsiList = append(cnsiList, k)
		}
	}

	return m.makePrometheusRequest(c, cnsiList, "application_id=\""+appID+"\"")
}

func makePrometheusRequestInfos(c echo.Context, userGUID string, metrics map[string]EndpointMetricsRelation, prometheusOp string, queries string) []interfaces.ProxyRequestInfo {
	// Construct the metadata for proxying
	requests := make([]interfaces.ProxyRequestInfo, 0)
	for _, metric := range metrics {
		req := interfaces.ProxyRequestInfo{}
		req.UserGUID = userGUID
		req.ResultGUID = metric.endpoint.GUID
		req.EndpointGUID = metric.metrics.EndpointGUID
		req.Method = c.Request().Method()

		addQueries := queries
		if len(addQueries) > 0 {
			addQueries = addQueries + ","
		}
		addQueries = addQueries + "job=\"" + metric.metrics.Job + "\""

		req.URI = makePrometheusRequestURI(c, prometheusOp, addQueries)
		requests = append(requests, req)
	}
	return requests
}

func makePrometheusRequestURI(c echo.Context, prometheusOp string, modify string) *url.URL {
	uri := getEchoURL(c)
	uri.Path = "/api/v1/" + prometheusOp
	values := uri.Query()
	query := values.Get("query")
	if len(query) > 0 {
		parts := strings.SplitAfter(query, "{")
		if len(parts) <= 2 {
			modified := parts[0]
			if len(parts) == 1 {
				modified = modified + "{" + modify + "}"
			} else {
				end := parts[1]
				if end != "}" && len(modify) > 0 {
					end = "," + end
				}
				modified = modified + modify + end
			}
			values.Set("query", modified)
		}
	}
	uri.RawQuery = values.Encode()
	return &uri
}

func getEchoURL(c echo.Context) url.URL {
	u := c.Request().URL().(*standard.URL).URL
	return *u
}

// Metrics API endpoints - admin - for a Cloud Foundry deployment
func (m *MetricsSpecification) getCloudFoundryMetrics(c echo.Context) error {
	cnsiList := strings.Split(c.Request().Header().Get("x-cap-cnsi-list"), ",")

	return m.makePrometheusRequest(c, cnsiList, "")
}

func (m *MetricsSpecification) makePrometheusRequest(c echo.Context, cnsiList []string, queries string) error {
	prometheusOp := c.Param("op")

	// get the user
	userGUID, err := m.portalProxy.GetSessionStringValue(c, "user_id")
	if err != nil {
		return errors.New("Could not find session user_id")
	}

	// For each CNSI, find the metrics endpoint that we need to talk to
	metrics, err2 := m.getMetricsEndpoints(userGUID, cnsiList)
	if err2 != nil {
		return errors.New("Can not get metric endpoint metadata")
	}

	// Construct the metadata for proxying
	requests := makePrometheusRequestInfos(c, userGUID, metrics, prometheusOp, queries)
	responses, err := m.portalProxy.DoProxyRequest(requests)
	return m.portalProxy.SendProxiedResponse(c, responses)
}

func isAllowedCellMetricsQuery(query string) bool {
	for _, whiteListQuery := range cellQueryWhiteList {
		if strings.Index(query, whiteListQuery) == 0 {
			return true
		}
	}
	return false
}

// Metrics endpoints - cells - with white list of cell prometheus query values
func (m *MetricsSpecification) getCloudFoundryCellMetrics(c echo.Context) error {

	uri := getEchoURL(c)
	values := uri.Query()
	query := values.Get("query")

	// Fail all queries that are not of type 'cell'
	if !isAllowedCellMetricsQuery(query) {
		return errors.New("Unsupported prometheus query")
	}

	cnsiList := strings.Split(c.Request().Header().Get("x-cap-cnsi-list"), ",")

	return m.makePrometheusRequest(c, cnsiList, "")
}

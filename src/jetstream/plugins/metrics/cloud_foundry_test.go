package metrics

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

const (
	testUserGUID    = "user-1"
	testCFGUID      = "cf-1"
	testMetricsGUID = "metrics-1"
	testDoppler     = "wss://doppler.example.com:443"
	testJob         = "cf-job"
)

// metricsTestProxy satisfies api.PortalProxy by embedding the interface.
// Only the methods the metrics route handlers call are implemented; any
// other call panics, which fails a test that reaches further than expected.
type metricsTestProxy struct {
	api.PortalProxy
	proxied []api.ProxyRequestInfo
}

func (p *metricsTestProxy) GetSessionStringValue(_ *echo.Context, _ string) (string, error) {
	return testUserGUID, nil
}

func (p *metricsTestProxy) ListEndpointsByUser(userGUID string) ([]*api.ConnectedEndpoint, error) {
	if userGUID != testUserGUID {
		return nil, nil
	}
	apiURL, _ := url.Parse("https://api.example.com")
	metricsURL, _ := url.Parse("https://metrics.example.com")
	return []*api.ConnectedEndpoint{
		{
			GUID:                   testCFGUID,
			CNSIType:               "cf",
			APIEndpoint:            apiURL,
			DopplerLoggingEndpoint: testDoppler,
		},
		{
			GUID:          testMetricsGUID,
			CNSIType:      EndpointType,
			APIEndpoint:   metricsURL,
			TokenMetadata: `[{"type":"cf","url":"` + testDoppler + `","job":"` + testJob + `"}]`,
		},
	}, nil
}

func (p *metricsTestProxy) DoProxyRequest(requests []api.ProxyRequestInfo) (map[string]*api.CNSIRequest, error) {
	p.proxied = append(p.proxied, requests...)
	return map[string]*api.CNSIRequest{}, nil
}

func (p *metricsTestProxy) SendProxiedResponse(_ *echo.Context, _ map[string]*api.CNSIRequest) error {
	return nil
}

// newMetricsContext builds an echo context for a metrics route with the
// given path parameters and prometheus query.
func newMetricsContext(query string, params echo.PathValues) *echo.Context {
	target := "/pp/v1/metrics/cf?" + url.Values{"query": {query}}.Encode()
	req := httptest.NewRequest(http.MethodGet, target, nil)
	req.Header.Set("x-cap-cnsi-list", testCFGUID)
	c := echo.New().NewContext(req, httptest.NewRecorder())
	c.SetPathValues(params)
	return c
}

// The cell pages send these query shapes to /pp/v1/metrics/cf/cells:
// a bare health metric name (cf-cells-signal-config.service.ts) and a
// metric name with a bosh_job_id selector (cloud-foundry-cell.service.ts,
// cf-cell-health-signal-config.service.ts).
func TestCellQueryAcceptsFrontendShapes(t *testing.T) {
	t.Parallel()

	for _, metric := range cellQueryAllowList {
		assert.True(t, isAllowedCellMetricsQuery(metric), "bare %s", metric)
		for _, cellID := range []string{"0", "cell_z1-0", "7a1c0e0b-6d4f-4e1a-9b9e-2c6f2b0d1e3a", "diego.cell.0"} {
			query := metric + `{bosh_job_id="` + cellID + `"}`
			assert.True(t, isAllowedCellMetricsQuery(query), "%s", query)
		}
	}
}

func TestCellQueryRejectsOtherShapes(t *testing.T) {
	t.Parallel()

	const allowed = "firehose_value_metric_rep_num_cpus"
	rejected := []string{
		"",
		"up",
		allowed + " or up",
		allowed + `{bosh_job_id="x"} or up`,
		allowed + `{bosh_job_id="x"} or up{job="y"}`,
		allowed + `{bosh_job_id="x",job="y"}`,
		allowed + `{job="y",bosh_job_id="x"}`,
		allowed + `{bosh_job_id=~".*"}`,
		allowed + `{bosh_job_id!="x"}`,
		allowed + `{bosh_job_id=""}`,
		allowed + `{bosh_job_id="x\"} or up{a=\""}`,
		allowed + `{bosh_job_id="x y"}`,
		allowed + `{__name__="up"}`,
		allowed + `{}`,
		allowed + `{ bosh_job_id="x"}`,
		allowed + `{bosh_job_id="x"} `,
		allowed + "{bosh_job_id=\"x\"}\n",
		allowed + " ",
		" " + allowed,
		allowed + "\n",
		allowed + "_total",
		allowed + "[5m]",
		allowed + `{bosh_job_id="x"}[5m]`,
		allowed + " offset 1h",
		allowed + `{bosh_job_id="x"} @ 0`,
		"sum(" + allowed + ")",
		"absent(" + allowed + ")",
		allowed + " + 1",
		allowed + "/up",
		// The cell App Instances placements query belongs on the CF admin
		// route, not on the cells route.
		`firehose_container_metric_cpu_percentage{bosh_job_id="x"}`,
	}
	for _, query := range rejected {
		assert.False(t, isAllowedCellMetricsQuery(query), "%q", query)
	}
}

func TestCellMetricsForwardsOnlyAllowedRequests(t *testing.T) {
	t.Parallel()

	const allowed = "firehose_value_metric_rep_num_cpus"
	cellQuery := allowed + `{bosh_job_id="cell-1"}`

	t.Run("allowed query is forwarded with the job label", func(t *testing.T) {
		t.Parallel()
		proxy := &metricsTestProxy{}
		m := &MetricsSpecification{portalProxy: proxy}
		c := newMetricsContext(cellQuery, echo.PathValues{{Name: "op", Value: "query"}})

		require.NoError(t, m.getCloudFoundryCellMetrics(c))
		require.Len(t, proxy.proxied, 1)
		assert.Equal(t, "/api/v1/query", proxy.proxied[0].URI.Path)
		assert.Equal(t, allowed+`{job="`+testJob+`",bosh_job_id="cell-1"}`,
			proxy.proxied[0].URI.Query().Get("query"))
	})

	t.Run("query_range is forwarded", func(t *testing.T) {
		t.Parallel()
		proxy := &metricsTestProxy{}
		m := &MetricsSpecification{portalProxy: proxy}
		c := newMetricsContext(cellQuery, echo.PathValues{{Name: "op", Value: "query_range"}})

		require.NoError(t, m.getCloudFoundryCellMetrics(c))
		require.Len(t, proxy.proxied, 1)
		assert.Equal(t, "/api/v1/query_range", proxy.proxied[0].URI.Path)
	})

	t.Run("query that escapes the allow list is not forwarded", func(t *testing.T) {
		t.Parallel()
		proxy := &metricsTestProxy{}
		m := &MetricsSpecification{portalProxy: proxy}
		c := newMetricsContext(allowed+" or up", echo.PathValues{{Name: "op", Value: "query"}})

		require.Error(t, m.getCloudFoundryCellMetrics(c))
		assert.Empty(t, proxy.proxied)
	})

	for _, op := range []string{"series", "labels", "label", "targets", "status"} {
		t.Run("op "+op+" is not forwarded", func(t *testing.T) {
			t.Parallel()
			proxy := &metricsTestProxy{}
			m := &MetricsSpecification{portalProxy: proxy}
			c := newMetricsContext(cellQuery, echo.PathValues{{Name: "op", Value: op}})

			require.Error(t, m.getCloudFoundryCellMetrics(c))
			assert.Empty(t, proxy.proxied)
		})
	}
}

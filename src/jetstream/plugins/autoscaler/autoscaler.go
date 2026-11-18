package autoscaler

import (
	"net/http"
	"net/url"

	"github.com/labstack/echo/v5"
)

func passErr(err error) error { return err }

// getAutoscalerInfo and getAutoscalerHealth take ?app=<guid> to reach the
// app's registered autoscaler; without it they use today's address.
func (a *Autoscaler) getAutoscalerInfo(c *echo.Context) error {
	return a.forward(c, c.QueryParam("app"), http.MethodGet, "/v1/info", func(error) error {
		// 404 lets the frontend treat a missing autoscaler gracefully.
		return echo.NewHTTPError(http.StatusNotFound, "Autoscaler not available")
	})
}

func (a *Autoscaler) getAutoscalerHealth(c *echo.Context) error {
	return a.forward(c, c.QueryParam("app"), http.MethodGet, "/health", func(error) error {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "Autoscaler health check failed")
	})
}

func (a *Autoscaler) getAutoscalerPolicy(c *echo.Context) error {
	appID := c.Param("appId")
	return a.forward(c, appID, http.MethodGet, "/v1/apps/"+appID+"/policy", passErr)
}

func (a *Autoscaler) attachAutoscalerPolicy(c *echo.Context) error {
	appID := c.Param("appId")
	return a.forward(c, appID, http.MethodPut, "/v1/apps/"+appID+"/policy", passErr)
}

func (a *Autoscaler) detachAutoscalerPolicy(c *echo.Context) error {
	appID := c.Param("appId")
	return a.forward(c, appID, http.MethodDelete, "/v1/apps/"+appID+"/policy", passErr)
}

func (a *Autoscaler) getAutoscalerMetric(c *echo.Context) error {
	appID := c.Param("appId")
	path := "/v1/apps/" + appID + "/aggregated_metric_histories/" + c.Param("metricType") + historyQuery(c.QueryParams())
	return a.forward(c, appID, http.MethodGet, path, passErr)
}

func (a *Autoscaler) getAutoscalerEvent(c *echo.Context) error {
	appID := c.Param("appId")
	path := "/v1/apps/" + appID + "/scaling_histories" + historyQuery(c.QueryParams())
	return a.forward(c, appID, http.MethodGet, path, passErr)
}

// historyQuery builds the query for the autoscaler's history endpoints from
// the request's. Only parameters the caller sent are forwarded: the
// autoscaler rejects an empty value.
func historyQuery(in url.Values) string {
	out := url.Values{}
	for _, key := range []string{"start-time", "end-time", "page", "results-per-page", "order-direction", "order"} {
		if v := in.Get(key); v != "" {
			out.Set(key, v)
		}
	}
	if len(out) == 0 {
		return ""
	}
	return "?" + out.Encode()
}

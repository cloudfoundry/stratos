package autoscaler

import (
	"net/url"

	"github.com/labstack/echo/v5"
)

func (a *Autoscaler) getAutoscalerInfo(echoContext *echo.Context) error {
	healthURL, _ := url.Parse("/v1/info")
	responses, err := a.portalProxy.ProxyRequest(echoContext, healthURL)
	if err != nil {
		// Return 404 if autoscaler URL is not configured or cannot be reached
		// This allows frontend to gracefully handle missing autoscaler
		return echo.NewHTTPError(404, "Autoscaler not available")
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

func (a *Autoscaler) getAutoscalerHealth(echoContext *echo.Context) error {
	healthURL, _ := url.Parse("/health")
	responses, err := a.portalProxy.ProxyRequest(echoContext, healthURL)
	if err != nil {
		// Return 503 if autoscaler health check fails
		return echo.NewHTTPError(503, "Autoscaler health check failed")
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

func (a *Autoscaler) getAutoscalerPolicy(echoContext *echo.Context) error {
	appID := echoContext.Param("appId")
	policyURL, _ := url.Parse("/v1/apps/" + appID + "/policy")
	responses, err := a.portalProxy.ProxyRequest(echoContext, policyURL)
	if err != nil {
		// Return appropriate error - could be 404 (no policy) or connection error
		return err
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

func (a *Autoscaler) attachAutoscalerPolicy(echoContext *echo.Context) error {
	appID := echoContext.Param("appId")
	policyURL, _ := url.Parse("/v1/apps/" + appID + "/policy")
	responses, err := a.portalProxy.ProxyRequest(echoContext, policyURL)
	if err != nil {
		return err
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

func (a *Autoscaler) detachAutoscalerPolicy(echoContext *echo.Context) error {
	appID := echoContext.Param("appId")
	policyURL, _ := url.Parse("/v1/apps/" + appID + "/policy")
	responses, err := a.portalProxy.ProxyRequest(echoContext, policyURL)
	if err != nil {
		return err
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

func (a *Autoscaler) getAutoscalerMetric(echoContext *echo.Context) error {
	appID := echoContext.Param("appId")
	metricType := echoContext.Param("metricType")
	queryURL := historyQuery(echoContext.QueryParams())
	metricURL, _ := url.Parse("/v1/apps/" + appID + "/aggregated_metric_histories/" + metricType + queryURL)
	responses, err := a.portalProxy.ProxyRequest(echoContext, metricURL)
	if err != nil {
		return err
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

func (a *Autoscaler) getAutoscalerEvent(echoContext *echo.Context) error {
	appID := echoContext.Param("appId")
	queryURL := historyQuery(echoContext.QueryParams())
	eventURL, _ := url.Parse("/v1/apps/" + appID + "/scaling_histories" + queryURL)
	responses, err := a.portalProxy.ProxyRequest(echoContext, eventURL)
	if err != nil {
		return err
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

func (a *Autoscaler) createAutoscalerCredential(echoContext *echo.Context) error {
	appID := echoContext.Param("appId")
	credentialURL, _ := url.Parse("/v1/apps/" + appID + "/credential")
	responses, err := a.portalProxy.ProxyRequest(echoContext, credentialURL)
	if err != nil {
		return err
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

func (a *Autoscaler) deleteAutoscalerCredential(echoContext *echo.Context) error {
	appID := echoContext.Param("appId")
	credentialURL, _ := url.Parse("/v1/apps/" + appID + "/credential")
	responses, err := a.portalProxy.ProxyRequest(echoContext, credentialURL)
	if err != nil {
		return err
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
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

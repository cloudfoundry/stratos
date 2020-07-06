package autoscaler

import (
	"fmt"
	"net/url"

	"github.com/labstack/echo"
)

func (a *Autoscaler) getAutoscalerInfo(echoContext echo.Context) error {
	healthURL, _ := url.Parse("/v1/info")
	responses, err := a.portalProxy.ProxyRequest(echoContext, healthURL)
	if err != nil {
		return err
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

func (a *Autoscaler) getAutoscalerHealth(echoContext echo.Context) error {
	healthURL, _ := url.Parse("/health")
	responses, err := a.portalProxy.ProxyRequest(echoContext, healthURL)
	if err != nil {
		return err
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

func (a *Autoscaler) getAutoscalerPolicy(echoContext echo.Context) error {
	appID := echoContext.Param("appId")
	policyURL, _ := url.Parse("/v1/apps/" + appID + "/policy")
	responses, err := a.portalProxy.ProxyRequest(echoContext, policyURL)
	if err != nil {
		return err
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

func (a *Autoscaler) attachAutoscalerPolicy(echoContext echo.Context) error {
	appID := echoContext.Param("appId")
	policyURL, _ := url.Parse("/v1/apps/" + appID + "/policy")
	responses, err := a.portalProxy.ProxyRequest(echoContext, policyURL)
	if err != nil {
		return err
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

func (a *Autoscaler) detachAutoscalerPolicy(echoContext echo.Context) error {
	appID := echoContext.Param("appId")
	policyURL, _ := url.Parse("/v1/apps/" + appID + "/policy")
	responses, err := a.portalProxy.ProxyRequest(echoContext, policyURL)
	if err != nil {
		return err
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

func (a *Autoscaler) getAutoscalerMetric(echoContext echo.Context) error {
	appID := echoContext.Param("appId")
	metricType := echoContext.Param("metricType")
	start := echoContext.QueryParam("start-time")
	end := echoContext.QueryParam("end-time")
	page := echoContext.QueryParam("page")
	perPage := echoContext.QueryParam("results-per-page")
	order := echoContext.QueryParam("order")
	queryURL := fmt.Sprintf("?start-time=%s&end-time=%s&page=%s&results-per-page=%s&order=%s", start, end, page, perPage, order)
	metricURL, _ := url.Parse("/v1/apps/" + appID + "/aggregated_metric_histories/" + metricType + queryURL)
	responses, err := a.portalProxy.ProxyRequest(echoContext, metricURL)
	if err != nil {
		return err
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

func (a *Autoscaler) getAutoscalerEvent(echoContext echo.Context) error {
	appID := echoContext.Param("appId")
	start := echoContext.QueryParam("start-time")
	end := echoContext.QueryParam("end-time")
	page := echoContext.QueryParam("page")
	perPage := echoContext.QueryParam("results-per-page")
	order := echoContext.QueryParam("order")
	queryURL := fmt.Sprintf("?start-time=%s&end-time=%s&page=%s&results-per-page=%s&order=%s", start, end, page, perPage, order)
	eventURL, _ := url.Parse("/v1/apps/" + appID + "/scaling_histories" + queryURL)
	responses, err := a.portalProxy.ProxyRequest(echoContext, eventURL)
	if err != nil {
		return err
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

func (a *Autoscaler) createAutoscalerCredential(echoContext echo.Context) error {
	appID := echoContext.Param("appId")
	credentialURL, _ := url.Parse("/v1/apps/" + appID + "/credential")
	responses, err := a.portalProxy.ProxyRequest(echoContext, credentialURL)
	if err != nil {
		return err
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

func (a *Autoscaler) deleteAutoscalerCredential(echoContext echo.Context) error {
	appID := echoContext.Param("appId")
	credentialURL, _ := url.Parse("/v1/apps/" + appID + "/credential")
	responses, err := a.portalProxy.ProxyRequest(echoContext, credentialURL)
	if err != nil {
		return err
	}
	return a.portalProxy.SendProxiedResponse(echoContext, responses)
}

package dashboard

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
)

type loginResponse struct {
	Token string `json:"token"`
}

type loginOKResponse struct {
	JWEToken string `json:"jweToken"`
}

// KubeDashboardLogin will check and log into the Kubernetes Dashboard then redirect to the Dashboard UI
func KubeDashboardLogin(c echo.Context, p api.PortalProxy) error {
	log.Debug("kubeDashboardLogin request")

	endpointGUID := c.Param("guid")
	userGUID := c.Get("user_id").(string)

	// Get the dashboard status
	status, _ := KubeDashboardStatus(p, endpointGUID, userGUID, true)
	if status.Service == nil {
		return sendErrorPage(c, "Kubernetes Dashboard is not installed")
	}

	// Check that we have a token
	if len(status.Token) == 0 {
		return sendErrorPage(c, "Kubernetes Dashboard is not confiured - could not find Service Account Token")
	}

	// Now we need to log the user in
	svc := status.Service
	target := fmt.Sprintf("/api/v1/namespaces/%s/services/%s:%s:/proxy/api/v1/csrftoken/login", svc.Namespace, svc.Scheme, svc.ServiceName)
	response, err := p.DoProxySingleRequest(endpointGUID, userGUID, "GET", target, nil, nil)
	if err != nil || response.StatusCode != 200 {
		return sendErrorPage(c, "Unable to login to Kubernetes Dashboard")
	}

	// Get the csrf token
	token := &loginResponse{}
	if err := json.Unmarshal(response.Response, token); err != nil {
		return sendErrorPage(c, "Failed to login to Kubernetes Dashboard - invalid login response")
	}

	// Login
	login := loginResponse{
		Token: status.Token,
	}
	body, err := json.Marshal(login)
	if err != nil {
		return sendErrorPage(c, "Failed to set auth token for Kubernetes Dashboard")
	}

	target = fmt.Sprintf("/api/v1/namespaces/%s/services/%s:%s:/proxy/api/v1/login", svc.Namespace, svc.Scheme, svc.ServiceName)
	headers := make(http.Header)
	headers.Set("X-CSRF-TOKEN", token.Token)
	headers.Set("Content-Type", "application/json")

	response, err = p.DoProxySingleRequest(endpointGUID, userGUID, "POST", target, headers, body)
	if err != nil || response.StatusCode != 200 {
		return sendErrorPage(c, "Failed to login to Kubernetes Dashboard")
	}

	// Get the csrf token
	jweToken := &loginOKResponse{}
	if err := json.Unmarshal(response.Response, jweToken); err != nil {
		return sendErrorPage(c, "Failed to login to Kubernetes Dashboard - invalid login response")
	}

	session, err := p.GetSession(c)
	if err != nil {
		return sendErrorPage(c, "Failed to login to Kubernetes Dashboard - could not get Stratos Session")
	}

	// Need to cache the service information in the session to improve proxying performance
	sessionValues := make(map[string]string)
	sessionValues[kubeDashSessionEndpointID] = endpointGUID
	sessionValues[kubeDashSessionNamespace] = svc.Namespace
	sessionValues[kubeDashSessionScheme] = svc.Scheme
	sessionValues[kubeDashSessionServiceName] = svc.ServiceName
	sessionValues[kubeDashSessionToken] = url.QueryEscape(string(jweToken.JWEToken))

	err = p.GetSessionDataStore().SetValues(session.ID, kubeDashSessionGroup, sessionValues, false)
	if err != nil {
		return sendErrorPage(c, "Failed to login to Kubernetes Dashboard - could not save Stratos Session data")
	}

	// Redirect to the kube dashboard proxy
	redirectURL := fmt.Sprintf("/pp/v1/apps/kubedash/ui/%s/", endpointGUID)
	return c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

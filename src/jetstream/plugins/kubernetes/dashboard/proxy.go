package dashboard

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	utilnet "k8s.io/apimachinery/pkg/util/net"
	"k8s.io/client-go/rest"
)

// KubeDashboardProxy proxies a request to the Kube Dash service using the K8S API
func KubeDashboardProxy(c echo.Context, p api.PortalProxy, config *rest.Config) error {
	log.Debugf("KubeDashboardProxy request for: %s", c.Request().RequestURI)

	cnsiGUID := c.Param("guid")
	prefix := "/pp/v1/apps/kubedash/ui/" + cnsiGUID + "/"
	path := c.Request().RequestURI[len(prefix):]

	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return sendErrorPage(c, "Failed to access Kubernetes Dashboard - could not find endpoint")
	}

	session, err := p.GetSession(c)
	if err != nil {
		return sendErrorPage(c, "Failed to access Kubernetes Dashboard - could not get Stratos Session")
	}

	var kubeDashEndpointID = ""
	var token = ""
	svc := ServiceInfo{}

	sessionData, err := p.GetSessionDataStore().GetValues(session.ID, kubeDashSessionGroup)
	if err != nil {
		return sendErrorPage(c, "Failed to access to Kubernetes Dashboard - could not get Stratos Session data")
	}

	// We have to have cached the data we need via the /login endpoint
	var errors = 0
	var ok bool

	if kubeDashEndpointID, ok = sessionData[kubeDashSessionEndpointID]; !ok {
		errors = errors + 1
	}

	if svc.Namespace, ok = sessionData[kubeDashSessionNamespace]; !ok {
		errors = errors + 1
	}

	if svc.Scheme, ok = sessionData[kubeDashSessionScheme]; !ok {
		errors = errors + 1
	}

	if svc.ServiceName, ok = sessionData[kubeDashSessionServiceName]; !ok {
		errors = errors + 1
	}

	if token, ok = sessionData[kubeDashSessionToken]; !ok {
		errors = errors + 1
	}

	// The cached data must be all there and must be for the correct endpoint
	if errors > 0 || kubeDashEndpointID != cnsiGUID {
		return sendErrorPage(c, "Failed to access to Kubernetes Dashboard - session data invalid")
	}

	apiEndpoint := cnsiRecord.APIEndpoint
	log.Debug(apiEndpoint)

	target := fmt.Sprintf("%s/api/v1/namespaces/%s/services/%s:%s:/proxy/%s", apiEndpoint, svc.Namespace, svc.Scheme, svc.ServiceName, path)
	log.Debug(target)
	targetURL, _ := url.Parse(target)

	req := c.Request()
	w := c.Response().Writer

	loc := targetURL
	loc.RawQuery = req.URL.RawQuery

	// If original request URL ended in '/', append a '/' at the end of the
	// of the proxy URL
	if !strings.HasSuffix(loc.Path, "/") && strings.HasSuffix(req.URL.Path, "/") {
		loc.Path += "/"
	}

	// From pkg/genericapiserver/endpoints/handlers/proxy.go#ServeHTTP:
	// Redirect requests with an empty path to a location that ends with a '/'
	// This is essentially a hack for http://issue.k8s.io/4958.
	// Note: Keep this code after tryUpgrade to not break that flow.
	if len(loc.Path) == 0 {
		log.Debug("Redirecting")
		var queryPart string
		if len(req.URL.RawQuery) > 0 {
			queryPart = "?" + req.URL.RawQuery
		}
		w.Header().Set("Location", req.URL.Path+"/"+queryPart)
		w.WriteHeader(http.StatusMovedPermanently)
		return nil
	}

	transport, err := rest.TransportFor(config)
	if err != nil {
		return err
	}

	// WithContext creates a shallow clone of the request with the new context.
	newReq := req.WithContext(req.Context())
	newReq.Header = utilnet.CloneHeader(req.Header)
	newReq.URL = loc

	proxy := httputil.NewSingleHostReverseProxy(&url.URL{Scheme: loc.Scheme, Host: loc.Host})
	proxy.Transport = transport
	proxy.FlushInterval = defaultFlushInterval
	proxy.ModifyResponse = func(response *http.Response) error {
		log.Debugf("Got proxy response for: %s (Status: %s)", loc.String(), response.StatusCode)
		// For the root page, set the session cookie so that the user is automatically logged in from
		// the login we did manually
		if len(path) == 0 {
			// TODO: Check the value for the cookie header - kube dash may well update with the value
			// that it wants to use
			cookie := fmt.Sprintf("jweToken=%s; Max-Age=36000", token)
			response.Header.Set("Set-Cookie", cookie)
		}
		return nil
	}

	// Proxy the request
	proxy.ServeHTTP(w, newReq)

	return nil
}

package kubernetes

import (
	"errors"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	utilnet "k8s.io/apimachinery/pkg/util/net"
	"k8s.io/client-go/rest"
)

// GET /api/v1/namespaces/{namespace}/pods/{name}/proxy

// http://localhost:8001/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/.

//GET /api/v1/namespaces/{namespace}/services/{name}/proxy

func (k *KubernetesSpecification) kubeServiceProxy(c echo.Context) error {
	log.Info("kubeServiceProxy request")

	//	c.Response().Header().Set("X-FRAME-OPTIONS", "sameorigin")

	cnsiGUID := c.Param("guid")
	namespace := c.Param("ns")
	serviceName := c.Param("svc")
	servicePortName := c.Param("port")
	userGUID := c.Get("user_id").(string)

	var p = k.portalProxy

	log.Debug(c.Request().RequestURI)

	var prefix = "/pp/v1/kubesvc/" + cnsiGUID + "/" + namespace + "/" + serviceName + "/" + servicePortName + "/"

	path := c.Request().RequestURI[len(prefix):]

	log.Info(path)

	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		//return sendSSHError("Could not get endpoint information")
		return errors.New("Could not get endpoint information")
	}

	// Get token for this users
	tokenRec, ok := p.GetCNSITokenRecord(cnsiGUID, userGUID)
	if !ok {
		//return sendSSHError("Could not get endpoint information")
		return errors.New("Could not get token")
	}

	// Make the info call to the SSH endpoint info
	// Currently this is not cached, so we must get it each time
	apiEndpoint := cnsiRecord.APIEndpoint
	log.Debug(apiEndpoint)
	absTarget := fmt.Sprintf("/api/v1/namespaces/%s/services/%s:%s/proxy/", namespace, serviceName, servicePortName)
	target := fmt.Sprintf("%s/api/v1/namespaces/%s/services/%s:%s/proxy/%s", apiEndpoint, namespace, serviceName, servicePortName, path)
	targetURL, _ := url.Parse(target)
	targetURL = normalizeLocation(targetURL)

	log.Infof("Target URL: %s", targetURL)

	config, err := k.getConfig(&cnsiRecord, &tokenRec)
	if err != nil {
		return errors.New("Could not get config for this auth type")
	}

	log.Info("Config")
	log.Info(config.Host)
	log.Info("Making request")
	req := c.Request()
	w := c.Response().Writer
	log.Info("%v+", req)

	loc := targetURL
	loc.RawQuery = req.URL.RawQuery

	// If original request URL ended in '/', append a '/' at the end of the
	// of the proxy URL
	if !strings.HasSuffix(loc.Path, "/") && strings.HasSuffix(req.URL.Path, "/") {
		loc.Path += "/"
	}

	log.Info(loc)

	// From pkg/genericapiserver/endpoints/handlers/proxy.go#ServeHTTP:
	// Redirect requests with an empty path to a location that ends with a '/'
	// This is essentially a hack for http://issue.k8s.io/4958.
	// Note: Keep this code after tryUpgrade to not break that flow.
	if len(loc.Path) == 0 {
		log.Info("Redirecting")
		var queryPart string
		if len(req.URL.RawQuery) > 0 {
			queryPart = "?" + req.URL.RawQuery
		}
		w.Header().Set("Location", req.URL.Path+"/"+queryPart)
		w.WriteHeader(http.StatusMovedPermanently)
		return nil
	}

	// if transport == nil || wrapTransport {
	// 	h.Transport = h.defaultProxyTransport(req.URL, h.Transport)
	// }

	transport, err := rest.TransportFor(config)
	if err != nil {
		log.Info("Could not get transport")
		return err
	}

	log.Info(transport)

	// WithContext creates a shallow clone of the request with the new context.
	newReq := req.WithContext(req.Context())
	//newReq := req.WithContext(context.Background())
	newReq.Header = utilnet.CloneHeader(req.Header)
	newReq.URL = loc

	// Set auth header so we log in if needed
	if len(tokenRec.AuthToken) > 0 {
		newReq.Header.Add("Authorization", "Bearer "+tokenRec.AuthToken)
		log.Info("Setting auth header")
	}

	proxy := httputil.NewSingleHostReverseProxy(&url.URL{Scheme: loc.Scheme, Host: loc.Host})
	proxy.Transport = transport
	proxy.FlushInterval = defaultFlushInterval
	proxy.ModifyResponse = func(response *http.Response) error {
		log.Debugf("GOT PROXY RESPONSE: %s", loc.String())
		log.Debugf("%d", response.StatusCode)
		log.Debug(response.Header.Get("Content-Type"))

		log.Debugf("%v+", response.Header)
		response.Header.Del("X-FRAME-OPTIONS")
		response.Header.Set("X-FRAME-OPTIONS", "sameorigin")
		log.Debug("%v+", response)

		if response.StatusCode == 302 {
			redirect := response.Header.Get("Location")
			if strings.Index(redirect, absTarget) == 0 {
				redirect = redirect[len(absTarget):]
				response.Header.Set("Location", redirect)
			}

		}
		return nil
	}

	log.Errorf("Proxy: %s", target)

	// Note that ServeHttp is non blocking and uses a go routine under the hood
	proxy.ServeHTTP(w, newReq)

	// We need this to be blocking

	// select {
	// case <-newReq.Context().Done():
	// 	return newReq.Context().Err()
	// }

	log.Errorf("Finished proxying request: %s", target)

	return nil
}

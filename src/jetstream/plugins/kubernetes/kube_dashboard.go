package kubernetes

import (
	//"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"

	utilnet "k8s.io/apimachinery/pkg/util/net"
	"k8s.io/apimachinery/pkg/util/proxy"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/transport"

	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/kubernetes/pkg/api/legacyscheme"
	api "k8s.io/kubernetes/pkg/apis/core"
	k8s_api_v1 "k8s.io/kubernetes/pkg/apis/core/v1"
)

// GET /api/v1/namespaces/{namespace}/pods/{name}/proxy

// http://localhost:8001/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/.

//GET /api/v1/namespaces/{namespace}/services/{name}/proxy

const defaultFlushInterval = 200 * time.Millisecond

type responder struct{}

type dashboardStatusResponse struct {
	Endpoint  string  `json:"guid"`
	Installed bool    `json:"installed"`
	Pod       *v1.Pod `json:"pod"`
}

func (r *responder) Error(w http.ResponseWriter, req *http.Request, err error) {
	log.Errorf("Error while proxying request: %v", err)
	http.Error(w, err.Error(), http.StatusInternalServerError)
}

// Get the config for the certificate authentication
func (k *KubernetesSpecification) getConfig(cnsiRecord *interfaces.CNSIRecord, tokenRecord *interfaces.TokenRecord) (*rest.Config, error) {
	masterURL := cnsiRecord.APIEndpoint.String()
	return k.GetConfigForEndpoint(masterURL, *tokenRecord)
}

// makeUpgradeTransport creates a transport that explicitly bypasses HTTP2 support
// for proxy connections that must upgrade.
func makeUpgradeTransport(config *rest.Config, keepalive time.Duration) (proxy.UpgradeRequestRoundTripper, error) {
	transportConfig, err := config.TransportConfig()
	if err != nil {
		return nil, err
	}
	tlsConfig, err := transport.TLSConfigFor(transportConfig)
	if err != nil {
		return nil, err
	}
	rt := utilnet.SetOldTransportDefaults(&http.Transport{
		TLSClientConfig: tlsConfig,
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: keepalive,
		}).DialContext,
	})

	upgrader, err := transport.HTTPWrappersForConfig(transportConfig, proxy.MirrorRequest)
	if err != nil {
		return nil, err
	}
	return proxy.NewUpgradeRequestRoundTripper(rt, upgrader), nil
}

// normalizeLocation returns the result of parsing the full URL, with scheme set to http if missing
func normalizeLocation(location *url.URL) *url.URL {
	normalized, _ := url.Parse(location.String())
	if len(normalized.Scheme) == 0 {
		normalized.Scheme = "http"
	}
	return normalized
}

func (k *KubernetesSpecification) kubeDashboardProxy(c echo.Context) error {
	log.Debug("kubeDashboardTest request")

	//	c.Response().Header().Set("X-FRAME-OPTIONS", "sameorigin")

	cnsiGUID := c.Param("guid")
	userGUID := c.Get("user_id").(string)

	var p = k.portalProxy

	log.Debug(c.Request().RequestURI)

	var prefix = "/pp/v1/kubedash/ui/" + cnsiGUID + "/"

	path := c.Request().RequestURI[len(prefix):]

	log.Debug(path)

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

	log.Debug(tokenRec.AuthToken)
	log.Debug(tokenRec.AuthType)

	// Make the info call to the SSH endpoint info
	// Currently this is not cached, so we must get it each time
	apiEndpoint := cnsiRecord.APIEndpoint
	log.Debug(apiEndpoint)
	// target := fmt.Sprintf("%s/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/", apiEndpoint)
	//target := fmt.Sprintf("%s/api/v1/namespaces/kube-system/services/http:kubernetes-dashboard:/proxy/", apiEndpoint)
	// target := http://localhost:8001/api/v1/namespaces/kube-system/services/kubernetes-dashboard/proxy

	// TODO: Need namespace and whether it is https or http
	target := fmt.Sprintf("%s/api/v1/namespaces/kube-system/services/http:kubernetes-dashboard:/proxy/%s", apiEndpoint, path)
	log.Debug(target)
	targetURL, _ := url.Parse(target)
	targetURL = normalizeLocation(targetURL)

	config, err := k.getConfig(&cnsiRecord, &tokenRec)
	if err != nil {
		return errors.New("Could not get config for this auth type")
	}

	log.Info("Config")
	log.Info(config.Host)
	log.Info("Making request")
	req := c.Request()
	w := c.Response().Writer
	log.Infof("%v+", req)

	// if h.tryUpgrade(w, req) {
	// 	return
	// }
	// if h.UpgradeRequired {
	// 	h.Responder.Error(w, req, errors.NewBadRequest("Upgrade request required"))
	// 	return
	// }

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
		log.Debugf("%v+", response)
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

// Determine if the specified Kube endpoint has the dashboard installed and ready
func (k *KubernetesSpecification) kubeDashboardStatus(c echo.Context) error {
	endpointGUID := c.Param("guid")

	status := dashboardStatusResponse{
		Endpoint:  endpointGUID,
		Installed: false,
	}

	pod, err := k.getKubeDashboardPod(c, "app%3Dkubernetes-dashboard")
	if err != nil {
		pod, err = k.getKubeDashboardPod(c, "k8s-app%3Dkubernetes-dashboard")
	}

	status.Pod = pod
	if err == nil {
		status.Installed = true
	}

	jsonString, err := json.Marshal(status)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Unable Marshal status response",
			"Unable Marshal status response")
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

// Determine if the specified Kube endpoint has the dashboard installed and ready
func (k *KubernetesSpecification) getKubeDashboardPod(c echo.Context, labelSelector string) (*v1.Pod, error) {
	log.Debug("kubeDashboardStatus request")

	cnsiGUID := c.Param("guid")
	userGUID := c.Get("user_id").(string)

	var p = k.portalProxy
	response, err := p.DoProxySingleRequest(cnsiGUID, userGUID, "GET", "/api/v1/pods?labelSelector="+labelSelector, nil, nil)

	if err != nil {
		return nil, interfaces.NewHTTPShadowError(
			http.StatusNotFound,
			"Could not fetch pod list",
			"Could not fetch pod list")
	}

	ok, list, err := tryDecodePodList(response.Response)
	if !ok {
		return nil, interfaces.NewHTTPShadowError(
			http.StatusNotFound,
			"Kube dashboard not installed - could not decode pod list",
			"Kube dashboard not installed - could not decode pod list")
	}

	if len(list.Items) == 0 {
		return nil, interfaces.NewHTTPShadowError(
			http.StatusOK,
			"Kube dashboard not installed",
			"Kube dashboard not installed")
	}

	// Should just be one pod
	if len(list.Items) != 1 {
		return nil, interfaces.NewHTTPShadowError(
			http.StatusNotFound,
			"Kube dashboard not installed - too many pods",
			"Kube dashboard not installed - too many pods")
	}

	pod := list.Items[0]
	if pod.Status.Phase != "Running" {
		return nil, interfaces.NewHTTPShadowError(
			http.StatusNotFound,
			"Dashboard not running",
			"Dashboard not running")
	}

	return &pod, nil
}

func tryDecodePodList(data []byte) (parsed bool, pods v1.PodList, err error) {
	obj, err := runtime.Decode(legacyscheme.Codecs.UniversalDecoder(), data)
	if err != nil {
		return false, pods, err
	}

	newPods, ok := obj.(*api.PodList)
	// Check whether the object could be converted to list of pods.
	if !ok {
		err = fmt.Errorf("invalid pods list: %#v", obj)
		return false, pods, err
	}

	v1Pods := &v1.PodList{}
	if err := k8s_api_v1.Convert_core_PodList_To_v1_PodList(newPods, v1Pods, nil); err != nil {
		return true, pods, err
	}
	return true, *v1Pods, err
}

package kubernetes

import (
	//"encoding/json"
	//"fmt"
	"net/url"

	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	// "k8s.io/client-go/kubernetes"
	// "k8s.io/client-go/rest"
	"k8s.io/helm/pkg/helm"
	// "k8s.io/helm/pkg/kube"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

type kubeReleasesData struct {
	Endpoint  string `json:"endpoint"`
	Name      string `json:"releaseName"`
	Namespace string `json:"releaseNamespace"`
	Chart     struct {
		Name       string `json:"chartName"`
		Repository string `json:"repo"`
		Version    string `json:"version"`
	} `json:"chart"`
}

type kubeReleasesResponse map[string]kubeReleasesData

// ListReleases will list the helm releases for all endpoints
func (c *KubernetesSpecification) ListReleases(ec echo.Context) error {
	log.Debug("ListReleases")

	// Need to get a config object for the target endpoint
	// endpointGUID := ec.Param("endpoint")
	userID := ec.Get("user_id").(string)

	resp, err := c.ProxyKubernetesAPI(userID, c.listReleases)
	if err != nil {
		return err
	}
	return ec.JSON(200, resp)
}

// List releases for a single endpoint
func (c *KubernetesSpecification) listReleases(ep *interfaces.ConnectedEndpoint, done chan KubeProxyResponse) {

	response := KubeProxyResponse{
		Endpoint: ep.GUID,
		Result:   nil,
	}

	log.Debugf("listReleases: START: %s", ep.GUID)
	client, _, tiller, err := c.GetHelmClient(ep.GUID, ep.Account)
	if err != nil {
		log.Errorf("Helm: ListReleases could not get a Helm Client: %s", err)
		done <- response
		return
	}

	defer tiller.Close()

	log.Debugf("listReleases: REQUEST: %s", ep.GUID)

	res, err := client.ListReleases(
		helm.ReleaseListStatuses(nil),
	)
	if err != nil {
		log.Debugf("listReleases: ERROR: %s", ep.GUID)
		log.Error(err)

		done <- response
		return
	}

	log.Debugf("listReleases: OK: %s", ep.GUID)
	response.Result = res
	done <- response
}

// GetRelease will get release status for the given release
func (c *KubernetesSpecification) GetRelease(ec echo.Context) error {

	// Need to get a config object for the target endpoint
	endpointGUID := ec.Param("endpoint")
	release := ec.Param("name")
	userID := ec.Get("user_id").(string)

	client, _, tiller, err := c.GetHelmClient(endpointGUID, userID)
	if err != nil {
		log.Errorf("Helm: GetRelease could not get a Helm Client: %s", err)
		return err
	}

	defer tiller.Close()

	res, err := client.ReleaseStatus(release, helm.StatusReleaseVersion(0))
	if err != nil {
		log.Error(err)
		return err
	}

	return ec.JSON(200, res)
}

// ListReleases will list the helm releases for all endpoints
func (c *KubernetesSpecification) aListReleases(ec echo.Context) error {

	// Need to get a config object for the target endpoint
	// endpointGUID := ec.Param("endpoint")
	userID := ec.Get("user_id").(string)

	// Get the config maps directly - don't go via Tiller

	requests := c.makeKubeProxyRequest(userID, "GET", "/api/v1/configmaps?labelSelector=OWNER%3DTILLER")
	responses, _ := c.portalProxy.DoProxyRequest(requests)
	return c.portalProxy.SendProxiedResponse(ec, responses)
}

func (c *KubernetesSpecification) makeKubeProxyRequest(userID, method, uri string) []interfaces.ProxyRequestInfo {

	var p = c.portalProxy
	eps, err := p.ListEndpointsByUser(userID)
	if err != nil {
		return nil
	}

	// Construct the metadata for proxying
	requests := make([]interfaces.ProxyRequestInfo, 0)
	for _, endpoint := range eps {
		if endpoint.CNSIType == "k8s" {
			req := interfaces.ProxyRequestInfo{}
			req.UserGUID = userID
			req.ResultGUID = endpoint.GUID
			req.EndpointGUID = endpoint.GUID
			req.Method = method

			uri, _ := url.Parse(uri)
			req.URI = uri
			requests = append(requests, req)
		}
	}

	return requests
}

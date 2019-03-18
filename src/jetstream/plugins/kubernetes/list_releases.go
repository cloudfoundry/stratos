package kubernetes

import (
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	// "k8s.io/client-go/kubernetes"
	// "k8s.io/client-go/rest"
	"k8s.io/helm/pkg/helm"
	// "k8s.io/helm/pkg/kube"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// ListReleases will list the helm releases for all endpoints
func (c *KubernetesSpecification) ListReleases(ec echo.Context) error {

	// Need to get a config object for the target endpoint
	// endpointGUID := ec.Param("endpoint")
	userID := ec.Get("user_id").(string)

	resp, err := c.ProxyKubernetesAPI(userID, c.listReleases)
	log.Warn(err)
	return ec.JSON(200, resp)
}

// List releases for a single endpoint
func (c *KubernetesSpecification) listReleases(ep *interfaces.ConnectedEndpoint, done chan KubeProxyResponse) {

	response := KubeProxyResponse{
		Endpoint: ep.GUID,
		Result:   nil,
	}

	client, _, tiller, err := c.GetHelmClient(ep.GUID, ep.Account)
	if err != nil {
		done <- response
		return
	}

	defer tiller.Close()

	res, err := client.ListReleases(
		helm.ReleaseListStatuses(nil),
	)
	if err != nil {
		done <- response
		return
	}

	response.Result = res
	done <- response
}

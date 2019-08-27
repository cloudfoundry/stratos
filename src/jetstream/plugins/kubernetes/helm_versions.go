package kubernetes

import (
	"net/http"

	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	// "k8s.io/client-go/kubernetes"
	// "k8s.io/client-go/rest"
	// "k8s.io/helm/pkg/helm"
	// "k8s.io/helm/pkg/helm/portforwarder"
	// "k8s.io/helm/pkg/kube"
	// "k8s.io/helm/pkg/kube"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// GetHelmVersions will retrieve Tiller details for all endpoints
func (c *KubernetesSpecification) GetHelmVersions(ec echo.Context) error {

	log.Debug("GetHelmVersions")
	// Need to get a config object for the target endpoint
	// endpointGUID := ec.Param("endpoint")
	userID := ec.Get("user_id").(string)

	resp, err := c.ProxyKubernetesAPI(userID, c.fetchHelmVersion)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusInternalServerError,
			"Error fetching Helm Tiller Versions",
			"Error fetching Helm Tiller Versions: %v", err,
		)
	}
	return ec.JSON(200, resp)
}

func (c *KubernetesSpecification) fetchHelmVersion(ep *interfaces.ConnectedEndpoint, done chan KubeProxyResponse) {

	respone := KubeProxyResponse{
		Endpoint: ep.GUID,
		Result:   nil,
	}

	client, kubeClient, tiller, err := c.GetHelmClient(ep.GUID, ep.Account)
	if err != nil {
		done <- respone
		return
	}

	defer tiller.Close()

	resp, err := client.GetVersion()
	if err != nil {
		done <- respone
		return
	}

	_, _ = kubeClient.Discovery().ServerVersion()

	respone.Result = resp
	done <- respone
}

package kubernetes

import (
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"

	"helm.sh/helm/v3/pkg/action"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
)

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
func (c *KubernetesSpecification) listReleases(ep *api.ConnectedEndpoint, done chan KubeProxyResponse) {

	response := KubeProxyResponse{
		Endpoint: ep.GUID,
		Result:   nil,
	}

	log.Debugf("listReleases: START: %s", ep.GUID)

	config, hc, err := c.GetHelmConfiguration(ep.GUID, ep.Account, "")
	if err != nil {
		log.Errorf("Helm: ListReleases could not get a Helm Configuration: %s", err)
		done <- response
		return
	}

	defer hc.Cleanup()

	list := action.NewList(config)

	log.Debugf("listReleases: REQUEST: %s", ep.GUID)

	res, err := list.Run()
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

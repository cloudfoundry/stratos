package kubernetes

import (
	"log/slog"

	"github.com/labstack/echo/v5"

	"helm.sh/helm/v3/pkg/action"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// ListReleases will list the helm releases for all endpoints
func (c *KubernetesSpecification) ListReleases(ec *echo.Context) error {
	// Need to get a config object for the target endpoint
	// endpointGUID := ec.Param("endpoint")
	userID := ec.Get("user_id").(string)

	slog.Debug("listing the Helm releases for every connected endpoint", "user", userID)

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

	slog.Debug("listing the Helm releases for an endpoint", "endpoint", ep.GUID, "user", ep.Account)

	config, hc, err := c.GetHelmConfiguration(ep.GUID, ep.Account, "")
	if err != nil {
		slog.Error("could not get a Helm configuration to list the releases", "endpoint", ep.GUID, "user", ep.Account, "error", err)
		done <- response
		return
	}

	defer hc.Cleanup()

	list := action.NewList(config)

	slog.Debug("requesting the Helm release list", "endpoint", ep.GUID)

	res, err := list.Run()
	if err != nil {
		slog.Error("could not list the Helm releases", "endpoint", ep.GUID, "user", ep.Account, "error", err)

		done <- response
		return
	}

	slog.Debug("listed the Helm releases", "endpoint", ep.GUID, "count", len(res))
	response.Result = res

	done <- response
}

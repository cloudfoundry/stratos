package kubernetes

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/helm/monocular/chartsvc"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"k8s.io/helm/pkg/chartutil"
	"k8s.io/helm/pkg/helm"
)

const chartCollection = "charts"

type installRequest struct {
	Endpoint  string `json:"endpoint"`
	Name      string `json:"releaseName"`
	Namespace string `json:"releaseNamespace"`
	Values    string `json:"values"`
	Chart     struct {
		Name       string `json:"chartName"`
		Repository string `json:"repo"`
		Version    string `json:"version"`
	} `json:"chart"`
}

// Monocular is a plugin for Monocular
type Monocular interface {
	GetChartStore() chartsvc.ChartSvcDatastore
}

// InstallRelease will install a release
func (c *KubernetesSpecification) InstallRelease(ec echo.Context) error {

	bodyReader := ec.Request().Body
	buf := new(bytes.Buffer)
	buf.ReadFrom(bodyReader)

	var params installRequest
	err := json.Unmarshal(buf.Bytes(), &params)
	if err != nil {
		return fmt.Errorf("Could not get Create Release Parameters: %v+", err)
	}

	chartID := fmt.Sprintf("%s/%s", params.Chart.Repository, params.Chart.Name)

	log.Info("Installing release")
	log.Info(chartID)

	downloadURL, err := c.getChart(chartID, params.Chart.Version)
	if err != nil {
		return fmt.Errorf("Could not get the Download URL")
	}

	log.Debugf("Chart Download URL: %s", downloadURL)

	// Should we ignore SSL certs?
	// TODO: Look up Helm Repository endpoiint and use the value from that
	http := c.portalProxy.GetHttpClient(true)

	resp, err := http.Get(downloadURL)

	if resp.StatusCode != 200 {
		return fmt.Errorf("Could not download Chart Archive: %s", resp.Status)
	}

	defer resp.Body.Close()
	chart, err := chartutil.LoadArchive(resp.Body)
	if err != nil {
		return fmt.Errorf("Could not load chart from archive: %v+", err)
	}

	log.Debug("Loaded helm chart")

	endpointGUID := params.Endpoint
	userGUID := ec.Get("user_id").(string)

	client, _, tiller, err := c.GetHelmClient(endpointGUID, userGUID)
	if err != nil {
		return fmt.Errorf("Could not get Helm Client for endpoint: %v+", err)
	}

	defer tiller.Close()

	if _, err := chartutil.LoadRequirements(chart); err == nil {
		log.Debug("Chart requirements loaded")
	} else if err != chartutil.ErrRequirementsNotFound {
		log.Error("Can not load requirements for helm chart")
	} else {
		log.Error(err)
	}

	installResponse, err := client.InstallReleaseFromChart(
		chart,
		params.Namespace,
		helm.ValueOverrides([]byte(params.Values)),
		helm.ReleaseName(params.Name),
		helm.InstallDryRun(false),
		helm.InstallReuseName(false),
		helm.InstallDisableHooks(false),
		helm.InstallDisableCRDHook(false),
		helm.InstallTimeout(300),
		helm.InstallWait(false),
		helm.InstallDescription(""),
	)

	if err != nil {
		return fmt.Errorf("Could not install Helm Chart: %v+", err)

	}
	return ec.JSON(200, installResponse)
}

func (c *KubernetesSpecification) getChart(chartID, version string) (string, error) {

	helm := c.portalProxy.GetPlugin("monocular")
	if helm == nil {
		return "", errors.New("Could not find monocular plugin")
	}

	monocular, ok := helm.(Monocular)
	if !ok {
		return "", errors.New("Could not find monocular plugin interface")
	}

	store := monocular.GetChartStore()
	chart, err := store.GetChart(chartID)
	if err != nil {
		log.Error("Could not find chart")
	}

	// Find the download URL for the version
	for _, chartVersion := range chart.ChartVersions {
		if chartVersion.Version == version {
			if len(chartVersion.URLs) == 1 {
				return chartVersion.URLs[0], nil
			}
		}
	}

	return "", errors.New("Could not find Chart Version")
}

// DeleteRelease will delete a release
func (c *KubernetesSpecification) DeleteRelease(ec echo.Context) error {

	endpointGUID := ec.Param("endpoint")
	releaseName := ec.Param("name")

	userGUID := ec.Get("user_id").(string)
	client, _, tiller, err := c.GetHelmClient(endpointGUID, userGUID)
	if err != nil {
		return fmt.Errorf("Could not get Helm Client for endpoint: %v+", err)
	}

	defer tiller.Close()

	deleteResponse, err := client.DeleteRelease(releaseName, helm.DeletePurge(true))
	if err != nil {
		return fmt.Errorf("Could not delete Helm Release: %v+", err)
	}

	return ec.JSON(200, deleteResponse)
}

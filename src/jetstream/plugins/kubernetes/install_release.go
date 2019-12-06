package kubernetes

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/helm/monocular/chartsvc"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
	"sigs.k8s.io/yaml"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart/loader"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
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

	log.Warn("%+v", params)

	chartID := fmt.Sprintf("%s/%s", params.Chart.Repository, params.Chart.Name)

	log.Info("Installing release")
	log.Info(chartID)

	downloadURL, err := c.getChart(chartID, params.Chart.Version)
	if err != nil {
		return fmt.Errorf("Could not get the Download URL")
	}

	log.Debugf("Chart Download URL: %s", downloadURL)

	// Should we ignore SSL certs?
	// TODO: Look up Helm Repository endpoint and use the value from that
	http := c.portalProxy.GetHttpClient(true)

	resp, err := http.Get(downloadURL)

	if resp.StatusCode != 200 {
		return fmt.Errorf("Could not download Chart Archive: %s", resp.Status)
	}

	defer resp.Body.Close()

	chart, err := loader.LoadArchive(resp.Body)
	if err != nil {
		return fmt.Errorf("Could not load chart from archive: %v+", err)
	}

	log.Warn("Loaded helm chart")
	log.Warn(chart.Name())

	endpointGUID := params.Endpoint
	userGUID := ec.Get("user_id").(string)

	config, hc, err := c.GetHelmConfiguration(endpointGUID, userGUID, params.Namespace)
	if err != nil {
		return fmt.Errorf("Could not get Helm Configuration for endpoint: %v+", err)
	}

	defer hc.Cleanup()

	// if _, err := chartutil.LoadRequirements(chart); err == nil {
	// 	log.Debug("Chart requirements loaded")
	// } else if err != chartutil.ErrRequirementsNotFound {
	// 	log.Error("Can not load requirements for helm chart")
	// } else {
	// 	log.Error(err)
	// }

	log.Warn("Got values")
	log.Warn(params.Values)

	userSuppliedValues := map[string]interface{}{}
	if err := yaml.Unmarshal([]byte(params.Values), &userSuppliedValues); err != nil {
		// Could not parse the user's values
		return err
	}

	log.Infof("%+v", userSuppliedValues)

	log.Warn("Installing.....")

	install := action.NewInstall(config)
	install.ReleaseName = params.Name
	install.Namespace = params.Namespace

	log.Warnf("%+v", install)

	// Set timeout
	// Wait?
	// Generate Name ?
	// Atomic?

	release, err := install.Run(chart, nil)
	if err != nil {
		log.Error(err)
		return fmt.Errorf("Could not install Helm Chart: %v+", err)
	}

	log.Warn("All okay")

	return ec.JSON(200, release)
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
	namespace := ec.Param("namespace")

	// I think we're going to need the namespace

	userGUID := ec.Get("user_id").(string)

	config, hc, err := c.GetHelmConfiguration(endpointGUID, userGUID, namespace)
	if err != nil {
		log.Errorf("Helm: DeleteRelease could not get a Helm Configuration: %s", err)
		return err
	}

	defer hc.Cleanup()

	uninstall := action.NewUninstall(config)

	log.Warnf("%+v", config)
	log.Warnf("%+v", uninstall)

	deleteResponse, err := uninstall.Run(releaseName)
	if err != nil {
		return interfaces.NewJetstreamError(http.StatusInternalServerError, "Could not delete Helm Release")
	}

	log.Warnf("%+v", deleteResponse)

	return ec.JSON(200, deleteResponse)
}

package kubernetes

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/helm/monocular/chartsvc"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
	"sigs.k8s.io/yaml"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"

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
	GetChartStore() *chartsvc.ChartSvcDatastore
}

// InstallRelease will install a Helm 3 release
func (c *KubernetesSpecification) InstallRelease(ec echo.Context) error {
	bodyReader := ec.Request().Body
	buf := new(bytes.Buffer)
	buf.ReadFrom(bodyReader)

	var params installRequest
	err := json.Unmarshal(buf.Bytes(), &params)
	if err != nil {
		return interfaces.NewJetstreamErrorf("Could not get Create Release Parameters: %v+", err)
	}

	chartID := fmt.Sprintf("%s/%s", params.Chart.Repository, params.Chart.Name)

	log.Debugf("Helm: Installing release %s", chartID)

	downloadURL, err := c.getChart(chartID, params.Chart.Version)
	if err != nil {
		return interfaces.NewJetstreamErrorf("Could not get the Download URL for the Helm Chart")
	}

	log.Debugf("Chart Download URL: %s", downloadURL)

	// NWM: Should we look up Helm Repository endpoint and use the value from that
	httpClient := c.portalProxy.GetHttpClient(false)
	resp, err := httpClient.Get(downloadURL)
	if err != nil {
		return interfaces.NewJetstreamErrorf("Could not download Chart Archive: %s", err)
	}
	if resp.StatusCode != 200 {
		return interfaces.NewJetstreamErrorf("Could not download Chart Archive: %s", resp.Status)
	}

	defer resp.Body.Close()

	chart, err := loader.LoadArchive(resp.Body)
	if err != nil {
		return interfaces.NewJetstreamErrorf("Could not load chart from archive: %v+", err)
	}

	log.Debugf("Loaded helm chart: %s", chart.Name())

	endpointGUID := params.Endpoint
	userGUID := ec.Get("user_id").(string)

	config, hc, err := c.GetHelmConfiguration(endpointGUID, userGUID, params.Namespace)
	if err != nil {
		return interfaces.NewJetstreamErrorf("Could not get Helm Configuration for endpoint: %+v", err)
	}

	defer hc.Cleanup()

	userSuppliedValues := map[string]interface{}{}
	if err := yaml.Unmarshal([]byte(params.Values), &userSuppliedValues); err != nil {
		// Could not parse the user's values
		return interfaces.NewJetstreamErrorf("Could not parse values: %+v", err)
	}

	// In Helm 3, the namespace must already exist
	kubeClient, _ := c.GetConfigForEndpointUser(endpointGUID, userGUID)
	clientset, _ := kubernetes.NewForConfig(kubeClient)
	coreclient := clientset.CoreV1()
	_, err = coreclient.Namespaces().Get(params.Namespace, metav1.GetOptions{})
	if err != nil {
		return interfaces.NewJetstreamErrorf("Namespace '%s' does not exist", params.Namespace)
	}

	// Check release name is valid and does not already exist
	statusAction := action.NewStatus(config)
	_, err = statusAction.Run(params.Name)
	if err == nil {
		return interfaces.NewJetstreamUserError("A Release with that name already exists - please choose another")
	}

	install := action.NewInstall(config)
	install.ReleaseName = params.Name
	install.Namespace = params.Namespace

	release, err := install.Run(chart, userSuppliedValues)
	if err != nil {
		return interfaces.NewJetstreamError(fmt.Sprintf("Error installing %+v", err))
	}

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
		return "", errors.New("Could not find Chart")
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

	userGUID := ec.Get("user_id").(string)

	config, hc, err := c.GetHelmConfiguration(endpointGUID, userGUID, namespace)
	if err != nil {
		return interfaces.NewJetstreamErrorf("Could not get Helm Configuration for endpoint: %+v", err)
	}

	defer hc.Cleanup()

	uninstall := action.NewUninstall(config)

	deleteResponse, err := uninstall.Run(releaseName)
	if err != nil {
		return interfaces.NewJetstreamError("Could not delete Helm Release")
	}

	return ec.JSON(200, deleteResponse)
}

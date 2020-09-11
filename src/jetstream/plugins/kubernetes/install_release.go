package kubernetes

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
	"sigs.k8s.io/yaml"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chart/loader"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

const chartCollection = "charts"

type installRequest struct {
	Endpoint          string `json:"endpoint"`
	MonocularEndpoint string `json:"monocularEndpoint"`
	Name              string `json:"releaseName"`
	Namespace         string `json:"releaseNamespace"`
	Values            string `json:"values"`
	Chart             struct {
		Name       string `json:"chartName"`
		Repository string `json:"repo"`
		Version    string `json:"version"`
	} `json:"chart"`
}

type upgradeRequest struct {
	MonocularEndpoint string `json:"monocularEndpoint"`
	Values            string `json:"values"`
	Chart             struct {
		Name       string `json:"name"`
		Repository string `json:"repo"`
		Version    string `json:"version"`
	} `json:"chart"`
	RestartPods bool `json:"restartPods"`
}

// Monocular is a plugin for Monocular
type Monocular interface {
	GetChartDownloadUrl(monocularEndpoint, chartID, chartVersion string) (string, error)
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

	chart, err := c.loadChart(params.MonocularEndpoint, params.Chart.Repository, params.Chart.Name, params.Chart.Version)
	if err != nil {
		return interfaces.NewJetstreamErrorf("Could not load chart: %v+", err)
	}

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

func (c *KubernetesSpecification) getChart(monocularEndpoint, chartID, version string) (string, error) {
	helm := c.portalProxy.GetPlugin("monocular")
	if helm == nil {
		return "", errors.New("Could not find monocular plugin")
	}

	monocular, ok := helm.(Monocular)
	if !ok {
		return "", errors.New("Could not find monocular plugin interface")
	}

	return monocular.GetChartDownloadUrl(monocularEndpoint, chartID, version)
}

// Load the Helm chart for the given repository, name and version
func (c *KubernetesSpecification) loadChart(monocularEndpoint, repo, name, version string) (*chart.Chart, error) {

	chartID := fmt.Sprintf("%s/%s", repo, name)
	downloadURL, err := c.getChart(monocularEndpoint, chartID, version)
	if err != nil {
		return nil, fmt.Errorf("Could not get the Download URL for the Helm Chart: %+v", err)
	}

	log.Debugf("Helm Chart Download URL: %s", downloadURL)

	// NWM: Should we look up Helm Repository endpoint and use the value from that
	httpClient := c.portalProxy.GetHttpClient(false)
	resp, err := httpClient.Get(downloadURL)
	if err != nil {
		return nil, fmt.Errorf("Could not download Chart Archive: %s", err)
	}
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Could not download Chart Archive: %s", resp.Status)
	}

	defer resp.Body.Close()

	return loader.LoadArchive(resp.Body)
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

// GetReleaseHistory will get the history for a release
func (c *KubernetesSpecification) GetReleaseHistory(ec echo.Context) error {
	endpointGUID := ec.Param("endpoint")
	releaseName := ec.Param("name")
	namespace := ec.Param("namespace")

	userGUID := ec.Get("user_id").(string)

	config, hc, err := c.GetHelmConfiguration(endpointGUID, userGUID, namespace)
	if err != nil {
		return interfaces.NewJetstreamErrorf("Could not get Helm Configuration for endpoint: %+v", err)
	}

	defer hc.Cleanup()

	history := action.NewHistory(config)
	historyResponse, err := history.Run(releaseName)
	if err != nil {
		return interfaces.NewJetstreamError("Could not get history for the Helm Release")
	}

	return ec.JSON(200, historyResponse)
}

// UpgradeRelease will upgrade the specified release
func (c *KubernetesSpecification) UpgradeRelease(ec echo.Context) error {
	endpointGUID := ec.Param("endpoint")
	releaseName := ec.Param("name")
	namespace := ec.Param("namespace")

	userGUID := ec.Get("user_id").(string)

	bodyReader := ec.Request().Body
	buf := new(bytes.Buffer)
	buf.ReadFrom(bodyReader)

	var params upgradeRequest
	err := json.Unmarshal(buf.Bytes(), &params)
	if err != nil {
		return interfaces.NewJetstreamErrorf("Could not get Upgrade Release Parameters: %+v", err)
	}

	config, hc, err := c.GetHelmConfiguration(endpointGUID, userGUID, namespace)
	if err != nil {
		return interfaces.NewJetstreamErrorf("Could not get Helm Configuration for endpoint: %+v", err)
	}

	defer hc.Cleanup()

	chart, err := c.loadChart(params.MonocularEndpoint, params.Chart.Repository, params.Chart.Name, params.Chart.Version)
	if err != nil {
		return interfaces.NewJetstreamErrorf("Could not load chart for upgrade: %+v", err)
	}

	userSuppliedValues := map[string]interface{}{}
	if err := yaml.Unmarshal([]byte(params.Values), &userSuppliedValues); err != nil {
		// Could not parse the user's values
		return interfaces.NewJetstreamErrorf("Could not parse values: %+v", err)
	}

	upgrade := action.NewUpgrade(config)
	upgradeResponse, err := upgrade.Run(releaseName, chart, userSuppliedValues)
	if err != nil {
		return interfaces.NewJetstreamErrorf("Could not upgrade Helm Release: %+v", err)
	}

	return ec.JSON(200, upgradeResponse)
}

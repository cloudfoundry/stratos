package monocular

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/monocular/store"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

// Functions to provide a Monocular compatible API with our chart store

// List all helm Charts - gets the latest version for each Chart
func (m *Monocular) listCharts(c echo.Context) error {
	log.Debug("List Charts called")

	// Check if this is a request for Artifact Hub
	if handled, err := m.handleArtifactRequest(c, m.fetchChartsFromArtifactHub); handled {
		return err
	}

	charts, err := m.ChartStore.GetLatestCharts()
	if err != nil {
		return err
	}

	// Translate the list into an array of Charts
	var list APIListResponse
	for _, chart := range charts {
		list = append(list, m.translateToChartAPIResponse(chart, nil))
	}

	meta := Meta{
		TotalPages: 1,
	}

	body := BodyAPIListResponse{
		Data: &list,
		Meta: meta,
	}

	return c.JSON(200, body)
}

// Get the latest version of a given chart
func (m *Monocular) getChart(c echo.Context) error {
	log.Debug("Get Chart called")

	// Check if this is a request for Artifact Hub
	if handled, err := m.handleArtifactRequest(c, m.artifactHubGetChart); handled {
		return err
	}

	repo := c.Param("repo")
	chartName := c.Param("name")

	chart, err := m.ChartStore.GetChart(repo, chartName, "")
	if err != nil {
		return err
	}

	chartYaml := m.getChartYaml(*chart)
	body := BodyAPIResponse{
		Data: *m.translateToChartAPIResponse(chart, chartYaml),
	}
	return c.JSON(200, body)
}

func (m *Monocular) getIcon(c echo.Context) error {
	log.Debug("Get Icon called")

	// Process ArtifactHub request
	if handled, err := m.handleArtifactRequest(c, m.artifactHubGetIconHandler); handled {
		return err
	}

	repo := c.Param("repo")
	chartName := c.Param("chartName")
	version := c.Param("version")

	if len(version) == 0 {
		log.Debugf("Get icon for %s/%s", repo, chartName)
	} else {
		log.Debugf("Get icon for %s/%s-%s", repo, chartName, version)
	}

	chart, err := m.ChartStore.GetChart(repo, chartName, version)
	if err != nil {
		log.Error("Can not find chart")
		return errors.New("Error")
	}

	// This will download and cache the icon if it is not already cached - it returns the local file path to the icon file
	// or an empty string if no icon is available or could not be downloaded
	iconFilePath, _ := m.cacheChartIcon(*chart)
	if len(iconFilePath) == 0 {
		// No icon or error downloading
		http.Redirect(c.Response().Writer, c.Request(), "/core/assets/custom/placeholder.png", http.StatusTemporaryRedirect)
		return nil
	}

	c.File(iconFilePath)
	return nil
}

// /chartsvc/v1/charts/:repo/:name/versions/:version
// Get specific chart version
func (m *Monocular) getChartVersion(c echo.Context) error {
	log.Debug("getChartAndVersion called")

	// Process ArtifactHub request
	if handled, err := m.handleArtifactRequest(c, m.artifactHubGetChartVersion); handled {
		return err
	}

	repo := c.Param("repo")
	chartName := c.Param("name")
	version := c.Param("version")

	chart, err := m.ChartStore.GetChart(repo, chartName, version)
	if err != nil {
		return err
	}

	chartYaml := m.getChartYaml(*chart)
	if chartYaml == nil {
		// Error - could not get chart yaml
		return echo.NewHTTPError(http.StatusNotFound, fmt.Sprintf("Can not find Chart.yaml for %s/%s-%s", repo, chartName, version))
	}

	body := BodyAPIResponse{
		Data: *m.translateToChartVersionAPIResponse(chart, chartYaml),
	}
	return c.JSON(200, body)
}

// /chartsvc/v1/charts/:repo/:name/versions
// Get all chart versions for a given chart
func (m *Monocular) getChartVersions(c echo.Context) error {

	// Check if this is a request for Artifact Hub
	var err error
	externalMonocularEndpoint, err := m.isExternalMonocularRequest(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	repo := c.Param("repo")
	chartName := c.Param("name")

	var charts []*store.ChartStoreRecord
	if externalMonocularEndpoint != nil {
		charts, err = m.artifactHubGetChartVersions(c, externalMonocularEndpoint.GUID, repo, chartName)
	} else {
		// Get all versions for a given chart
		charts, err = m.ChartStore.GetChartVersions(repo, chartName)
	}

	if err != nil {
		return err
	}

	// Translate the list into an array of Charts
	var list APIListResponse
	for _, chart := range charts {
		list = append(list, m.translateToChartVersionAPIResponse(chart, nil))
	}

	body := BodyAPIListResponse{
		Data: &list,
	}

	return c.JSON(200, body)
}

// Get a file such as the README or valyes for a given chart version
func (m *Monocular) getChartAndVersionFile(c echo.Context) error {
	log.Debug("Get Chart file called")

	repo := c.Param("repo")
	chartName := c.Param("name")
	version := c.Param("version")
	filename := c.Param("filename")

	if !isPermittedFile(filename) {
		return echo.NewHTTPError(http.StatusNotFound, fmt.Sprintf("Can not find file %s for the specified chart", filename))
	}

	log.Debugf("Get chart file: %s", filename)

	chart, err := m.ChartStore.GetChart(repo, chartName, version)
	if err != nil {
		return err
	}

	if m.cacheChart(*chart) == nil {
		return c.File(path.Join(m.getChartCacheFolder(*chart), filename))
	}

	return echo.NewHTTPError(http.StatusNotFound, fmt.Sprintf("Can not find file %s for the specified chart", filename))
}

func (m *Monocular) getChartValues(c echo.Context) error {
	endpointID := c.Param("endpoint")
	repo := c.Param("repo")
	chartName := c.Param("name")
	version := c.Param("version")

	// Built in Monocular
	if endpointID == "default" {
		filename := "values.yaml"
		log.Debugf("Get chart file: %s", filename)
		chart, err := m.ChartStore.GetChart(repo, chartName, version)
		if err != nil {
			return err
		}
		if m.cacheChart(*chart) == nil {
			return c.File(path.Join(m.getChartCacheFolder(*chart), filename))
		}
		return echo.NewHTTPError(http.StatusNotFound, fmt.Sprintf("Can not find file %s for the specified chart", filename))
	}

	// Artifact Hub
	return m.artifactHubGetChartFileNamed(c, "values.yaml")
}

// This is the simpler version that returns just enough data needed for the Charts list view
// This is a slight cheat - the response is not as complete as the Monocular API, but includes
// enough for the UI and saves us having to pull out all of the Chart.yaml files
func (m *Monocular) translateToChartAPIResponse(record *store.ChartStoreRecord, chartYaml *ChartMetadata) *APIResponse {
	response := &APIResponse{
		ID:            fmt.Sprintf("%s/%s", record.Repository, record.Name),
		Type:          "chart",
		Relationships: make(map[string]Rel),
		Attributes:    m.translateToChart(record, chartYaml),
	}

	response.Relationships["latestChartVersion"] = Rel{
		Data: m.translateToChartVersion(record, chartYaml),
	}
	return response
}

func (m *Monocular) translateToChart(record *store.ChartStoreRecord, chartYaml *ChartMetadata) Chart {
	chart := Chart{
		Name:        record.Name,
		Description: record.Description,
		Repo:        Repo{},
		Icon:        fmt.Sprintf("/v1/assets/%s/%s/%s/logo", record.Repository, record.Name, record.Version),
		Sources:     record.Sources,
	}

	chart.Repo.Name = record.Repository

	if chartYaml != nil {
		chart.Keywords = chartYaml.Keywords
		// Prefer the Chart Yaml description if we have it (db one might be truncated)
		chart.Description = chartYaml.Description
		chart.Maintainers = make([]ChartMaintainer, len(chartYaml.Maintainers))
		for index, maintainer := range chartYaml.Maintainers {
			chart.Maintainers[index] = *maintainer
		}

		chart.Home = chartYaml.Home
	}

	return chart
}

func (m *Monocular) translateToChartVersion(record *store.ChartStoreRecord, chartYaml *ChartMetadata) ChartVersion {
	chartVersion := ChartVersion{
		Version:    record.Version,
		AppVersion: record.AppVersion,
		Digest:     record.Digest,
		Created:    record.Created,
		URLs:       make([]string, 1),
	}
	chartVersion.URLs[0] = record.ChartURL
	if chartYaml != nil {
		// If we have the Chart yaml, then we already have the chart
		// Add in the files that are available
		cacheFolder := m.getChartCacheFolder(*record)
		chartVersion.Readme = getFileAssetURL(record.Repository, record.Name, record.Version, cacheFolder, "README.md")
		chartVersion.Schema = getFileAssetURL(record.Repository, record.Name, record.Version, cacheFolder, "values.schema.json")
		chartVersion.Values = getFileAssetURL(record.Repository, record.Name, record.Version, cacheFolder, "values.yaml")
	}

	return chartVersion
}

func (m *Monocular) translateToChartVersionAPIResponse(record *store.ChartStoreRecord, chartYaml *ChartMetadata) *APIResponse {
	response := &APIResponse{
		ID:            fmt.Sprintf("%s/%s-%s", record.Repository, record.Name, record.Version),
		Type:          "chartVersion",
		Relationships: make(map[string]Rel),
		Attributes:    m.translateToChartVersion(record, chartYaml),
	}

	response.Relationships["chart"] = Rel{
		Data: m.translateToChart(record, chartYaml),
	}
	return response
}

func getFileAssetURL(repo, name, version, folder, filename string) string {
	cachePath := path.Join(folder, filename)
	if _, err := os.Stat(cachePath); os.IsNotExist(err) {
		return ""
	}

	return fmt.Sprintf("/v1/assets/%s/%s/versions/%s/%s", repo, name, version, filename)
}

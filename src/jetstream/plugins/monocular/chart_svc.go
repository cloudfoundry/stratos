package monocular

import (
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/monocular/store"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
)

// Functions to provide a Monocular compatible API with our chart store

// List all helm Charts - gets the latest version for each Chart
func (m *Monocular) listCharts(c echo.Context) error {
	log.Debug("List Charts called")

	// Check if this is a request for an external Monocular
	if handled, err := m.processMonocularRequest(c); handled {
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

	// Check if this is a request for an external Monocular
	if handled, err := m.processMonocularRequest(c); handled {
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

	// Check if this is a request for an external Monocular
	if handled, err := m.processMonocularRequest(c); handled {
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

	// Check if this is a request for an external Monocular
	if handled, err := m.processMonocularRequest(c); handled {
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

	// Check if this is a request for an external Monocular
	if handled, err := m.processMonocularRequest(c); handled {
		return err
	}

	repo := c.Param("repo")
	chartName := c.Param("name")

	// Get all versions for a given chart
	charts, err := m.ChartStore.GetChartVersions(repo, chartName)
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

	// Check if this is a request for an external Monocular
	if handled, err := m.processMonocularRequest(c); handled {
		return err
	}

	repo := c.Param("repo")
	chartName := c.Param("name")
	version := c.Param("version")
	filename := c.Param("filename")

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

	// Helm Hub
	// Change the URL and then forward on
	p := fmt.Sprintf("/chartsvc/v1/assets/%s/%s/versions/%s/values.yaml", repo, chartName, version)
	monocularEndpoint, err := m.validateExternalMonocularEndpoint(endpointID)
	if monocularEndpoint == nil || err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, errors.New("No monocular endpoint"))
	}

	return m.proxyToMonocularInstance(c, monocularEndpoint, p)
}

// Check to see if the given chart URL has a schema
func (m *Monocular) checkForJsonSchema(c echo.Context) error {
	log.Debug("checkForJsonSchema called")

	chartName := c.Param("name")
	encodedChartURL := c.Param("encodedChartURL")
	url, err := base64.StdEncoding.DecodeString(encodedChartURL)
	if err != nil {
		return err
	}

	chartURL := string(url)

	chartCachePath := path.Join(m.CacheFolder, "schemas", encodedChartURL)
	if err := m.ensureFolder(chartCachePath); err != nil {
		log.Warnf("checkForJsonSchema: Could not create folder for chart downloads: %+v", err)
		return err
	}

	// We can delete the Chart archive - don't need it anymore
	defer os.RemoveAll(chartCachePath)

	archiveFile := path.Join(chartCachePath, "chart.tgz")
	if err := m.downloadFile(archiveFile, chartURL); err != nil {
		return fmt.Errorf("Could not download chart from: %s - %+v", chartURL, err)
	}

	// Now extract the files we need
	filenames := []string{"values.schema.json"}
	if err := extractArchiveFiles(archiveFile, chartName, chartCachePath, filenames); err != nil {
		return fmt.Errorf("Could not extract files from chart archive: %s - %+v", archiveFile, err)
	}

	return c.File(path.Join(chartCachePath, "values.schema.json"))
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

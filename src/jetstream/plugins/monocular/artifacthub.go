package monocular

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"path"
	"sort"
	"strings"
	"time"

	"github.com/cloudfoundry-community/stratos/src/jetstream/plugins/monocular/store"
	"github.com/labstack/echo/v4"
	yaml "gopkg.in/yaml.v2"
)

// Artifact Hub support

type artifactHubHandler func(c echo.Context, endpointID string) error

const (
	searchURL = "https://artifacthub.io/api/chartsvc/v1/charts/search"
	// How long to cache data from the ArtifactHub API
	hubCacheExpiry = 15 * time.Minute
)

// Structs for data coming back from the ArtifactHub API
type ahData struct {
	Data []ahChart `json:"data"`
}

type ahChart struct {
	ID          string `json:"id"`
	ArtifactHub struct {
		PackageURL string `json:"packageUrl"`
	} `json:"artifactHub"`
	Attributes struct {
		Repo        Repo   `json:"repo"`
		Description string `json:"description"`
	} `json:"attributes"`
	Relationships struct {
		LatestVersion struct {
			Data struct {
				Version    string `json:"version"`
				AppVersion string `json:"app_version"`
			} `json:"data"`
		} `json:"latestChartVersion"`
	} `json:"relationships"`
}

type ahVersion struct {
	Version   string                `json:"version"`
	CreatedAt int64                 `json:"created_at"`
	SemVer    store.SemanticVersion `json:"-"`
}

type ahInfo struct {
	Description       string            `json:"description"`
	Name              string            `json:"name"`
	CreatedAt         int64             `json:"created_at"`
	Version           string            `json:"version"`
	Digest            string            `json:"digest"`
	HomeURL           string            `json:"home_url"`
	AppVersion        string            `json:"app_version"`
	IconID            string            `json:"logo_image_id"`
	Repository        Repo              `json:"repository"`
	AvailableVersions []ahVersion       `json:"available_versions"`
	Readme            string            `json:"readme"`
	Links             []Repo            `json:"links"`
	Maintainers       []ChartMaintainer `json:"maintainers"`
}

type ahVersions []ahVersion

// Look to see if the request is for ArtifactHub - if it is, invoke the specified request handler
func (m *Monocular) handleArtifactRequest(c echo.Context, handler artifactHubHandler) (bool, error) {
	externalMonocularEndpoint, err := m.isExternalMonocularRequest(c)
	if err != nil {
		return true, echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// If this request is associated with an external monocular instance forward the request on to it
	if externalMonocularEndpoint != nil {
		return true, handler(c, externalMonocularEndpoint.GUID)
	}
	return false, nil
}

// Fetch all charts from ArtifactHub using the Monocular-compatible search API
// We cache the results of the search on disk for the configfured cache period
func (m *Monocular) fetchChartsFromArtifactHub(c echo.Context, endpointID string) error {
	cacheFolder := path.Join(m.CacheFolder, endpointID)
	indexFile := path.Join(cacheFolder, "hub_index.json")
	if ok := useCachedFile(indexFile); ok {
		// Just send the cached file
		return c.File(indexFile)
	}

	// Fetch index of charts usign the search API
	httpClient := m.portalProxy.GetHttpClient(true, "")
	resp, err := httpClient.Get(searchURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Error retrieving Helm Chart list from ArtifactHub - %d:%s", resp.StatusCode, resp.Status)
	}

	// Parse the list into JSON so we can translate it to be compatible with Monocular ressponse
	results := ahData{}
	decoder := json.NewDecoder(resp.Body)
	if err := decoder.Decode(&results); err != nil {
		return fmt.Errorf("Error marshalling Helm Chart list from ArtifactHub - %d:%s", resp.StatusCode, resp.Status)
	}

	// Translate response into a Monocular response
	charts := make(APIListResponse, len(results.Data))
	for index, info := range results.Data {
		ids := strings.Split(info.ID, "/")
		name := ids[len(ids)-1]

		chart := APIResponse{
			ID:   info.ID,
			Type: "chart",
		}
		chart.Attributes = Chart{
			Description: info.Attributes.Description,
			Name:        name,
			Repo:        info.Attributes.Repo,
			Icon:        fmt.Sprintf("/v1/hub/assets/%s/%s/logo", info.ID, info.Relationships.LatestVersion.Data.Version),
		}
		chart.Relationships = make(RelMap)
		rel := Rel{
			Data: ChartVersion{
				Version:    info.Relationships.LatestVersion.Data.Version,
				AppVersion: info.Relationships.LatestVersion.Data.AppVersion,
			},
		}
		chart.Relationships["latestChartVersion"] = rel
		charts[index] = &chart
	}

	response := BodyAPIListResponse{
		Data: &charts,
	}

	// Cache this response on disk, so next time we use it again
	if err := m.ensureFolder(cacheFolder); err == nil {
		if json, err := json.Marshal(response); err == nil {
			ioutil.WriteFile(indexFile, json, 0644)
		}
	}

	return c.JSON(200, response)
}

// Get a specific Chart from ArtifactHub
// We cache metadata on disk in the artifactHubGetPackageInfo function
func (m *Monocular) artifactHubGetChart(c echo.Context, endpointID string) error {
	repo := c.Param("repo")
	chartName := c.Param("name")
	version := c.Param("version")

	info, err := m.artifactHubGetPackageInfo(endpointID, repo, chartName, version)
	if err != nil {
		return err
	}

	// Transform the data into a Monocular response
	response := BodyAPIResponse{
		Data: APIResponse{
			ID:            fmt.Sprintf("%s/%s", repo, chartName),
			Type:          "chart",
			Relationships: make(map[string]Rel),
		},
	}

	attrs := Chart{
		Name: chartName,
		Repo: Repo{
			Name: repo,
		},
		Home:        info.HomeURL,
		Description: info.Description,
		Icon:        fmt.Sprintf("/v1/hub/assets/%s/%s/logo", response.Data.ID, version),
		Sources:     filterSourceLinks(info.Links),
		Maintainers: info.Maintainers,
	}
	response.Data.Attributes = attrs

	// Fill in the latest chart version
	sorted := m.artifactHubGetChartVersionsFromInfo(info, repo, chartName)
	if len(sorted) > 0 {
		lver := sorted[0]
		latest := ChartVersion{
			Version: lver.Version,
		}
		response.Data.Relationships["latestChartVersion"] = Rel{
			Data: latest,
		}
	}

	return c.JSON(200, response)
}

// Get the metadata for a specific version of a chart
// We need to download the Chart archive and unpack it in order to get the chart URL and information
// about whether the Chart has a schema
func (m *Monocular) artifactHubGetChartVersion(c echo.Context, endpointID string) error {
	repo := c.Param("repo")
	chartName := c.Param("name")
	version := c.Param("version")

	// Get the package info - this allows us to determine the URL of the Helm Repository
	// which we need in order to get the Chart URL and download
	info, err := m.artifactHubGetPackageInfo(endpointID, repo, chartName, version)
	if err != nil {
		return err
	}

	// Download the chart and cache required files
	cacheFolder, err := m.artifactHubCacheChartFiles(endpointID, repo, info.Repository.URL, chartName, version, info.Digest)
	if err != nil {
		return err
	}

	chartURL, err := ioutil.ReadFile(path.Join(cacheFolder, "chart_url"))
	if err != nil {
		return err
	}

	urls := make([]string, 1)
	urls[0] = string(chartURL)

	// Transform the data into a Monocular response
	response := BodyAPIResponse{
		Data: APIResponse{
			ID:            fmt.Sprintf("%s/%s-%s", repo, chartName, version),
			Type:          "chartVersion",
			Relationships: make(map[string]Rel),
		},
	}

	attrs := ChartVersion{
		AppVersion: info.AppVersion,
		Version:    info.Version,
		Created:    time.Unix(info.CreatedAt, 0),
		Digest:     info.Digest,
		Readme:     ahGetFileAssetURL(endpointID, repo, chartName, version, cacheFolder, "README.md"),
		Values:     ahGetFileAssetURL(endpointID, repo, chartName, version, cacheFolder, "values.yaml"),
		Schema:     ahGetFileAssetURL(endpointID, repo, chartName, version, cacheFolder, "values.schema.json"),
		URLs:       urls,
	}
	response.Data.Attributes = attrs

	chart := Chart{
		Icon:        fmt.Sprintf("/v1/hub/assets/%s/%s/%s/logo", repo, chartName, version),
		Maintainers: info.Maintainers,
	}
	response.Data.Relationships["chart"] = Rel{
		Data: chart,
	}

	return c.JSON(200, response)
}

// Return an asset URL if teh asset is available in the cache
func ahGetFileAssetURL(endpointID, repo, name, version, folder, filename string) string {
	cachePath := path.Join(folder, filename)
	if _, err := os.Stat(cachePath); os.IsNotExist(err) {
		return ""
	}
	return fmt.Sprintf("/v1/hub/%s/%s/%s/%s/%s", endpointID, repo, name, version, filename)
}

// Get a file for the given chart (readme, valuees, schema)
func (m *Monocular) artifactHubGetChartFile(c echo.Context) error {
	file := c.Param("file")
	return m.artifactHubGetChartFileNamed(c, file)
}

// Same as abuve, but allow name to be passed in, so we can use this internally too
func (m *Monocular) artifactHubGetChartFileNamed(c echo.Context, file string) error {
	endpointID := c.Param("endpoint")
	repo := c.Param("repo")
	chartName := c.Param("name")
	version := c.Param("version")

	if !isPermittedFile(file) {
		return echo.NewHTTPError(http.StatusNotFound, fmt.Sprintf("Can not find file %s for the specified chart", file))
	}

	info, err := m.artifactHubGetPackageInfo(endpointID, repo, chartName, version)
	if err != nil {
		return err
	}

	cacheFolder, err := m.artifactHubCacheChartFiles(endpointID, repo, info.Repository.URL, chartName, version, info.Digest)
	if err != nil {
		return err
	}

	fp := path.Join(cacheFolder, file)
	return c.File(fp)
}

// Get available versions for a Chart
func (m *Monocular) artifactHubGetChartVersions(c echo.Context, endpointID, repo, chartName string) ([]*store.ChartStoreRecord, error) {
	var versions store.ChartStoreRecordList
	info, err := m.artifactHubGetPackageInfo(endpointID, repo, chartName, "")
	if err != nil {
		return versions, err
	}
	return m.artifactHubGetChartVersionsFromInfo(info, repo, chartName), nil
}

// Get available versions for a Chart from ArtifactHub info
func (m *Monocular) artifactHubGetChartVersionsFromInfo(info *ahInfo, repo, chartName string) []*store.ChartStoreRecord {
	var versions store.ChartStoreRecordList
	// Translate to the bear miniumum version metadata
	for _, ver := range info.AvailableVersions {
		versions = append(versions, &store.ChartStoreRecord{
			Version:    ver.Version,
			Created:    time.Unix(ver.CreatedAt, 0),
			Name:       chartName,
			Repository: repo,
			SemVer:     store.NewSemanticVersion(ver.Version),
		})
	}
	sort.Sort(versions)
	return versions
}

// Get the icon for a Chart
func (m *Monocular) artifactHubGetIconHandler(c echo.Context, endpointID string) error {
	return m.artifactHubGetIcon(c)
}

func (m *Monocular) artifactHubGetIcon(c echo.Context) error {
	endpoint := c.Param("guid")
	repo := c.Param("repo")
	chartName := c.Param("name")
	version := c.Param("version")

	var contentType string

	// Look to see if we have the icon cached - fetch it if not
	iconFilePath := path.Join(m.CacheFolder, endpoint, fmt.Sprintf("%s_%s_%s", repo, chartName, version), "icon")
	iconTypeFilePath := path.Join(m.CacheFolder, endpoint, fmt.Sprintf("%s_%s_%s", repo, chartName, version), "icon.type")
	stats, err := os.Stat(iconFilePath)
	if os.IsNotExist(err) {
		// Not cached, so need to get chart info from ArtifactHub, cache icon and send
		hubInfo, err := m.artifactHubGetPackageInfo(endpoint, repo, chartName, version)
		if err != nil {
			return sendPlaceHolderIcon(c)
		}

		if err := m.ensureFolder(path.Dir(iconFilePath)); err != nil {
			return sendPlaceHolderIcon(c)
		}

		// No icon, so write a 0 byte file so next time we don't try and figure out it doesn't have one all over again
		if len(hubInfo.IconID) == 0 {
			out, err := os.Create(iconFilePath)
			if err == nil {
				out.Close()
			}
			return sendPlaceHolderIcon(c)
		}

		// Now download the icon
		iconURL := fmt.Sprintf("https://artifacthub.io/image/%s", hubInfo.IconID)
		contentType, err = m.downloadFile(iconFilePath, iconURL)
		if err != nil {
			return sendPlaceHolderIcon(c)
		}
		stats, err = os.Stat(iconFilePath)
		if err != nil {
			return sendPlaceHolderIcon(c)
		}

		// Write out the content type
		ioutil.WriteFile(iconTypeFilePath, []byte(contentType), 0644)
	}

	// If the file is 0 length
	if stats.Size() == 0 {
		return sendPlaceHolderIcon(c)
	}

	// Read the content type
	if len(contentType) == 0 {
		if data, err := ioutil.ReadFile(iconTypeFilePath); err == nil {
			contentType = string(data)
		}
	}

	iconFile, err := ioutil.ReadFile(iconFilePath)
	if err != nil {
		return sendPlaceHolderIcon(c)
	}
	c.Response().Header().Set("Content-Type", contentType)
	c.Response().Status = 200
	c.Response().Write(iconFile)

	return nil
}

func sendPlaceHolderIcon(c echo.Context) error {
	http.Redirect(c.Response().Writer, c.Request(), "/core/assets/custom/placeholder.png", http.StatusTemporaryRedirect)
	return nil
}

// Download package infor from ArtifactHub or use the cached version
func (m *Monocular) artifactHubGetPackageInfo(endpointID, repo, name, version string) (*ahInfo, error) {
	// Make sure we handle an empty version correctly
	var cacheName string
	var versionPart = ""
	if len(version) > 0 {
		versionPart = fmt.Sprintf("/%s", version)
		cacheName = fmt.Sprintf("%s_%s_%s.json", repo, name, version)
	} else {
		cacheName = fmt.Sprintf("%s_%s.json", repo, name)
	}

	var reader io.Reader
	fetch := true

	// Check for cached file
	cacheFolder := path.Join(m.CacheFolder, endpointID)
	indexFile := path.Join(cacheFolder, cacheName)

	if ok := useCachedFile(indexFile); ok {
		// Just use the cached file
		f, err := os.Open(indexFile)
		if err == nil {
			defer f.Close()
			reader = f
			fetch = false
		}
	}

	if fetch {
		infoURL := fmt.Sprintf("https://artifacthub.io/api/v1/packages/helm/%s/%s%s", repo, name, versionPart)
		httpClient := m.portalProxy.GetHttpClient(true, "")
		resp, err := httpClient.Get(infoURL)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("Error retrieving Helm Chart info from ArtifactHub - %d:%s", resp.StatusCode, resp.Status)
		}
		reader = resp.Body
	}

	result := ahInfo{}
	decoder := json.NewDecoder(reader)
	if err := decoder.Decode(&result); err != nil {
		return nil, fmt.Errorf("Error marshalling Helm Chart info from ArtifactHub - %+v", err)
	}

	// Cache the data if we fetched it
	if fetch {
		if err := m.ensureFolder(cacheFolder); err == nil {
			if json, err := json.Marshal(result); err == nil {
				ioutil.WriteFile(indexFile, json, 0644)
			}
		}
	}
	return &result, nil
}

// Cache the chart files if needed - in the same way we do for our built-in Monocular cache
func (m *Monocular) artifactHubCacheChartFiles(endpointID, repoName, repoURL, name, version, digest string) (string, error) {

	// First look to see if there is a digest file
	cacheFolder := path.Join(m.CacheFolder, endpointID, fmt.Sprintf("%s_%s_%s", repoName, name, version))
	if hasDigestFile(cacheFolder, digest) {
		return cacheFolder, nil
	}

	if err := m.ensureFolder(cacheFolder); err != nil {
		return cacheFolder, err
	}

	// We need to download the Helm Repository index file from the repo URL then look for our chart and version in order to find the Chart
	chartURL, err := m.getChartURL(repoURL, name, version)
	if err != nil {
		return cacheFolder, err
	}

	err = m.cacheChartFromURL(cacheFolder, digest, name, chartURL)
	if err != nil {
		return cacheFolder, err
	}

	// Write the chart URL to a file as well, so we don't have to do this again
	ioutil.WriteFile(path.Join(cacheFolder, "chart_url"), []byte(chartURL), 0644)
	return cacheFolder, nil
}

func useCachedFile(file string) bool {
	stats, err := os.Stat(file)
	if err == nil {
		// File exists - check how old it is
		expiryTime := stats.ModTime().Add(hubCacheExpiry)
		if expiryTime.Before(time.Now()) {
			// Delete the file
			os.Remove(file)
		} else {
			return true
		}
	}
	return false
}

func filterSourceLinks(links []Repo) []string {
	var sources []string
	for _, link := range links {
		if link.Name == "source" {
			sources = append(sources, link.URL)
		}
	}
	return sources
}

// Download the Helm Repository index and look for the specified chart and version and return the download URL for the chart
func (m *Monocular) getChartURL(repoURL, name, version string) (string, error) {
	httpClient := m.portalProxy.GetHttpClient(true, "")

	helmIndexURL := joinURL(repoURL, "index.yaml")
	resp, err := httpClient.Get(helmIndexURL)

	if err != nil {
		return "", fmt.Errorf("Could not download Helm Repository Index: %s", err)
	}
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("Could not download Helm Repository Index: %s", resp.Status)
	}

	defer resp.Body.Close()

	// Marshal to the index structure
	var index IndexFile
	decoder := yaml.NewDecoder(resp.Body)
	err = decoder.Decode(&index)
	if err != nil {
		return "", fmt.Errorf("Error marshalling Helm Repository Index: %+v", err)
	}

	// Find the required version
	if chart, ok := index.Entries[name]; ok {
		for _, v := range chart {
			if v.Version == version {
				if len(v.URLs) > 0 {
					chartURL := v.URLs[0]
					return makeAbsoluteChartURL(chartURL, repoURL), nil
				}
			}
		}
	}

	return "", errors.New("Can not find Chart in the Helm Repository")
}

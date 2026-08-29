package monocular

import (
	"fmt"
	"log/slog"
	"strings"
	"time"

	yaml "go.yaml.in/yaml/v4"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/monocular/store"
	"github.com/google/uuid"
)

type syncResult struct {
	Charts []store.ChartStoreRecord
	Latest store.ChartStoreRecord
}

func (m *Monocular) syncHelmRepository(endpointID, repoName, url string) error {

	// Add index.yaml to the URL
	var downloadURL string

	// Append "index.yaml" to the Chart Repository URL
	if strings.HasSuffix(url, "/") {
		downloadURL = fmt.Sprintf("%sindex.yaml", url)
	} else {
		downloadURL = fmt.Sprintf("%s/index.yaml", url)
	}

	// Read the index.html file from the repository
	httpClient := m.portalProxy.GetHttpClient(false, "")
	resp, err := httpClient.Get(downloadURL)
	if err != nil {
		return fmt.Errorf("Could not download Helm Repository Index: %s", err)
	}
	if resp.StatusCode != 200 {
		return fmt.Errorf("Could not download Helm Repository Index: %s", resp.Status)
	}

	defer func() { _ = resp.Body.Close() }()

	// Marshal to the index structure
	var index IndexFile

	loader, err := yaml.NewLoader(resp.Body)
	if err == nil {
		err = loader.Load(&index)
	}
	if err != nil {
		return fmt.Errorf("Error marshalling Helm Repository Index: %+v", err)
	}

	var latestCharts []store.ChartStoreRecord
	var allCharts []store.ChartStoreRecord

	slog.Info("helm repository sync started", "endpoint", endpointID, "repository", repoName)
	start := time.Now()

	// Iterate over each chart in the index
	for name, chartVersions := range index.Entries {
		slog.Debug("helm repository sync: processing a chart",
			"endpoint", endpointID, "repository", repoName, "chart", name)
		syncRsult := m.procesChartVersions(endpointID, url, repoName, name, chartVersions)
		latestCharts = append(latestCharts, syncRsult.Latest)
		allCharts = append(allCharts, syncRsult.Charts...)
	}

	// Cache latest charts
	if err = m.cacheCharts(latestCharts); err != nil {
		slog.Warn("error caching the helm charts",
			"endpoint", endpointID, "repository", repoName, "error", err)
	}

	// Finally, delete all files that are no longer referenced in the database
	if err = m.cleanCacheFiles(endpointID, allCharts); err != nil {
		slog.Error("error cleaning unreferenced files from the helm chart cache",
			"endpoint", endpointID, "repository", repoName, "error", err)
	}

	elapsed := time.Since(start).Round(time.Second)
	slog.Info("helm repository sync completed",
		"endpoint", endpointID, "repository", repoName, "elapsed", elapsed)

	return nil
}

func (m *Monocular) procesChartVersions(endpoint, repoURL, repoName, name string, chartVersions []IndexFileMetadata) syncResult {

	result := syncResult{}

	// Find the newest version
	var latestSemVer *store.SemanticVersion
	for _, chartVersion := range chartVersions {
		sv := store.NewSemanticVersion(chartVersion.Version)
		if sv.LessThanReleaseVersions(latestSemVer) {
			latestSemVer = &sv
		}
	}

	latestVersion := latestSemVer.Text

	// Generate a new batch update id - we use this to remove any charts that we not updated in this sync - these
	// will have an old batch update id afetr processing
	batchID := uuid.New().String()

	// Write all versions database
	for _, chartVersion := range chartVersions {
		if len(chartVersion.URLs) == 0 {
			slog.Warn("can not index a chart version, it has no chart URLs",
				"endpoint", endpoint, "repository", repoName,
				"chart", chartVersion.Name, "version", chartVersion.Version)
		} else {
			if len(chartVersion.URLs) > 1 {
				slog.Warn("chart version has more than one chart URL, only using the first",
					"endpoint", endpoint, "repository", repoName,
					"chart", chartVersion.Name, "version", chartVersion.Version,
					"urlCount", len(chartVersion.URLs))
			}

			// Create a record for the Chart Version that we will store in the database
			record := store.ChartStoreRecord{
				EndpointID:  endpoint,
				Name:        chartVersion.Name,
				Repository:  repoName,
				Version:     chartVersion.Version,
				AppVersion:  chartVersion.AppVersion,
				Description: chartVersion.Description,
				IconURL:     chartVersion.Icon,
				ChartURL:    chartVersion.URLs[0],
				Sources:     chartVersion.Sources,
				Created:     chartVersion.Created,
				Digest:      chartVersion.Digest,
				IsLatest:    chartVersion.Version == latestVersion,
			}

			// Make sure Chart URL is absolute
			if urlDoesNotContainSchema(record.ChartURL) {
				record.ChartURL = joinURL(repoURL, record.ChartURL)
			}

			result.Charts = append(result.Charts, record)
			if record.IsLatest {
				result.Latest = record
			}

			if err := m.ChartStore.Save(record, batchID); err != nil {
				slog.Warn("error saving a chart version to the database",
					"endpoint", endpoint, "repository", repoName,
					"chart", record.Name, "version", record.Version, "error", err)
			}

			// Small delay mainly for SQLite so we don't hog the database connection
			time.Sleep(2 * time.Millisecond)
		}
	}

	// Delete versions not updated in this batch
	if err := m.ChartStore.DeleteBatch(endpoint, name, batchID); err != nil {
		slog.Warn("error deleting the superseded chart versions for a chart",
			"endpoint", endpoint, "repository", repoName,
			"chart", name, "batchID", batchID, "error", err)
	}

	return result
}

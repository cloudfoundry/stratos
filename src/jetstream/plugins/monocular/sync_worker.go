package monocular

import (
	"fmt"
	"strings"

	yaml "gopkg.in/yaml.v2"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/monocular/store"
	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"
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
	httpClient := m.portalProxy.GetHttpClient(false)
	resp, err := httpClient.Get(downloadURL)
	if err != nil {
		return fmt.Errorf("Could not download Helm Repository Index: %s", err)
	}
	if resp.StatusCode != 200 {
		return fmt.Errorf("Could not download Helm Repository Index: %s", resp.Status)
	}

	defer resp.Body.Close()

	// Marshal to the index structure
	var index IndexFile

	decoder := yaml.NewDecoder(resp.Body)
	err = decoder.Decode(&index)
	if err != nil {
		return fmt.Errorf("Error marshalling Helm Repository Index: %+v", err)
	}

	var latestCharts []store.ChartStoreRecord
	var allCharts []store.ChartStoreRecord

	// Iterate over each chart in the index
	for name, chartVersions := range index.Entries {
		log.Debugf("Helm Repository Sync: Processing chart: %s", name)
		syncRsult := m.procesChartVersions(endpointID, repoName, name, chartVersions)
		latestCharts = append(latestCharts, syncRsult.Latest)
		allCharts = append(allCharts, syncRsult.Charts...)
	}

	// Cache latest charts
	if err = m.cacheCharts(latestCharts); err != nil {
		log.Warnf("Error caching helm charts: %+v", err)
	}

	// Finally, delete all files that are no longer referenced in the database
	if err = m.cleanCacheFiles(endpointID, allCharts); err != nil {
		log.Errorf("%s", err)
	}

	log.Infof("Sync completed for %s", repoName)

	return nil
}

func (m *Monocular) procesChartVersions(endpoint, repoName, name string, chartVersions []IndexFileMetadata) syncResult {

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
	batchID := uuid.NewV4().String()

	// Write all versions database
	for _, chartVersion := range chartVersions {
		if len(chartVersion.URLs) == 0 {
			log.Warnf("Can not index Chart %s, Version %s - Chart does not have any Chart URLs", chartVersion.Name, chartVersion.Version)
		} else {
			if len(chartVersion.URLs) > 1 {
				log.Warnf("Chart %s, Version %s - Chart has more than 1 Chart URL - only using the first URL", chartVersion.Name, chartVersion.Version)
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

			result.Charts = append(result.Charts, record)
			if record.IsLatest {
				result.Latest = record
			}

			if err := m.ChartStore.Save(record, batchID); err != nil {
				log.Warnf("Error saving Chart %s, Version %s to the database: %+v", record.Name, record.Version, err)
			}
		}
	}

	// Delete versions not updated in this batch
	if err := m.ChartStore.DeleteBatch(endpoint, name, batchID); err != nil {
		log.Warnf("Error deleting old Chart batches: Name %s, Batch ID %s, error: %+v", name, batchID, err)
	}

	return result
}

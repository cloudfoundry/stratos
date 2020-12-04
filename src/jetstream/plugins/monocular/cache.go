package monocular

import (
	"archive/tar"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/monocular/store"
	log "github.com/sirupsen/logrus"
	yaml "gopkg.in/yaml.v2"
)

// Local Helm Chart Cache

// A local file cache stores chart files
// We only download the files for the latest version - other versions are downloaded on demand
// Within the cache there is a folder for each endpoint (helm repository) and under each of those
// a folder for each chart with chart files in ana a digest tag file

// If there are multiple Stratos backends, then each maintains its own cache

// The Chart index is stored in the database

const digestFilename = "digest"

// deleteCacheForEndpoint will delete all cached files for the given endpoint
func (m *Monocular) deleteCacheForEndpoint(endpointID string) error {
	endpointCacheFolder := path.Join(m.CacheFolder, endpointID)
	return os.RemoveAll(endpointCacheFolder)
}

// cacheCharts will cache charts in the local folder cache
func (m *Monocular) cacheCharts(charts []store.ChartStoreRecord) error {
	var errorCount = 0
	log.Debug("Cacheing charts")
	for _, chart := range charts {
		log.Debugf("Processing: %s", chart.Name)
		if err := m.cacheChart(chart); err != nil {
			errorCount++
			log.Warnf("Error cacheing chart: %s - %+v", chart.Name, err)
		}
		if _, err := m.cacheChartIcon(chart); err != nil {
			errorCount++
			log.Warnf("Error cacheing chart icon: %s - %+v", chart.Name, err)
		}

	}
	if errorCount > 0 {
		return errors.New("Error(s) occurred caching charts")
	}

	return nil
}

// Get the cache folder path for a chart
func (m *Monocular) getChartCacheFolder(chart store.ChartStoreRecord) string {
	filename := fmt.Sprintf("%s_%s", chart.Name, chart.Version)
	return path.Join(m.CacheFolder, chart.EndpointID, filename)
}

// cleanCacheFiles will Clean all files in the folder for an endpoint that are not referenced by any of the charts we have for that endpoint
func (m *Monocular) cleanCacheFiles(endpointID string, allCharts []store.ChartStoreRecord) error {

	// Build map of the valid chart folder names
	validFiles := make(map[string]bool)
	for _, chart := range allCharts {
		validFiles[m.getChartCacheFolder(chart)] = true
	}

	endpointCacheFolder := path.Join(m.CacheFolder, endpointID)
	// Don't delete the top-level cache folder for the endpoint
	validFiles[endpointCacheFolder] = true
	errorCount := 0
	filepath.Walk(endpointCacheFolder, func(path string, info os.FileInfo, err error) error {
		if err == nil && info.IsDir() {
			if _, ok := validFiles[path]; !ok {
				// Filename does not exist in the map of valid file names
				log.Debugf("Need to delete unused cache folder: %s", path)
				if err := os.RemoveAll(path); err != nil {
					log.Errorf("Could not delete folder %s - %+v", path, err)
					errorCount++
				}
			}
		}
		return nil
	})

	if errorCount > 0 {
		return fmt.Errorf("Error(s) occurred cleaning unused folders from the cache folder for endpoint %s", endpointID)
	}

	return nil
}

// Is there a chart digest in the given folder with the given value?
func hasDigestFile(chartCachePath, digest string) bool {
	data, err := ioutil.ReadFile(path.Join(chartCachePath, digestFilename))
	if err == nil {
		chk := strings.TrimSpace(string(data))
		return chk == digest
	}

	return false
}

// write the chart digest to a file
func writeDigestFile(chartCachePath, digest string) error {
	return ioutil.WriteFile(path.Join(chartCachePath, digestFilename), []byte(digest), 0644)
}

func (m *Monocular) getChartYaml(chart store.ChartStoreRecord) *ChartMetadata {
	// Cache the Chart if we don't have it already
	m.cacheChart(chart)
	return readChartYaml(m.getChartCacheFolder(chart))
}

func readChartYaml(cacheFolder string) *ChartMetadata {
	chartCacheYamlPath := path.Join(cacheFolder, "Chart.yaml")
	if _, err := os.Stat(chartCacheYamlPath); os.IsNotExist(err) {
		return nil
	}

	// Check we can unmarshall the request
	data, err := ioutil.ReadFile(chartCacheYamlPath)
	if err != nil {
		return nil
	}

	// Parse as yaml
	var chartYaml ChartMetadata
	err = yaml.Unmarshal(data, &chartYaml)
	if err != nil {
		return nil
	}
	return &chartYaml
}

// Get the cache file path for the chart icon
func (m *Monocular) getIconCacheFile(chart store.ChartStoreRecord) string {
	ext := ""
	u, err := url.Parse(chart.IconURL)
	if err == nil {
		parts := strings.Split(u.Path, "/")
		filename := parts[len(parts)-1]
		index := strings.LastIndex(filename, ".")
		if index != -1 {
			ext = filename[index:]
		}
	}

	filename := fmt.Sprintf("icon%s", ext)
	return path.Join(m.getChartCacheFolder(chart), filename)
}

func (m *Monocular) ensureFolder(path string) error {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return os.MkdirAll(path, os.ModePerm)
	}

	return nil
}

// Cache chart
// Check to see if we already have files for the given chart - if not, download the archive
// and extract the files we need:
// Chart.yaml, README.md, values.yaml, values.schema.json
// Download the icon as well
func (m *Monocular) cacheChart(chart store.ChartStoreRecord) error {
	log.Debugf("Cacheing chart: %s, %s", chart.Name, chart.Version)

	chartCachePath := m.getChartCacheFolder(chart)
	if err := m.ensureFolder(chartCachePath); err != nil {
		log.Warnf("Could not create folder for chart downloads: %+v", err)
		return err
	}

	return m.cacheChartFromURL(chartCachePath, chart.Digest, chart.Name, chart.ChartURL)
}

func (m *Monocular) cacheChartFromURL(chartCachePath, digest, name, chartURL string) error {
	// Check to see if we have the same digest
	if ok := hasDigestFile(chartCachePath, digest); ok {
		log.Debug("Skipping download - already have archive with the same digest")
		return nil
	}

	archiveFile := path.Join(chartCachePath, "chart.tgz")
	if _, err := m.downloadFile(archiveFile, chartURL); err != nil {
		return fmt.Errorf("Could not download chart from: %s - %+v", chartURL, err)
	}

	sum, err := getFileChecksum(archiveFile)
	if err != nil {
		return fmt.Errorf("Could not calculate checksum for chart archive: %s - %+v", archiveFile, err)
	}

	if err := writeDigestFile(chartCachePath, sum); err != nil {
		return fmt.Errorf("Could not write chart digest file in: %s - %+v", chartCachePath, err)
	}

	// Now extract the files we need
	filenames := []string{"Chart.yaml", "README.md", "values.schema.json", "values.yaml"}
	if err := extractArchiveFiles(archiveFile, name, chartCachePath, filenames); err != nil {
		return fmt.Errorf("Could not extract files from chart archive: %s - %+v", archiveFile, err)
	}

	// We can delete the Chart archive - don't need it anymore
	os.Remove(archiveFile)

	return nil
}

// Cache a chart icon
func (m *Monocular) cacheChartIcon(chart store.ChartStoreRecord) (string, error) {
	log.Debugf("Cacheing chart icon: %s, %s", chart.Name, chart.Version)
	if len(chart.IconURL) > 0 {
		log.Debugf("Downloading chart icon: %s", chart.IconURL)
		// If icon file already exists then don't download again
		iconFilePath := m.getIconCacheFile(chart)
		if _, err := os.Stat(iconFilePath); os.IsNotExist(err) {
			if err := m.ensureFolder(path.Dir(iconFilePath)); err != nil {
				log.Error(err)
			} else if _, err := m.downloadFile(iconFilePath, chart.IconURL); err != nil {
				log.Errorf("Could not download chart icon: %+v", err)
				return "", fmt.Errorf("Could not download Chart icon: %+v", err)
			}
		}
		return iconFilePath, nil
	}

	return "", nil
}

// download a file from the given url and save to the file path
func (m *Monocular) downloadFile(filepath string, url string) (string, error) {
	// Get the data
	httpClient := m.portalProxy.GetHttpClient(false, "")
	resp, err := httpClient.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Error downloading icon: %s - %d:%s", url, resp.StatusCode, resp.Status)
	}

	// Create the file
	out, err := os.Create(filepath)
	if err != nil {
		return "", err
	}
	defer out.Close()

	// Write the body to file
	_, err = io.Copy(out, resp.Body)
	return resp.Header.Get("Content-Type"), err
}

func extractArchiveFiles(archivePath, chartName, downloadFolder string, filenames []string) error {
	// Map the filenames array into a map of path to destination file
	requiredFiles := make(map[string]string)
	requiredCount := len(filenames)
	for _, name := range filenames {
		requiredFiles[fmt.Sprintf("%s/%s", chartName, name)] = path.Join(downloadFolder, name)
	}

	f, err := os.Open(archivePath)
	if err != nil {
		log.Error("Helm: Archive extract file: Could not open file %s - %+v", archivePath, err)
		return err
	}
	defer f.Close()

	gzf, err := gzip.NewReader(f)
	if err != nil {
		log.Error("Helm: Archive extract file: Could not open zip file %s - %+v", archivePath, err)
		return err
	}

	tarReader := tar.NewReader(gzf)
	for {
		header, err := tarReader.Next()
		if err == io.EOF {
			break
		}

		if err != nil {
			log.Error("Helm: Archive extract file: Could not process archive file %s - %+v", archivePath, err)
			return err
		}

		name := header.Name
		switch header.Typeflag {
		case tar.TypeDir:
			continue
		case tar.TypeReg:
			// Is this a file we are looking for?
			if downloadPath, ok := requiredFiles[name]; ok {
				// Create the file
				out, err := os.Create(downloadPath)
				if err != nil {
					return err
				}
				defer out.Close()

				io.Copy(out, tarReader)

				// If we have extracted all of the files we are looking for, then return early, rather than
				// going through the rest of the files
				requiredCount--
				if requiredCount == 0 {
					return nil
				}
			}
		}
	}

	return nil
}

// get the SHA256 checksum for a file
func getFileChecksum(file string) (string, error) {
	f, err := os.Open(file)
	if err != nil {
		return "", err
	}
	defer f.Close()
	hasher := sha256.New()
	if _, err := io.Copy(hasher, f); err != nil {
		return "", err
	}

	return hex.EncodeToString(hasher.Sum(nil)), nil
}

// Is the specified file name one for the files we permit to be served up
func isPermittedFile(name string) bool {
	filenames := []string{"Chart.yaml", "README.md", "values.schema.json", "values.yaml"}
	for _, f := range filenames {
		if f == name {
			return true
		}
	}

	return false
}

func joinURL(base, name string) string {
	// Avoid double slashes
	sep := "/"
	if strings.HasSuffix(base, "/") {
		sep = ""
	}
	return fmt.Sprintf("%s%s%s", base, sep, name)
}

func makeAbsoluteChartURL(chartURL, repoURL string) string {
	// Check for relative URL
	if !strings.HasPrefix(chartURL, "http://") && !strings.HasPrefix(chartURL, "https://") {
		// Relative to the download URL
		chartURL = joinURL(repoURL, chartURL)
	}
	return chartURL
}

func urlDoesNotContainSchema(chartURL string) bool {
	return !strings.HasPrefix(chartURL, "http://") && !strings.HasPrefix(chartURL, "https://")
}

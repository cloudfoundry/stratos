package helm

import (
	"archive/tar"
	"compress/gzip"
	b64 "encoding/base64"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/user"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"

	yaml "gopkg.in/yaml.v2"
)

// CFConfigFile represents the data we need for CF config file
type CFConfigFile struct {
	APIEndpoint            string `json:"Target"`
	AuthorizationEndpoint  string `json:"AuthorizationEndpoint"`
	TokenEndpoint          string `json:"UaaEndpoint"`
	DopplerLoggingEndpoint string `json:"DopplerEndPoint"`
	SkipSSLValidation      bool   `json:"SSLDisabled"`
	ClientID               string `json:"UAAOAuthClient"`
	ClientSecret           string `json:"UAAOAuthClientSecret"`
	AccessToken            string `json:"AccessToken"`
	RefreshToken           string `json:"RefreshToken"`
}

type helmRepositoryInfo struct {
	Name     string `yaml:"name"`
	Insecure bool   `yaml:"insecure_skip_tls_verify"`
	URL      string `yaml:"url"`
}

type helmRepositoriesFile struct {
	APIVersion   string               `yaml:"apiVersion"`
	Repositories []helmRepositoryInfo `yaml:"repositories"`
}

// ListHelmRepositories will list Helm Repositories configured locally
func ListHelmRepositories() ([]*api.CNSIRecord, error) {

	cfg, err := readHelmRepoFile()
	if err != nil {
		log.Errorf("Could not read helm repository config file: %s", err)
		return nil, err
	}

	// Add an endpoint for each cluster
	var eps []*api.CNSIRecord
	for _, repo := range cfg.Repositories {
		apiEndpoint, err := url.Parse(repo.URL)
		if err == nil {
			eps = append(eps, &api.CNSIRecord{
				GUID:                   getEndpointGUID(repo.URL),
				Name:                   repo.Name,
				CNSIType:               "helm",
				APIEndpoint:            apiEndpoint,
				AuthorizationEndpoint:  "",
				DopplerLoggingEndpoint: "",
				TokenEndpoint:          "",
				SkipSSLValidation:      repo.Insecure,
				SSOAllowed:             false,
				ClientId:               "",
				ClientSecret:           "",
				Local:                  true,
				SubType:                "repo",
			})
		}
	}

	u, _ := url.Parse("https://artifacthub.io")

	// Add Artifact Hub in
	eps = append(eps, &api.CNSIRecord{
		GUID:                   getEndpointGUID("https://artifacthub.io"),
		Name:                   "Artifact Hub",
		CNSIType:               "helm",
		APIEndpoint:            u,
		AuthorizationEndpoint:  "",
		DopplerLoggingEndpoint: "",
		TokenEndpoint:          "",
		SkipSSLValidation:      false,
		SSOAllowed:             false,
		ClientId:               "",
		ClientSecret:           "",
		Local:                  true,
		SubType:                "hub",
	})

	return eps, nil
}

// ListConnectedCloudFoundry will list Cloud Foundry endpoints configured locally (can be only one)
func ListConnectedKubernetes() ([]*api.ConnectedEndpoint, error) {

	cfg, err := readHelmRepoFile()
	if err != nil {
		log.Errorf("Could not read kube config file: %s", err)
		return nil, err
	}

	// Add an endpoint for each cluster
	var eps []*api.ConnectedEndpoint
	for _, repo := range cfg.Repositories {
		apiEndpoint, err := url.Parse(repo.URL)
		if err == nil {
			eps = append(eps, &api.ConnectedEndpoint{
				GUID:                   getEndpointGUID(repo.URL),
				Name:                   repo.Name,
				CNSIType:               "helm",
				APIEndpoint:            apiEndpoint,
				AuthorizationEndpoint:  "",
				DopplerLoggingEndpoint: "",
				Account:                "local",
				TokenExpiry:            20000,
				SkipSSLValidation:      repo.Insecure,
				Local:                  true,
			})
		}
	}

	return eps, nil
}

func readHelmRepoFile() (*helmRepositoriesFile, error) {

	cfgFolder, err := getConfigFolder()
	if err != nil {
		return nil, err
	}
	helmFile := filepath.Join(cfgFolder, "repositories.yaml")

	// Check we can unmarshall the request
	data, err := os.ReadFile(helmFile)
	if err != nil {
		return nil, fmt.Errorf("can not read Kubeconfig file: %s", err)
	}

	// Parse as yaml
	var repos helmRepositoriesFile
	err = yaml.Unmarshal(data, &repos)
	if err != nil {
		return nil, fmt.Errorf("can not parse Helm Repositories file: %s", err)
	}

	return &repos, nil
}

func getConfigFolder() (string, error) {

	usr, err := user.Current()
	if err != nil {
		return "", err
	}

	if runtime.GOOS == "darwin" {
		return filepath.Join(usr.HomeDir, "Library", "Preferences", "helm"), nil
	}

	// TODO: Windows

	return filepath.Join(usr.HomeDir, ".config", "helm"), nil
}

func getCacheFolder() (string, error) {

	usr, err := user.Current()
	if err != nil {
		return "", err
	}

	if runtime.GOOS == "darwin" {
		return filepath.Join(usr.HomeDir, "Library", "Caches", "helm"), nil
	}

	// TODO: Windows

	return filepath.Join(usr.HomeDir, ".cache", "helm"), nil
}

func getAllCharts() ([]IndexFileMetadata, error) {

	folder, err := getCacheFolder()
	if err != nil {
		return nil, err
	}

	repoCache := filepath.Join(folder, "repository")
	// Process all .yaml files in the folder

	var allCharts []IndexFileMetadata

	repos, err := readHelmRepoFile()
	if err != nil {
		return nil, err
	}

	for _, repo := range repos.Repositories {
		indexFile := filepath.Join(repoCache, fmt.Sprintf("%s-index.yaml", repo.Name))
		charts, err := processIndexFile(indexFile, repo)
		if err == nil {
			allCharts = append(allCharts, charts...)
		} else {
			log.Errorf("%+v", err)
		}
	}

	log.Infof("GOT %d", len(allCharts))
	return allCharts, err
}

func processIndexFile(path string, repo helmRepositoryInfo) ([]IndexFileMetadata, error) {

	// Check we can unmarshall the request
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("can not read repository index file: %s", err)
	}

	// Parse as yaml
	var repos IndexFile
	err = yaml.Unmarshal(data, &repos)
	if err != nil {
		return nil, fmt.Errorf("can not parse repository index file: %s", err)
	}

	var charts []IndexFileMetadata
	for _, ch := range repos.Entries {
		for _, chart := range ch {
			chart.Repo = Repo{
				Name: repo.Name,
				URL:  repo.URL,
			}
			charts = append(charts, chart)
		}
	}

	return charts, nil
}

func collateCharts(metadatas []IndexFileMetadata) ([]apiResponse, map[string]apiResponse) {

	var response []apiResponse

	latestVersion := make(map[string]chartVersion)
	charts := make(map[string]apiResponse)

	for _, chart := range metadatas {
		id := fmt.Sprintf("%s/%s", chart.Repo.Name, chart.Name)

		// Have we already procesed this chart?
		if _, ok := charts[id]; !ok {
			// New - so this must be the newest version
			latestVersion[id] = getChartVersion(chart)

			// Attributes
			attrs := getChartMetadata(chart)

			// Convert
			charts[id] = apiResponse{
				ID:            id,
				Type:          "Chart",
				Attributes:    attrs,
				Relationships: make(map[string]rel),
			}
			charts[id].Relationships["latestChartVersion"] = rel{
				Data: latestVersion[id],
			}
		} else {
			// Check the version number
			if isNewerVersion(chart.Version, latestVersion[id].Version) {
				latestVersion[id] = getChartVersion(chart)
				charts[id].Relationships["latestChartVersion"] = rel{
					Data: latestVersion[id],
				}
			}
		}
	}

	for _, c := range charts {
		response = append(response, c)
	}

	return response, charts
}

func isNewerVersion(newv, oldv string) bool {

	// If the old version is pre-release then always prefer the new version
	if strings.Index(oldv, "-") > 0 {
		return true
	}

	nv, ok := parseVersion(newv)
	if !ok {
		return false
	}
	ov, ok := parseVersion(oldv)
	if !ok {
		return true
	}

	if nv[0] > ov[0] {
		return true
	} else if nv[0] < ov[0] {
		return false
	}

	if nv[1] > ov[1] {
		return true
	} else if nv[1] < ov[1] {
		return false
	}

	if nv[2] > ov[2] {
		return true
	}

	return false
}

func parseVersion(v string) ([]int, bool) {

	version := make([]int, 3)

	bits := strings.Split(v, ".")
	i, ok := strconv.Atoi(bits[0])
	if ok != nil {
		return version, false
	}
	version[0] = i
	i, ok = strconv.Atoi(bits[1])
	if ok != nil {
		return version, false
	}
	version[1] = i
	i, ok = strconv.Atoi(bits[2])
	if ok != nil {
		return version, false
	}
	version[2] = i

	return version, true
}

func getChartMetadata(indexData IndexFileMetadata) chartAttributes {

	id := fmt.Sprintf("%s/%s", indexData.Repo.Name, indexData.Name)
	icon := ""
	if len(indexData.Icon) > 0 {
		icon = fmt.Sprintf("/icon/%s", b64.StdEncoding.EncodeToString([]byte(indexData.Icon)))
	}

	// Attributes
	attrs := chartAttributes{
		ID:          id,
		Name:        indexData.Name,
		Description: indexData.Description,
		Keywords:    make([]string, 0),
		Maintainers: make([]chartMaintainer, 0),
		Icon:        icon,
		Repo:        indexData.Repo,
		Sources:     make([]string, 0),
	}

	return attrs
}

func getChartVersion(indexData IndexFileMetadata) chartVersion {
	return chartVersion{
		Version:    indexData.Version,
		AppVersion: indexData.AppVersion,
		Digest:     indexData.Digest,
		//Description: chart.Description,
		Created: indexData.Created,
		Readme:  fmt.Sprintf("/v1/charts/%s/%s/versions/%s/files/README.md", indexData.Repo.Name, indexData.Name, indexData.Version),
		Values:  fmt.Sprintf("/v1/charts/%s/%s/versions/%s/files/values.yaml", indexData.Repo.Name, indexData.Name, indexData.Version),
		URLs:    indexData.URLs,
	}
}

func collateChartVersions(metadatas []IndexFileMetadata, chartID string) []apiResponse {

	versions := make([]apiResponse, 0)
	for _, chart := range metadatas {
		id := fmt.Sprintf("%s/%s", chart.Repo.Name, chart.Name)

		if id == chartID {
			// Got a version for the spcified chart
			vers := getChartVersion(chart)
			attrs := getChartMetadata(chart)
			version := apiResponse{
				ID:         fmt.Sprintf("%s-%s", id, vers.Version),
				Type:       "chartVersion",
				Attributes: vers,
			}

			version.Relationships = make(map[string]rel)
			version.Relationships["chart"] = rel{
				Data: attrs,
			}

			versions = append(versions, version)
		}
	}

	return versions
}

func fileExists(filename string) bool {
	info, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}

func getLocalChartFilePath(urls []string) (string, error) {

	if len(urls) == 0 {
		return "", errors.New("no chart download URLs")
	}

	urlParts := strings.Split(urls[0], "/")
	chartFile := urlParts[len(urlParts)-1]

	// Look to see if the file already exists

	cacheFilder, err := getCacheFolder()
	if err != nil {
		return "", errors.New("can not get cache folder")
	}

	path := filepath.Join(cacheFilder, "repository", chartFile)
	if fileExists(path) {
		return path, nil
	}

	// Download the file
	err = downloadFile(path, urls[0])
	return path, err
}

func downloadFile(filepath string, url string) error {

	// Get the data
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Create the file
	out, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer out.Close()

	// Write the body to file
	_, err = io.Copy(out, resp.Body)
	return err
}

func getArchiveFile(c echo.Context, archivePath, filename string) error {

	f, err := os.Open(archivePath)
	if err != nil {
		fmt.Println(err)
		return err
	}
	defer f.Close()

	gzf, err := gzip.NewReader(f)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	tarReader := tar.NewReader(gzf)

	for {
		header, err := tarReader.Next()

		if err == io.EOF {
			break
		}

		if err != nil {
			fmt.Println(err)
			return err
		}

		name := header.Name
		switch header.Typeflag {
		case tar.TypeDir:
			continue
		case tar.TypeReg:
			if name == filename {
				io.Copy(c.Response().Writer, tarReader)
				return nil
			}
		}
	}

	return errors.New("can not find file in archive")
}

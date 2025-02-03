package helm

import (
	b64 "encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

// RegisterRoutes adss the routes needed to serve chart info for the local Helm repositories
func RegisterRoutes(echoGroup *echo.Group) {
	// echoGroup.Any("/chartsvc/*", m.handleAPI)
	// echoGroup.POST("/chartrepos/status", m.GetRepoStatuses)
	// echoGroup.POST("/chartrepos/:guid", m.SyncRepo)

	// Get specific chart version file (used for values.yaml)
	echoGroup.GET("/chartsvc/v1/assets/:repo/:name/versions/:version/:filename", getChartAndVersionFile)

	// Get specific chart version file
	echoGroup.GET("/chartsvc/v1/charts/:repo/:name/versions/:version/files/:filename", getChartAndVersionFile)

	// Get specific chart version
	echoGroup.GET("/chartsvc/v1/charts/:repo/:name/versions/:version", getChartAndVersion)

	// Get chart versions
	echoGroup.GET("/chartsvc/v1/charts/:repo/:name/versions", getChartVersions)

	// Get a chart
	echoGroup.GET("/chartsvc/v1/charts/:repo/:name", getChart)

	// Get list of charts
	echoGroup.GET("/chartsvc/v1/charts", listCharts)
	echoGroup.GET("/chartsvc/icon/:icon", getIcon)

}

func listCharts(c echo.Context) error {

	log.Debug("List Charts called")

	charts, err := getAllCharts()
	if err != nil {
		return err
	}

	list, _ := collateCharts(charts)
	meta := metaData{
		TotalPages: 1,
	}

	body := bodyAPIListResponse{
		Data: list,
		Meta: meta,
	}

	jsonString, err := json.Marshal(body)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)

	return nil
}

func getChart(c echo.Context) error {

	log.Debug("Get Chart")

	repoName := c.Param("repo")
	name := c.Param("name")
	id := fmt.Sprintf("%s/%s", repoName, name)

	charts, err := getAllCharts()
	if err != nil {
		return err
	}

	_, chartMap := collateCharts(charts)

	data, ok := chartMap[id]

	if !ok {
		return errors.New("Can not find chart")
	}

	// Find the latest version for the chart

	body := bodyAPIResponse{
		Data: data,
	}

	jsonString, err := json.Marshal(body)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)

	return nil
}

func getChartVersions(c echo.Context) error {

	log.Debug("Get Chart Versions")

	repoName := c.Param("repo")
	name := c.Param("name")
	id := fmt.Sprintf("%s/%s", repoName, name)

	charts, err := getAllCharts()
	if err != nil {
		return err
	}

	vers := collateChartVersions(charts, id)

	body := bodyAPIListResponse{
		Data: vers,
	}

	jsonString, err := json.Marshal(body)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)

	return nil
}

func getChartAndVersion(c echo.Context) error {

	log.Error("Get Chart Version")

	repoName := c.Param("repo")
	name := c.Param("name")
	version := c.Param("version")
	id := fmt.Sprintf("%s/%s", repoName, name)

	charts, err := getAllCharts()
	if err != nil {
		return err
	}

	vers := collateChartVersions(charts, id)

	versionID := fmt.Sprintf("%s/%s-%s", repoName, name, version)

	// Find the version
	for _, v := range vers {
		log.Info(v.ID)
		if v.ID == versionID {
			body := bodyAPIResponse{
				Data: v,
			}

			jsonString, err := json.Marshal(body)
			if err != nil {
				return err
			}

			c.Response().Header().Set("Content-Type", "application/json")
			c.Response().Write(jsonString)

			return nil
		}
	}

	return errors.New("Chart version not found")
}

func getIcon(c echo.Context) error {

	log.Debug("Get Icon called")

	id := c.Param("icon")
	icon, _ := b64.StdEncoding.DecodeString(id)

	resp, err := http.Get(string(icon))
	if err != nil {
		return err
	}

	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		http.Redirect(c.Response().Writer, c.Request(), "/core/assets/custom/placeholder.png", http.StatusTemporaryRedirect)
		return nil
	}

	c.Response().Status = resp.StatusCode
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	for name, value := range resp.Header {
		for _, v := range value {
			c.Response().Header().Add(name, v)
		}
	}

	c.Response().Write(body)

	return nil

}

func getChartAndVersionFile(ec echo.Context) error {

	//echoGroup.GET("/chartsvc/v1/charts/:repo/:name/versions/:version/files/:filename", getChartAndVersionFile)

	log.Debug("Get Chart Version File")

	repoName := ec.Param("repo")
	name := ec.Param("name")
	version := ec.Param("version")
	filename := ec.Param("filename")
	id := fmt.Sprintf("%s/%s", repoName, name)

	// Find the chart for this version
	charts, err := getAllCharts()
	if err != nil {
		return err
	}

	vers := collateChartVersions(charts, id)
	versionID := fmt.Sprintf("%s/%s-%s", repoName, name, version)

	// Find the version
	for _, v := range vers {
		log.Info(v.ID)
		if v.ID == versionID {
			// Got chart version
			if c, ok := v.Attributes.(chartVersion); ok {
				path, err := getLocalChartFilePath(c.URLs)
				if err == nil {
					err = getArchiveFile(ec, path, fmt.Sprintf("%s/%s", name, filename))
					return err

				}
			}
			return nil
		}
	}

	return errors.New("File not found")
}

package monocular

import (
	"encoding/json"
	"errors"
	"io/ioutil"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
)

type HelmRepoInfo struct {
	ID         string `json:"id"`
	Type       string `json:"type"`
	Attributes struct {
		Name string `json:"name"`
		URL  string `json:"url"`
	} `json:"attributes"`
}

type helmStatusInfo map[string]bool

func (m *Monocular) ListRepos(c echo.Context) error {
	log.Debug("ListRepos")

	endpoints, err := m.portalProxy.ListEndpoints()
	if err != nil {
		return errors.New("Could not get endpoints")
	}

	repos := make([]HelmRepoInfo, 0)
	for _, ep := range endpoints {
		if ep.CNSIType == helmEndpointType {
			// Helm endpoint
			repo := HelmRepoInfo{
				ID:   ep.Name,
				Type: "repository",
			}
			repo.Attributes.Name = ep.Name
			repo.Attributes.URL = ep.APIEndpoint.String()
			repos = append(repos, repo)
		}
	}

	return c.JSON(200, repos)
}

// GetRepoStatuses will get the status of the Helm Endpoints requested
func (m *Monocular) GetRepoStatuses(c echo.Context) error {
	log.Debug("GetRepoStatuses")

	// Get the list of endpoints we are looking at
	// Need to extract the parameters from the request body
	req := c.Request()
	defer req.Body.Close()
	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return interfaces.NewJetstreamError("Could not read request body")
	}

	info := helmStatusInfo{}
	if err := json.Unmarshal(body, &info); err == nil {
		for guid := range info {
			newVal := false
			if endpoint, err := m.portalProxy.GetCNSIRecord(guid); err == nil {
				if len(endpoint.Metadata) > 0 {
					status := SyncMetadata{}
					if err = json.Unmarshal([]byte(endpoint.Metadata), &status); err == nil {
						newVal = status.Busy
					}
				}
			}
			info[guid] = newVal
		}
	} else {
		return interfaces.NewJetstreamError("Could not parse Helm Endpoint IDs")
	}

	return c.JSON(200, info)
}

package monocular

import (
	"errors"

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

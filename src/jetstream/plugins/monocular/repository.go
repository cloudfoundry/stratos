package monocular

import (
	"encoding/json"
	"io/ioutil"

	"github.com/cloudfoundry-community/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

type helmStatusInfo map[string]bool

// getRepoStatuses will get the status of the Helm Endpoints requested
func (m *Monocular) getRepoStatuses(c echo.Context) error {
	log.Debug("getRepoStatuses")

	// Get the list of endpoints we are looking at
	// Need to extract the parameters from the request body
	req := c.Request()
	defer req.Body.Close()
	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return api.NewJetstreamError("Could not read request body")
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
		return api.NewJetstreamError("Could not parse Helm Endpoint IDs")
	}

	return c.JSON(200, info)
}

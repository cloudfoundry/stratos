package monocular

import (
	"encoding/json"
	"io"
	"log/slog"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v5"
)

type helmStatusInfo map[string]bool

// getRepoStatuses will get the status of the Helm Endpoints requested
func (m *Monocular) getRepoStatuses(c *echo.Context) error {
	slog.Debug("getting helm repository sync statuses")

	// Get the list of endpoints we are looking at
	// Need to extract the parameters from the request body
	req := c.Request()
	defer func() { _ = req.Body.Close() }()
	body, err := io.ReadAll(req.Body)
	if err != nil {
		const msg = "could not read the request body"
		slog.Error(msg, "error", err)
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
		const msg = "could not parse the helm endpoint IDs"
		slog.Error(msg, "error", err)
		return api.NewJetstreamError("Could not parse Helm Endpoint IDs")
	}

	return c.JSON(200, info)
}

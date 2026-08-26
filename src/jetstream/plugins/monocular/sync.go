package monocular

import (
	"encoding/json"
	"log/slog"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v5"
)

type SyncJob struct {
	Action   api.EndpointAction
	Endpoint *api.CNSIRecord
}

type SyncMetadata struct {
	Status string `json:"status"`
	Busy   bool   `json:"busy"`
}

// Sync Channel
var syncChan = make(chan SyncJob, 100)

// InitSync starts the go routine that will sync repositories in the background
func (m *Monocular) InitSync() {
	go m.processSyncRequests()
}

// syncRepo is endpoint to force a re-sync of a given Helm Repository
func (m *Monocular) syncRepo(c *echo.Context) error {
	slog.Debug("helm repository sync requested")

	// Lookup repository by GUID
	var p = m.portalProxy
	guid := c.Param("guid")
	endpoint, err := p.GetCNSIRecord(guid)
	if err != nil {
		const msg = "could not find helm repository"
		slog.Error(msg, "endpoint", guid, "error", err)
		return api.NewJetstreamErrorf("%s: %v", msg, err)
	}

	m.Sync(api.EndpointRegisterAction, &endpoint)

	response := "OK"
	return c.JSON(200, response)
}

// Sync schedules a sync action for the given endpoint
func (m *Monocular) Sync(action api.EndpointAction, endpoint *api.CNSIRecord) {
	// Delete and Update are Synchronously handled
	// Add (Sync) is handled Asynchronously via a SyncJob
	if action == 0 {
		// If the sync job is busy, it won't update the status of this new job until it completes the previous one
		// Set the status to indicate it is pending
		metadata := SyncMetadata{
			Status: "Pending",
			Busy:   true,
		}
		m.updateMetadata(endpoint.GUID, metadata)

		// Add the job to the queue to be processed
		job := SyncJob{
			Action:   action,
			Endpoint: endpoint,
		}

		// Schedula a sync job
		syncChan <- job
	} else if action == 1 {
		slog.Debug("deleting helm repository", "endpoint", endpoint.GUID, "name", endpoint.Name)
		m.deleteChartStoreForEndpoint(endpoint.GUID)
	} else if action == 2 {
		slog.Debug("helm repository updated, renaming the repository field in the associated charts",
			"endpoint", endpoint.GUID, "name", endpoint.Name)
		if err := m.ChartStore.RenameEndpoint(endpoint.GUID, endpoint.Name); err != nil {
			slog.Error("failed to rename the helm repository in the chart store",
				"endpoint", endpoint.GUID, "name", endpoint.Name, "error", err)
		}
	}
}

func (m *Monocular) deleteChartStoreForEndpoint(id string) {
	// Delete the records from the database
	if err := m.ChartStore.DeleteForEndpoint(id); err != nil {
		slog.Warn("unable to delete the helm charts for an endpoint", "endpoint", id, "error", err)
	}

	// Delete files from the cache
	if err := m.deleteCacheForEndpoint(id); err != nil {
		slog.Warn("unable to delete the helm chart cache for an endpoint", "endpoint", id, "error", err)
	}
}

func (m *Monocular) processSyncRequests() {
	slog.Info("helm repository sync worker started")
	for job := range syncChan {
		slog.Debug("processing a helm repository sync job",
			"endpoint", job.Endpoint.GUID, "name", job.Endpoint.Name)
		metadata := SyncMetadata{
			Status: "Synchronizing",
			Busy:   true,
		}
		m.updateMetadata(job.Endpoint.GUID, metadata)

		chartIndexURL := job.Endpoint.APIEndpoint.String()
		metadata.Status = "Synchronized"
		metadata.Busy = false
		err := m.syncHelmRepository(job.Endpoint.GUID, job.Endpoint.Name, chartIndexURL)
		if err != nil {
			slog.Warn("helm repository sync failed",
				"endpoint", job.Endpoint.GUID, "name", job.Endpoint.Name, "error", err)
			metadata.Status = "Sync Failed"
		}

		// Update the job status
		m.updateMetadata(job.Endpoint.GUID, metadata)
	}
	slog.Debug("helm repository sync worker finished")
}

func (m *Monocular) updateMetadata(endpoint string, metadata SyncMetadata) {
	err := m.portalProxy.UpdateEndpointMetadata(endpoint, marshalSyncMetadata(metadata))
	if err != nil {
		slog.Error("failed to update the endpoint metadata", "endpoint", endpoint, "error", err)
	}
}

func marshalSyncMetadata(metadata SyncMetadata) string {
	jsonString, err := json.Marshal(metadata)
	if err != nil {
		return ""
	}
	return string(jsonString)
}

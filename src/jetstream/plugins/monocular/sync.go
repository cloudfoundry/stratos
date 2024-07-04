package monocular

import (
	"encoding/json"

	"github.com/cloudfoundry-community/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
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
func (m *Monocular) syncRepo(c echo.Context) error {
	log.Debug("syncRepo")

	// Lookup repository by GUID
	var p = m.portalProxy
	guid := c.Param("guid")
	endpoint, err := p.GetCNSIRecord(guid)
	if err != nil {
		return api.NewJetstreamErrorf("Could not find Helm Repository: %v+", err)
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
		m.portalProxy.UpdateEndpointMetadata(endpoint.GUID, marshalSyncMetadata(metadata))

		// Add the job to the queue to be processed
		job := SyncJob{
			Action:   action,
			Endpoint: endpoint,
		}

		// Schedula a sync job
		syncChan <- job
	} else if action == 1 {
		log.Debugf("Deleting Helm Repository: %s", endpoint.Name)
		m.deleteChartStoreForEndpoint(endpoint.GUID)
	} else if action == 2 {
		log.Debugf("Helm Repository has been updated - renaming the Helm repository field in the associated charts")
		if err := m.ChartStore.RenameEndpoint(endpoint.GUID, endpoint.Name); err != nil {
			log.Errorf("An error occurred renameing the Helm Repository for endpoint %s to %s - %+v", endpoint.GUID, endpoint.Name, err)
		}
	}
}

func (m *Monocular) deleteChartStoreForEndpoint(id string) {
	// Delete the records from the database
	if err := m.ChartStore.DeleteForEndpoint(id); err != nil {
		log.Warnf("Unable to delete Helm Charts for endpoint %s - %+v", id, err)
	}

	// Delete files from the cache
	if err := m.deleteCacheForEndpoint(id); err != nil {
		log.Warnf("Unable to delete Helm Chart Cache for endpoint %s - %+v", err)
	}
}

func (m *Monocular) processSyncRequests() {
	log.Info("Helm Repository Sync init")
	for job := range syncChan {
		log.Debugf("Processing Helm Repository Sync Job: %s", job.Endpoint.Name)
		metadata := SyncMetadata{
			Status: "Synchronizing",
			Busy:   true,
		}
		m.portalProxy.UpdateEndpointMetadata(job.Endpoint.GUID, marshalSyncMetadata(metadata))

		chartIndexURL := job.Endpoint.APIEndpoint.String()
		metadata.Status = "Synchronized"
		metadata.Busy = false
		err := m.syncHelmRepository(job.Endpoint.GUID, job.Endpoint.Name, chartIndexURL)
		if err != nil {
			log.Warn("Helm Repository sync repository failed for repository %s - %v", job.Endpoint.GUID, err)
			metadata.Status = "Sync Failed"
		}

		// Update the job status
		m.updateMetadata(job.Endpoint.GUID, metadata)
	}
	log.Debug("processSyncRequests finished")
}

func (m *Monocular) updateMetadata(endpoint string, metadata SyncMetadata) {
	err := m.portalProxy.UpdateEndpointMetadata(endpoint, marshalSyncMetadata(metadata))
	if err != nil {
		log.Errorf("Failed to update endpoint metadata: %v+", err)
	}
}

func marshalSyncMetadata(metadata SyncMetadata) string {
	jsonString, err := json.Marshal(metadata)
	if err != nil {
		return ""
	}
	return string(jsonString)
}

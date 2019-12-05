package monocular

import (
	"encoding/json"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/helm/monocular/chartrepo"
	log "github.com/sirupsen/logrus"
)

type SyncJob struct {
	Action   interfaces.EndpointAction
	Endpoint *interfaces.CNSIRecord
}

type SyncMetadata struct {
	Status string `json:"status"`
	Busy   bool   `json:"busy"`
}

// Sync Chanel
var syncChan = make(chan SyncJob, 100)

// InitSync starts the go routine that will sync repositories in the background
func (m *Monocular) InitSync() {
	go m.processSyncRequests()
}

// Sync shceudles a sync action for the given endpoint
func (m *Monocular) Sync(action interfaces.EndpointAction, endpoint *interfaces.CNSIRecord) {

	job := SyncJob{
		Action:   action,
		Endpoint: endpoint,
	}

	syncChan <- job
}

func (m *Monocular) processSyncRequests() {
	log.Info("Helm Repository Sync init")
	for job := range syncChan {
		log.Debugf("Processing Helm Repository Sync Job: %s", job.Endpoint.Name)

		// Could be delete or sync
		if job.Action == 0 {
			log.Debug("Syncing new repository")
			metadata := SyncMetadata{
				Status: "Synchronizing",
				Busy:   true,
			}
			m.portalProxy.UpdateEndointMetadata(job.Endpoint.GUID, marshalSyncMetadata(metadata))
			err := chartrepo.SyncRepo(m.Store, job.Endpoint.Name, job.Endpoint.APIEndpoint.String(), "")
			metadata.Busy = false
			if err != nil {
				log.Warn("Failed to sync repository: %v+", err)
				metadata.Status = "Sync Failed"
				m.updateMetadata(job.Endpoint.GUID, metadata)
			} else {
				metadata.Status = "Synchronized"
				m.updateMetadata(job.Endpoint.GUID, metadata)
			}
			log.Infof("Sync completed for repository: %s", job.Endpoint.APIEndpoint.String())
		} else if job.Action == 1 {
			log.Infof("Deleting Helm Repository: %s", job.Endpoint.Name)
			m.Store.DeleteRepo(job.Endpoint.Name)
		}
	}

	log.Debug("processSyncRequests finished")
}

func marshalSyncMetadata(metadata SyncMetadata) string {
	jsonString, err := json.Marshal(metadata)
	if err != nil {
		return ""
	}
	return string(jsonString)
}

func (m *Monocular) updateMetadata(endpoint string, metadata SyncMetadata) {
	err := m.portalProxy.UpdateEndointMetadata(endpoint, marshalSyncMetadata(metadata))
	if err != nil {
		log.Errorf("Failed to update endpoint metadata: %v+", err)
	}
}

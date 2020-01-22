package monocular

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
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

const chartRepoPathPrefix = "/v1"

// Sync Channel
var syncChan = make(chan SyncJob, 100)

// InitSync starts the go routine that will sync repositories in the background
func (m *Monocular) InitSync() {
	go m.processSyncRequests()
}

// Sync schedules a sync action for the given endpoint
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
		var repoSyncRequestParams string = fmt.Sprintf("{\"repoURL\":%q}", job.Endpoint.APIEndpoint.String())
		// Could be delete or sync
		if job.Action == 0 {
			log.Debug("Syncing new repository")
			metadata := SyncMetadata{
				Status: "Synchronizing",
				Busy:   true,
			}
			m.portalProxy.UpdateEndointMetadata(job.Endpoint.GUID, marshalSyncMetadata(metadata))
			//Hit the sync server container endpoint to trigger a sync for given repo
			err := putRequest("http://127.0.0.1:8080" + chartRepoPathPrefix + "/sync/" + job.Endpoint.Name, strings.NewReader(repoSyncRequestParams))
			metadata.Busy = false
			if err != nil {
				log.Warn("Request to sync repository failed: %v+", err)
				metadata.Status = "Sync Failed"
				m.updateMetadata(job.Endpoint.GUID, metadata)
			} else {
				metadata.Status = "Synchronizing"
				m.updateMetadata(job.Endpoint.GUID, metadata)
			}
			log.Infof("Sync in progress for repository: %s", job.Endpoint.APIEndpoint.String())
		} else if job.Action == 1 {
			log.Infof("Deleting Helm Repository: %s", job.Endpoint.Name)
			//Hit the sync server container endpoint to trigger a delete for given repo
			err := putRequest("http://127.0.0.1:8080" + chartRepoPathPrefix + "/delete/" + job.Endpoint.Name, strings.NewReader(repoSyncRequestParams))
			if err != nil {
				log.Warn("Request to delete repository failed: %v+", err)
			}
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

//https://gist.github.com/maniankara/a10d19960293b34b608ac7ef068a3d63
func putRequest(url string, data io.Reader) error {
	client := &http.Client{}
	req, err := http.NewRequest(http.MethodPut, url, data)
	if err == nil {
		_, err = client.Do(req)
	}
	return err
}

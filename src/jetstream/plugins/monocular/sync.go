package monocular

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"k8s.io/apimachinery/pkg/util/wait"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/helm/monocular/chartrepo/common"
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

const (
	chartRepoPathPrefix = "/v1"
	statusPollInterval  = 30
	statusPollTimeout   = 320
)

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
			syncURL := fmt.Sprintf("%s%s/sync/%s", m.SyncServiceURL, chartRepoPathPrefix, job.Endpoint.Name)

			//Hit the sync server container endpoint to trigger a sync for given repo
			response, err := putRequest(syncURL, strings.NewReader(repoSyncRequestParams))
			metadata.Busy = false
			if err != nil {
				log.Warn("Request to sync repository failed: %v", err)
				metadata.Status = "Sync Failed"
			} else {
				statusResponse := common.SyncJobStatusResponse{}
				defer response.Body.Close()
				err := json.NewDecoder(response.Body).Decode(&statusResponse)
				if err != nil {
					log.Errorf("Unable to parse response from chart-repo server, sync request may not be processed: %v", err)
					metadata.Status = "Sync Failed"
				} else if statusResponse.Status != common.SyncStatusInProgress {
					log.Errorf("Failed to synchronize repo: %v, response: %v, statusResponse", job.Endpoint.Name, err)
					metadata.Status = "Sync Failed"
				} else {
					metadata.Status = "Synchronizing"
					m.updateMetadata(job.Endpoint.GUID, metadata)
					log.Infof("Sync in progress for repository: %s", job.Endpoint.APIEndpoint.String())
					//Now wait for success
					statusURL := fmt.Sprintf("%s%s/status/%s", m.SyncServiceURL, chartRepoPathPrefix, job.Endpoint.Name)
					err := waitForSyncComplete(statusURL)
					if err == nil {
						metadata.Status = "Synchronized"
					} else {
						metadata.Status = "Sync Failed"
						log.Errorf("Failed to fetch sync status for repo: %v, %v", job.Endpoint.Name, err)
					}
				}
			}
			m.updateMetadata(job.Endpoint.GUID, metadata)
		} else if job.Action == 1 {
			log.Infof("Deleting Helm Repository: %s", job.Endpoint.Name)
			//Hit the sync server container endpoint to trigger a delete for given repo
			deleteURL := fmt.Sprintf("%s%s/delete/%s", m.SyncServiceURL, chartRepoPathPrefix, job.Endpoint.Name)
			response, err := putRequest(deleteURL, strings.NewReader(repoSyncRequestParams))
			//Extract status from response
			if err != nil {
				log.Warn("Request to delete repository failed: %v+", err)
			} else {
				statusResponse := common.SyncJobStatusResponse{}
				defer response.Body.Close()
				err := json.NewDecoder(response.Body).Decode(&statusResponse)
				if err != nil {
					log.Errorf("Unable to parse response from chart-repo server, delete request may not be processed: %v", err)
				} else if statusResponse.Status != common.DeleteStatusInProgress {
					log.Errorf("Failed to delete repo: %v, response: %v, statusResponse", job.Endpoint.Name, err)
				}
			}
		}
	}

	log.Debug("processSyncRequests finished")
}

func waitForSyncComplete(url string) error {
	return wait.Poll(statusPollInterval*time.Second, time.Duration(statusPollTimeout)*time.Second, func() (bool, error) {
		var complete = false
		log.Infof("Making GET request to: %v", url)
		resp, err := http.Get(url)
		defer resp.Body.Close()
		if err == nil {
			statusResponse := common.SyncJobStatusResponse{}
			err := json.NewDecoder(resp.Body).Decode(&statusResponse)
			log.Infof("%v", statusResponse)
			if err == nil && statusResponse.Status == common.SyncStatusSynced {
				complete = true
			}
		}
		return complete, err
	})
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
func putRequest(url string, data io.Reader) (*http.Response, error) {
	client := &http.Client{}
	req, err := http.NewRequest(http.MethodPut, url, data)
	var resp *http.Response
	if err == nil {
		resp, err = client.Do(req)
	}
	return resp, err
}

//https://gist.github.com/maniankara/a10d19960293b34b608ac7ef068a3d63
func getRequest(url string, data io.Reader) (*http.Response, error) {
	client := &http.Client{}
	req, err := http.NewRequest(http.MethodPut, url, data)
	var resp *http.Response
	if err == nil {
		resp, err = client.Do(req)
	}
	return resp, err
}

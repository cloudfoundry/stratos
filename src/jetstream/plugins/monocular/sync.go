package monocular

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/helm/monocular/chartrepo/common"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
	"k8s.io/apimachinery/pkg/util/wait"
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
	chartRepoPathPrefix          = "/v1"
	statusPollInterval           = 30
	statusPollTimeout            = 320
	syncServiceTimeoutBoundary   = 10
	syncServiceReadyPollInterval = 5
)

// Sync Channel
var syncChan = make(chan SyncJob, 100)

// InitSync starts the go routine that will sync repositories in the background
func (m *Monocular) InitSync() {
	go m.processSyncRequests()
}

// SyncRepos is endpoint to force a re-sync of a given Helm Repository
func (m *Monocular) SyncRepo(c echo.Context) error {
	log.Debug("SyncRepos")

	// Lookup repository by GUID
	var p = m.portalProxy
	guid := c.Param("guid")
	endpoint, err := p.GetCNSIRecord(guid)
	if err != nil {
		return interfaces.NewJetstreamErrorf("Could not find Helm Repository: %v+", err)
	}

	m.Sync(interfaces.EndpointRegisterAction, &endpoint)

	response := "OK"
	return c.JSON(200, response)
}

// Sync schedules a sync action for the given endpoint
func (m *Monocular) Sync(action interfaces.EndpointAction, endpoint *interfaces.CNSIRecord) {

	// If the sync job is busy, it won't update the status of this new job until it completes the previou sone
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

	syncChan <- job
}

func waitForSyncService(syncServiceURL string) error {
	// Ensure that the chart repo sync service is responsive
	for {
		// establish an outer timeout boundary
		timeout := time.Now().Add(time.Minute * syncServiceTimeoutBoundary)

		// Make a dummy status request to the chart repo - if it is up we should get a 404
		statusURL := fmt.Sprintf("%s%s/status/%s", syncServiceURL, chartRepoPathPrefix, "none")
		resp, err := http.Get(statusURL)
		if resp != nil {
			defer resp.Body.Close()
		}
		if err == nil {
			log.Info("Sync service is reachable and ready.")
			break
		} else {
			log.Debugf("Result of chart repo request: %v", err)
			log.Info("Sync service not yet ready. Waiting for sync service to be available...")
		}

		// If our timeout boundary has been exceeded, bail out
		if timeout.Sub(time.Now()) < 0 {
			return fmt.Errorf("timeout boundary of %d minutes has been exceeded", syncServiceTimeoutBoundary)
		}

		// Circle back and try again
		time.Sleep(time.Second * syncServiceReadyPollInterval)
	}
	return nil
}

func (m *Monocular) processSyncRequests() {
	log.Info("Helm Repository Sync init")
	for job := range syncChan {
		err := waitForSyncService(m.SyncServiceURL)
		if err != nil {
			log.Errorf("Unable to process sync request for %v. Chart Repo not available after %v minutes. %v", job.Endpoint.Name, syncServiceTimeoutBoundary, err)
			continue
		}
		log.Debugf("Processing Helm Repository Sync Job: %s", job.Endpoint.Name)
		var repoSyncRequestParams string = fmt.Sprintf("{\"repoURL\":%q}", job.Endpoint.APIEndpoint.String())
		// Could be delete or sync
		if job.Action == 0 {
			log.Debug("Syncing new repository")
			metadata := SyncMetadata{
				Status: "Synchronizing",
				Busy:   true,
			}
			m.portalProxy.UpdateEndpointMetadata(job.Endpoint.GUID, marshalSyncMetadata(metadata))
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
					metadata.Busy = true
					m.updateMetadata(job.Endpoint.GUID, metadata)
					log.Infof("Sync in progress for repository: %s", job.Endpoint.APIEndpoint.String())
					//Now wait for success
					statusURL := fmt.Sprintf("%s%s/status/%s", m.SyncServiceURL, chartRepoPathPrefix, job.Endpoint.Name)
					err := waitForSyncComplete(statusURL)
					metadata.Busy = false
					if err == nil {
						// Need to get the actual status
						status, err := getSyncStatus(statusURL)
						if err == nil {
							metadata.Status = status.Status
						} else {
							metadata.Status = "Sync Failed"
						}
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
		statusResponse, err := getSyncStatus(url)
		if err == nil && statusResponse.Status == common.SyncStatusSynced || statusResponse.Status == common.SyncStatusFailed {
			// Note: complete can mean synced okay or sync failed
			complete = true
		}
		return complete, err
	})
}

func getSyncStatus(url string) (*common.SyncJobStatusResponse, error) {
	resp, err := http.Get(url)
	if err == nil {
		defer resp.Body.Close()
		statusResponse := common.SyncJobStatusResponse{}
		err = json.NewDecoder(resp.Body).Decode(&statusResponse)
		if err == nil {
			return &statusResponse, nil
		}
	}
	return nil, err
}

func marshalSyncMetadata(metadata SyncMetadata) string {
	jsonString, err := json.Marshal(metadata)
	if err != nil {
		return ""
	}
	return string(jsonString)
}

func (m *Monocular) updateMetadata(endpoint string, metadata SyncMetadata) {
	err := m.portalProxy.UpdateEndpointMetadata(endpoint, marshalSyncMetadata(metadata))
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

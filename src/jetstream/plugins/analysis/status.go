package analysis

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/analysis/store"

	log "github.com/sirupsen/logrus"
)

// Start a poller to check the status
func (c *Analysis) initStatusCheck() {

	log.Info("Analysis Plugin: Starting status check ...")

	// Just loop forever, checking the status of running jobs every 10s
	go func() {
		for {
			time.Sleep(10 * time.Second)
			err := c.checkStatus()
			if err != nil {
				log.Errorf("Error checking status: %v", err)
			}
		}
	}()
}

func (c *Analysis) checkStatus() error {
	log.Debug("Checking status....")
	p := c.portalProxy
	// Create a record in the reports datastore
	dbStore, err := store.NewAnalysisDBStore(p.GetDatabaseConnection())
	if err != nil {
		return fmt.Errorf("Status Check: Can not get anaylsis store db: %v", err)
	}

	// Get all running jobs
	running, err := dbStore.ListRunning()
	if err != nil {
		return fmt.Errorf("Can not get list of running jobs: %v", err)
	}

	if len(running) == 0 {
		return nil
	}

	ids := make([]string, 0)
	for _, job := range running {
		log.Debugf("Got running job: %s", job.ID)
		ids = append(ids, job.ID)
	}

	data, err := json.Marshal(ids)
	if err != nil {
		log.Errorf("Could not marshal IDs: %v", err)
		return fmt.Errorf("Could not marshal IDs: %v", err)
	}

	// Make request to status
	statusURL := fmt.Sprintf("%s/api/v1/status", c.analysisServer)
	r, _ := http.NewRequest(http.MethodPost, statusURL, bytes.NewReader(data))
	r.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 180 * time.Second}
	rsp, err := client.Do(r)
	if err != nil {
		return fmt.Errorf("Failed getting status from Analyzer service: %v", err)
	}

	if rsp.StatusCode != http.StatusOK {
		return fmt.Errorf("Failed getting status from Analyzer service: %d", rsp.StatusCode)
	}

	defer rsp.Body.Close()
	response, err := ioutil.ReadAll(rsp.Body)
	if err != nil {
		log.Errorf("Could not read response: %v", err)
		return fmt.Errorf("Could not read response: %v", err)
	}

	// Turn into map of IDs to Jobs
	statuses := make(map[string]store.AnalysisRecord)

	if err := json.Unmarshal(response, &statuses); err != nil {
		return fmt.Errorf("Could not parse response: %v", err)
	}

	for _, job := range running {
		if status, ok := statuses[job.ID]; ok {
			job.Duration = status.Duration
			job.Status = status.Status
			if err := dbStore.UpdateReport(job.UserID, job); err != nil {
				log.Warnf("Unable to update status for job %s: %v", job.ID, err)
			}
		} else {
			// The analysis server did not know about our job, os mark as error
			job.Status = "error"
			if err := dbStore.UpdateReport(job.UserID, job); err != nil {
				log.Warnf("Unable to update status for job %s: %v", job.ID, err)
			}
		}
	}

	return nil
}

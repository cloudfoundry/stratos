package main

import (
	"encoding/json"
	"errors"
	"io/ioutil"

	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

func (a *Analyzer) status(ec echo.Context) error {
	err := a.doStatus(ec)
	if err != nil {
		log.Error(err)
	}
	return err
}

func (a *Analyzer) doStatus(ec echo.Context) error {
	log.Debug("Status")
	req := ec.Request()

	// Body contains an array of IDs that the client thinks are running
	// We send back updated status for each

	// Get the list of IDs
	defer req.Body.Close()
	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return errors.New("Could not read body")
	}

	ids := make([]string, 0)
	if err := json.Unmarshal(body, &ids); err != nil {
		return errors.New("Failed to parse body")
	}

	response := make(map[string]AnalysisJob)
	for _, id := range ids {
		if a.jobs[id] == nil {
			// Client has a running job that we know nothing about - so must be an error
			job := AnalysisJob{
				ID:     id,
				Status: "error",
			}
			response[id] = job
		} else {
			response[id] = *a.jobs[id]
		}
	}

	// Go through all of the jobs we have and increment the cleanup counter of those that are finished
	// Assume after 5 requests to the status API that the caller has the info they need for the completed job
	// and remove it
	cleanup := make([]string, 0)
	for id, job := range a.jobs {
		// If the job has finished, increment the cleanup counter
		// We will remove it from our cache once we are pretty sure Jetstream has the status
		if !job.Busy {
			job.CleanupCounter = job.CleanupCounter + 1
			if job.CleanupCounter > 5 {
				cleanup = append(cleanup, id)
			}
		}
	}

	for _, id := range cleanup {
		delete(a.jobs, id)
	}

	ec.JSON(200, response)
	return nil
}

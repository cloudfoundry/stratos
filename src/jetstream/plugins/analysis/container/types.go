package main

import (
	"encoding/json"
	"os"
	"time"

	log "github.com/sirupsen/logrus"
)

type kubeAnalyzerConfig struct {
	Namespace string `json:"namespace"`
	App       string `json:"app"`
}

// AnalysisJob is the metadata format sent to and from the analyzer
type AnalysisJob struct {
	ID             string              `json:"id"`
	UserID         string              `json:"-"`
	EndpointType   string              `json:"endpointType"`
	EndpointID     string              `json:"endpoint"`
	Type           string              `json:"type"`
	Path           string              `json:"path"`
	Format         string              `json:"format"`
	Name           string              `json:"name"`
	Status         string              `json:"status"`
	Duration       int                 `json:"duration"`
	Result         string              `json:"-"`
	Summary        *json.RawMessage    `json:"summary"`
	Config         *kubeAnalyzerConfig `json:"-"`
	Folder         string              `json:"-"`
	KubeConfigPath string              `json:"-"`
	TempFiles      []string            `json:"-"`
	Busy           bool                `json:"-"`
	EndTime        time.Time           `json:"-"`
	CleanupCounter int                 `json:"-"`
}

// RemoveTempFiles will remove any temporary files
func (job *AnalysisJob) RemoveTempFiles() {
	log.Debug("Removing temporary files")
	for _, name := range job.TempFiles {
		err := os.Remove(name)
		if err != nil {
			log.Error("Could not delete file: %s", name)
		}
	}
}

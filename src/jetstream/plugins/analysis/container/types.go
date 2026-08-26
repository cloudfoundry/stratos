package main

import (
	"encoding/json"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"time"
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
	Base           string              `json:"-"`
	KubeConfigPath string              `json:"-"`
	TempFiles      []string            `json:"-"`
	Busy           bool                `json:"-"`
	EndTime        time.Time           `json:"-"`
	CleanupCounter int                 `json:"-"`
}

// confinedFolder returns the job's folder only when it is still inside the
// reports directory after cleaning. Clean resolves any ".." first, so a folder
// that had escaped cannot satisfy the prefix — checking before cleaning would
// be worthless. Every filesystem operation an analyzer performs goes through
// this rather than reading Folder directly, so a future change that sets
// Folder from somewhere unvalidated cannot reach the disk.
func (job *AnalysisJob) confinedFolder() (string, bool) {
	if job.Base == "" || job.Folder == "" {
		return "", false
	}
	cleaned := filepath.Clean(job.Folder)
	if !strings.HasPrefix(cleaned, filepath.Clean(job.Base)+string(filepath.Separator)) {
		return "", false
	}
	return cleaned, true
}

// RemoveTempFiles will remove any temporary files
func (job *AnalysisJob) RemoveTempFiles() {
	slog.Debug("removing the temporary files", "job", job.ID, "count", len(job.TempFiles))
	base := filepath.Clean(job.Base)
	for _, name := range job.TempFiles {
		cleaned := filepath.Clean(name)
		if job.Base == "" || !strings.HasPrefix(cleaned, base+string(filepath.Separator)) {
			slog.Error("refusing to delete a temporary file outside the reports directory",
				"job", job.ID, "file", name)
			continue
		}
		if err := os.Remove(cleaned); err != nil {
			slog.Error("could not delete a temporary file", "job", job.ID, "file", cleaned, "error", err)
		}
	}
}

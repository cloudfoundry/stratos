package store

import (
	"encoding/json"
	"time"
)

// AnalysisRecord represents an analysis that has been run
type AnalysisRecord struct {
	ID           string           `json:"id"`
	UserID       string           `json:"-"`
	EndpointType string           `json:"endpointType"`
	EndpointID   string           `json:"endpoint"`
	Type         string           `json:"type"`
	Format       string           `json:"format"`
	Name         string           `json:"name"`
	Path         string           `json:"path"`
	Created      time.Time        `json:"created"`
	Read         bool             `json:"read"`
	Status       string           `json:"status"`
	Duration     int              `json:"duration"`
	Result       string           `json:"-"`
	Error        string           `json:"error"`
	Summary      *json.RawMessage `json:"summary"`
	Report       *json.RawMessage `json:"report,omitempty"`
}

// AnalysisStore is the analysis repository
type AnalysisStore interface {
	List(userGUID, endpointID string) ([]*AnalysisRecord, error)
	Get(userGUID, id string) (*AnalysisRecord, error)
	GetLatestCompleted(userGUID, endpointID, path string) (*AnalysisRecord, error)
	ListCompletedByPath(userGUID, endpointID, path string) ([]*AnalysisRecord, error)
	ListRunning() ([]*AnalysisRecord, error)
	Delete(userGUID, id string) error
	DeleteForEndpoint(endpointID string) error
	Save(record AnalysisRecord) (*AnalysisRecord, error)
	UpdateReport(userGUID string, report *AnalysisRecord) error
}

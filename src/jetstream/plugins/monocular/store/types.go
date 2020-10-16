package store

import (
	"time"
)

// ChartStoreRecord represents a Helm Chart Version record
type ChartStoreRecord struct {
	EndpointID  string          `json:"endpoint"`
	Name        string          `json:"name"`
	Repository  string          `json:"repo_name"`
	Version     string          `json:"version"`
	AppVersion  string          `json:"app_version"`
	Description string          `json:"description"`
	IconURL     string          `json:"icon_url"`
	ChartURL    string          `json:"chart_url"`
	Sources     []string        `json:"sources"`
	Created     time.Time       `json:"created"`
	Digest      string          `json:"digest"`
	IsLatest    bool            `json:"is_latest"`
	SemVer      SemanticVersion `json:"-"`
}

type ChartStoreRecordList []*ChartStoreRecord

func (r ChartStoreRecordList) Len() int {
	return len(r)
}

func (r ChartStoreRecordList) Swap(i, j int) {
	r[i], r[j] = r[j], r[i]
}
func (r ChartStoreRecordList) Less(i, j int) bool {
	ci := r[i].SemVer
	cj := r[j].SemVer

	return ci.LessThan(&cj)
}

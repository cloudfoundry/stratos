/*
Copyright (c) 2019 The Helm Authors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package common

import (
	"net/http"
	"sync"
	"time"
)

//Repo holds information to identify a repository
type Repo struct {
	Name                string
	URL                 string
	AuthorizationHeader string `bson:"-"`
}

//Maintainer describes the maintainer of a Chart
type Maintainer struct {
	Name  string
	Email string
}

//Chart holds full descriptor of a Helm chart
type Chart struct {
	ID            string `bson:"_id"`
	Name          string
	Repo          Repo
	Description   string
	Home          string
	Keywords      []string
	Maintainers   []Maintainer
	Sources       []string
	Icon          string
	ChartVersions []ChartVersion
}

//ChartVersion holds version information on a Chart
type ChartVersion struct {
	Version    string
	AppVersion string
	Created    time.Time
	Digest     string
	URLs       []string
}

//ChartFiles describes the chart values, readme, schema and digest components of a chart
type ChartFiles struct {
	ID     string `bson:"_id"`
	Readme string
	Values string
	Schema string
	Repo   Repo
	Digest string
}

//RepoCheck describes the state of a repository in terms its current checksum and last update time.
//It is used to determine whether or not to re-sync a respository.
type RepoCheck struct {
	ID         string    `bson:"_id"`
	LastUpdate time.Time `bson:"last_update"`
	Checksum   string    `bson:"checksum"`
}

//ImportChartFilesJob contains the information needed by an
//ImportWorker when import a chart from a repository
type ImportChartFilesJob struct {
	Name         string
	Repo         Repo
	ChartVersion ChartVersion
}

//HTTPClient defines a behaviour for making HTTP requests
type HTTPClient interface {
	Do(req *http.Request) (*http.Response, error)
}

type RepoSyncStatus struct {
	Repo   string `json:"repo"`
	URL    string `json:"url"`
	Status string `json:"status"`
}

type SyncStatusMap struct {
	mut       sync.Mutex
	statusMap map[string]RepoSyncStatus
}

func NewSyncStatusMap() *SyncStatusMap {
	return &SyncStatusMap{sync.Mutex{}, make(map[string]RepoSyncStatus)}
}

func (m *SyncStatusMap) Set(repo string, status RepoSyncStatus) {
	m.mut.Lock()
	defer m.mut.Unlock()
	m.statusMap[repo] = status
}

func (m *SyncStatusMap) Get(repo string) RepoSyncStatus {
	m.mut.Lock()
	defer m.mut.Unlock()
	return m.statusMap[repo]
}

const SyncStatusFailed = "Failed"
const SyncStatusSynced = "Synchronized"
const SyncStatusInProgress = "Synchronizing"

type RepoDeleteStatus struct {
	Repo   string `json:"repo"`
	URL    string `json:"url"`
	Status string `json:"status"`
}

type DeleteStatusMap struct {
	mut       sync.Mutex
	statusMap map[string]RepoDeleteStatus
}

func NewDeleteStatusMap() *DeleteStatusMap {
	return &DeleteStatusMap{sync.Mutex{}, make(map[string]RepoDeleteStatus)}
}

func (m *DeleteStatusMap) Set(repo string, status RepoDeleteStatus) {
	m.mut.Lock()
	defer m.mut.Unlock()
	m.statusMap[repo] = status
}

func (m *DeleteStatusMap) Get(repo string) RepoDeleteStatus {
	m.mut.Lock()
	defer m.mut.Unlock()
	return m.statusMap[repo]
}

const DeleteStatusFailed = "Failed"
const DeleteStatusDeleted = "Deleted"
const DeleteStatusInProgress = "Deleting"

type SyncJobStatusResponse struct {
	UUID   string `json:"uuid"`
	Status string `json:"status"`
}

type DeleteJobStatusResponse struct {
	UUID   string `json:"uuid"`
	Status string `json:"status"`
}

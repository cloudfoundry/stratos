/*
Copyright (c) 2017 The Helm Authors

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

package monocular

import (
	"time"
)

// Repo holds the App repository details
type Repo struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

// Chart is a higher-level representation of a chart package
type Chart struct {
	ID              string            `json:"-"`
	Name            string            `json:"name"`
	Repo            Repo              `json:"repo"`
	Description     string            `json:"description"`
	Home            string            `json:"home"`
	Keywords        []string          `json:"keywords"`
	Maintainers     []ChartMaintainer `json:"maintainers"`
	Sources         []string          `json:"sources"`
	Icon            string            `json:"icon"`
	RawIcon         []byte            `json:"-"`
	IconContentType string            `json:"-"`
	ChartVersions   []ChartVersion    `json:"-"`
}

// ChartVersion is a representation of a specific version of a chart
type ChartVersion struct {
	Version    string    `json:"version"`
	AppVersion string    `json:"app_version"`
	Created    time.Time `json:"created"`
	Digest     string    `json:"digest"`
	URLs       []string  `json:"urls"`
	Readme     string    `json:"readme,omitempty"`
	Values     string    `json:"values,omitempty"`
	Schema     string    `json:"schema"`
}

//RepoCheck describes the state of a repository in terms its current checksum and last update time.
//It is used to determine whether or not to re-sync a respository.
type RepoCheck struct {
	ID         string    `bson:"_id"`
	LastUpdate time.Time `bson:"last_update"`
	Checksum   string    `bson:"checksum"`
}

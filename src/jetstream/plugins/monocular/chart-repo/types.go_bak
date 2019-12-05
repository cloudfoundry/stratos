/*
Copyright (c) 2018 The Helm Authors

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

package chartrepo

import (
	"time"
)

type Repo struct {
	Name                string `json:"name"`
	URL                 string `json:"url"`
	AuthorizationHeader string `bson:"-"`
}

type Maintainer struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type Chart struct {
	ID            string         `json:"-" bson:"_id"`
	Name          string         `json:"name"`
	Repo          Repo           `json:"repo"`
	Description   string         `json:"description"`
	Home          string         `json:"home"`
	Keywords      []string       `json:"keywords"`
	Maintainers   []Maintainer   `json:"maintainers"`
	Sources       []string       `json:"sources"`
	Icon          string         `json:"icon"`
	ChartVersions []ChartVersion `json:"chart_versions"`
}

type ChartVersion struct {
	Version    string    `json:"version"`
	AppVersion string    `json:"app_version"`
	Created    time.Time `json:"created"`
	Digest     string    `json:"digest"`
	URLs       []string  `json:"urls"`
}

type ChartFiles struct {
	ID     string `bson:"_id"`
	Readme string
	Values string
	Repo   Repo
	Digest string
}

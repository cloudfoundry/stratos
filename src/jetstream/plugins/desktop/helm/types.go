package helm

import (
	"time"
)

type apiResponse struct {
	ID            string      `json:"id"`
	Type          string      `json:"type"`
	Attributes    interface{} `json:"attributes"`
	Links         interface{} `json:"links"`
	Relationships relMap      `json:"relationships"`
}

type apiListResponse []apiResponse

type relMap map[string]rel
type rel struct {
	Data  interface{} `json:"data"`
	Links selfLink    `json:"links"`
}

type selfLink struct {
	Self string `json:"self"`
}

type metaData struct {
	TotalPages int `json:"totalPages"`
}

type bodyAPIListResponse struct {
	Data apiListResponse `json:"data"`
	Meta metaData        `json:"meta,omitempty"`
}

type bodyAPIResponse struct {
	Data apiResponse `json:"data"`
}

// Repo holds the App repository details
type Repo struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

type chartAttributes struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Repo        Repo              `json:"repo"`
	Description string            `json:"description"`
	Home        string            `json:"home"`
	Keywords    []string          `json:"keywords"`
	Maintainers []chartMaintainer `json:"maintainers"`
	Sources     []string          `json:"sources"`
	Icon        string            `json:"icon"`
}

type chartVersion struct {
	Version    string    `json:"version"`
	AppVersion string    `json:"app_version"`
	Created    time.Time `json:"created"`
	Digest     string    `json:"digest"`
	URLs       []string  `json:"urls"`
	Readme     string    `json:"readme" bson:"-"`
	Values     string    `json:"values" bson:"-"`
	Schema     string    `json:"schema" bson:"-"`
}

// Maintainer describes a Chart maintainer.
type chartMaintainer struct {
	// Name is a user name or organization name
	Name string `json:"name,omitempty"`
	// Email is an optional email address to contact the named maintainer
	Email string `json:"email,omitempty"`
	// URL is an optional URL to an address for the named maintainer
	URL string `json:"url,omitempty"`
}

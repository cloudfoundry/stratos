package monocular

import "time"

// IndexFile represents the index.yaml structure for a Helm Repository
type IndexFile struct {
	APIVersion string                         `json:"apiVersion,omitempty"`
	Entries    map[string][]IndexFileMetadata `json:"entries,omitempty"`
}

// IndexFileMetadata represents the metadata for a single chart version
type IndexFileMetadata struct {
	Name        string    `json:"name,omitempty"`
	AppVersion  string    `json:"appVersion" yaml:"appVersion"`
	Description string    `json:"description,omitempty"`
	Digest      string    `json:"digest,omitempty"`
	Version     string    `json:"version,omitempty"`
	Created     time.Time `json:"created"`
	Icon        string    `json:"icon,omitempty"`
	URLs        []string  `json:"-" yaml:"urls"`
	Sources     []string  `json:"-" yaml:"sources"`
	APIVersion  string    `json:"-" yaml:"apiVersion"`
}

// ChartMaintainer describes a Chart maintainer.
type ChartMaintainer struct {
	// Name is a user name or organization name
	Name string `json:"name,omitempty"`
	// Email is an optional email address to contact the named maintainer
	Email string `json:"email,omitempty"`
	// URL is an optional URL to an address for the named maintainer
	URL string `json:"url,omitempty"`
}

// ChartMetadata for a Chart file. This models the structure of a Chart.yaml file.
type ChartMetadata struct {
	// The name of the chart
	Name string `json:"name,omitempty"`
	// The URL to a relevant project page, git repo, or contact person
	Home string `json:"home,omitempty"`
	// Source is the URL to the source code of this chart
	Sources []string `json:"sources,omitempty"`
	// A SemVer 2 conformant version string of the chart
	Version string `json:"version,omitempty"`
	// A one-sentence description of the chart
	Description string `json:"description,omitempty"`
	// A list of string keywords
	Keywords []string `json:"keywords,omitempty"`
	// A list of name and URL/email address combinations for the maintainer(s)
	Maintainers []*ChartMaintainer `json:"maintainers,omitempty"`
	// The URL to an icon file.
	Icon string `json:"icon,omitempty"`
	// The API Version of this chart.
	APIVersion string `json:"apiVersion,omitempty"`
	// The condition to check to enable chart
	Condition string `json:"condition,omitempty"`
	// The tags to check to enable chart
	Tags string `json:"tags,omitempty"`
	// The version of the application enclosed inside of this chart.
	AppVersion string `json:"appVersion,omitempty"`
	// Whether or not this chart is deprecated
	Deprecated bool `json:"deprecated,omitempty"`
	// Annotations are additional mappings uninterpreted by Helm,
	// made available for inspection by other applications.
	Annotations map[string]string `json:"annotations,omitempty"`
	// KubeVersion is a SemVer constraint specifying the version of Kubernetes required.
	KubeVersion string `json:"kubeVersion,omitempty"`
	// Specifies the chart type: application or library
	Type string `json:"type,omitempty"`
}

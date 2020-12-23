package cfapppush

import (
	"net/http"

	"github.com/gorilla/websocket"
)

type ManifestResponse struct {
	Manifest string
}

type SocketMessage struct {
	Message   string      `json:"message"`
	Timestamp int64       `json:"timestamp"`
	Type      MessageType `json:"type"`
}

type SocketWriter struct {
	clientWebSocket *websocket.Conn
}

// Allow connections from any Origin
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type StratosProject struct {
	DeploySource    interface{} `json:"deploySource"`
	DeployOverrides interface{} `json:"deployOverrides"`
}

type DeploySource struct {
	SourceType string `json:"type"`
	Timestamp  int64  `json:"timestamp"`
}

// Structure used to provide metadata about the GitHub source
type GitSCMSourceInfo struct {
	DeploySource
	Project      string `json:"project"`
	Branch       string `json:"branch"`
	URL          string `json:"url"`
	CommitHash   string `json:"commit"`
	SCM          string `json:"scm"`
	EndpointGUID string `json:"endpointGuid"` // credentials of which to use, e.g. of a private GitHub instance
	Username     string `json:"username"`     // GitLab username has to be supplied by the frontend
}

// Structure used to provide metadata about the Git Url source
type GitUrlSourceInfo struct {
	DeploySource
	Project    string `json:"project"` // Not sent from client
	Branch     string `json:"branch"`
	Url        string `json:"url"`
	CommitHash string `json:"commit"` // Not sent from client
}

// DockerImageSourceInfo - Structure used to provide metadata about the docker source
type DockerImageSourceInfo struct {
	DeploySource
	ApplicationName string `json:"applicationName"`
	DockerImage     string `json:"dockerImage"`
	DockerUsername  string `json:"dockerUsername"`
}

type FolderSourceInfo struct {
	DeploySource
	WaitAfterUpload bool     `json:"wait"`
	Files           int      `json:"files"`
	Folders         []string `json:"folders,omitempty"`
}

type MessageType int

// Based on manifest.rawManifestApplicaiton
type RawManifestApplication struct {
	Name                    string             `yaml:"name,omitempty"`
	Buildpack               string             `yaml:"buildpack,omitempty"`
	Buildpacks              []string           `yaml:"buildpacks,omitempty"`
	Command                 string             `yaml:"command,omitempty"`
	DeprecatedDomain        interface{}        `yaml:"domain,omitempty"`
	DeprecatedDomains       interface{}        `yaml:"domains,omitempty"`
	DeprecatedHost          interface{}        `yaml:"host,omitempty"`
	DeprecatedHosts         interface{}        `yaml:"hosts,omitempty"`
	DeprecatedNoHostname    interface{}        `yaml:"no-hostname,omitempty"`
	DiskQuota               string             `yaml:"disk_quota,omitempty"`
	Docker                  rawDockerInfo      `yaml:"docker,omitempty"`
	DropletPath             string             `yaml:"droplet-path,omitempty"`
	EnvironmentVariables    map[string]string  `yaml:"env,omitempty"`
	HealthCheckHTTPEndpoint string             `yaml:"health-check-http-endpoint,omitempty"`
	HealthCheckType         string             `yaml:"health-check-type,omitempty"`
	Instances               *int               `yaml:"instances,omitempty"`
	Memory                  string             `yaml:"memory,omitempty"`
	NoRoute                 bool               `yaml:"no-route,omitempty"`
	Path                    string             `yaml:"path,omitempty"`
	RandomRoute             bool               `yaml:"random-route,omitempty"`
	Routes                  []rawManifestRoute `yaml:"routes,omitempty"`
	Services                []string           `yaml:"services,omitempty"`
	StackName               string             `yaml:"stack,omitempty"`
	Timeout                 int                `yaml:"timeout,omitempty"`
}

type rawManifestRoute struct {
	Route string `yaml:"route"`
}

type rawDockerInfo struct {
	Image    string `yaml:"image,omitempty"`
	Username string `yaml:"username,omitempty"`
}

type Applications struct {
	Applications []RawManifestApplication `yaml:"applications"`
}

type CloneDetails struct {
	Url       string
	LoggerUrl string
	Branch    string
	Commit    string
}

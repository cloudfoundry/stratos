package cnsis

import (
	"net/url"
)

// CNSIType - <TBD>
type CNSIType string

// CNSIHCF - <TBD>
// CNSIHCE - <TBD>
const (
	CNSIHCF CNSIType = "hcf"
	CNSIHCE CNSIType = "hce"
)

// CNSIRecord - <TBD>
type CNSIRecord struct {
	GUID                  string   `json:"guid"`
	Name                  string   `json:"name"`
	CNSIType              CNSIType `json:"cnsi_type"`
	APIEndpoint           *url.URL `json:"api_endpoint"`
	AuthorizationEndpoint string   `json:"authorization_endpoint"`
	TokenEndpoint         string   `json:"token_endpoint"`
}

// RegisteredCluster - <TBD>
type RegisteredCluster struct {
	GUID        string   `json:"guid"`
	Name        string   `json:"name"`
	APIEndpoint *url.URL `json:"api_endpoint"`
	Account     string   `json:"account"`
	TokenExpiry int64    `json:"token_expiry"`
}

// Repository is an application of the repository pattern for storing CNSI Records
type Repository interface {
	List() ([]*CNSIRecord, error)
	ListByUser(userGUID string) ([]*RegisteredCluster, error)
	Find(guid string) (CNSIRecord, error)
	Delete(guid string) error
	Save(guid string, cnsiRecord CNSIRecord) error
}

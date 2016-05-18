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
	GUID                  string
	Name                  string
	CNSIType              CNSIType
	APIEndpoint           *url.URL
	AuthorizationEndpoint string
	TokenEndpoint         string
}

// Repository is an application of the repository pattern for storing CNSI Records
type Repository interface {
	List() ([]*CNSIRecord, error)
	Find(guid string) (CNSIRecord, error)
	Save(guid string, cnsiRecord CNSIRecord) error
}

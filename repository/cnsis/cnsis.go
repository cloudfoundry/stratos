package cnsis

import (
	"net/url"
)

type CnsiType string

const (
	CnsiHCF CnsiType = "hcf"
	CnsiHCE CnsiType = "hce"
)

type CnsiRecord struct {
	Guid 									string
	Name                  string
	APIEndpoint           *url.URL
	AuthorizationEndpoint string
	TokenEndpoint         string
	CNSIType              CnsiType
}

// Repository is an application of the repository pattern for storing CNSI Records
type Repository interface {
  List() ([]*CnsiRecord, error)
  Find(guid string) (CnsiRecord, error)
  Save(guid string, cnsi_record CnsiRecord) error
}

package cnsis

import (
	"net/url"
	"github.com/hpcloud/portal-proxy/components/core/backend/repository/interfaces"
)

// RegisteredCluster - <TBD>
type RegisteredCluster struct {
	GUID              string   `json:"guid"`
	Name              string   `json:"name"`
	CNSIType          string   `json:"cnsi_type"`
	APIEndpoint       *url.URL `json:"api_endpoint"`
	Account           string   `json:"account"`
	TokenExpiry       int64    `json:"token_expiry"`
	SkipSSLValidation bool     `json:"skip_ssl_validation"`
}

// Repository is an application of the repository pattern for storing CNSI Records
type Repository interface {
	List() ([]*interfaces.CNSIRecord, error)
	ListByUser(userGUID string) ([]*RegisteredCluster, error)
	Find(guid string) (interfaces.CNSIRecord, error)
	FindByAPIEndpoint(endpoint string) (interfaces.CNSIRecord, error)
	Delete(guid string) error
	Save(guid string, cnsiRecord interfaces.CNSIRecord) error
}

type Endpoint interface{
	Init() ()
}
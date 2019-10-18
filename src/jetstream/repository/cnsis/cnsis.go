package cnsis

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
)

// Repository is an application of the repository pattern for storing CNSI Records
type Repository interface {
	List(encryptionKey []byte) ([]*api.CNSIRecord, error)
	ListByUser(userGUID string) ([]*api.ConnectedEndpoint, error)
	Find(guid string, encryptionKey []byte) (api.CNSIRecord, error)
	FindByAPIEndpoint(endpoint string, encryptionKey []byte) (api.CNSIRecord, error)
	Delete(guid string) error
	Save(guid string, cnsiRecord api.CNSIRecord, encryptionKey []byte) error
	Update(guid string, ssoAllowed bool) error
	UpdateMetadata(guid string, metadata string) error
}

type Endpoint interface {
	Init()
}

package cnsis

import (
	"github.com/SUSE/stratos-ui/repository/interfaces"
)

// Repository is an application of the repository pattern for storing CNSI Records
type Repository interface {
	List() ([]*interfaces.CNSIRecord, error)
	ListByUser(userGUID string) ([]*interfaces.ConnectedEndpoint, error)
	Find(guid string) (interfaces.CNSIRecord, error)
	FindByAPIEndpoint(endpoint string) (interfaces.CNSIRecord, error)
	Delete(guid string) error
	Save(guid string, cnsiRecord interfaces.CNSIRecord) error
}

type Endpoint interface {
	Init()
}

package localusers

import (
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
)

// Repository is an application of the repository pattern for storing local users
type Repository interface {
	AddLocalUser(user api.LocalUser) error
	UpdateLocalUser(user api.LocalUser) error
	FindPasswordHash(userGUID string) ([]byte, error)
	FindUserGUID(username string) (string, error)
	FindUserScope(userGUID string) (string, error)
	FindUser(userGUID string) (api.LocalUser, error)
	UpdateLastLoginTime(userGUID string, loginTime time.Time) error
	FindLastLoginTime(userGUID string) (time.Time, error)
}

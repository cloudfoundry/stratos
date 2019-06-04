package local_users

import "time"

// Repository is an application of the repository pattern for storing local users
type Repository interface {
	AddLocalUser(userGUID string, passwordHash []byte, username string, email string, role string) error
	FindPasswordHash(userGUID string) ([]byte, error)
	FindUserGUID(username string) (string, error)
	FindUserScope(userGUID string) (string, error)
	UpdateLastLoginTime(userGUID string, loginTime time.Time) error
	FindLastLoginTime(userGUID string) (time.Time, error)
}

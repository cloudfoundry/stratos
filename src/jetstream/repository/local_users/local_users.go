package local_users

import "github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"

// Repository is an application of the repository pattern for storing tokens
type Repository interface {

	AddUser(userGUID string, username string, email string, role string, passwordHash byte[]) error
	FindPasswordHash(userGUID string) (hash []byte, error)

	//TODO what is best pattern here - varargs e.g. just UpdateUser? or function for each update?
	//UpdatePasswordHash(userGUID string, passwordHash byte[]) error
	//UpdateLastLogin(userGUID string, /*TODO: datetime here*/ ) error
	
}

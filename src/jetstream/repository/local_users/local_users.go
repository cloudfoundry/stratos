package local_users

import "github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"

//TODO: Can we use the existing ConnectedUser struct here?
// Token -
type Token struct {
	UserGUID  string
	TokenType string
	Record    interfaces.TokenRecord
}

//TODO: this is currently defined in tokens - do we want to pull this up a level now so it can be referenced for local users as well as token endpoints?
const SystemSharedUserGuid = "00000000-1111-2222-3333-444444444444" // User ID for the system shared user for endpoints

// Repository is an application of the repository pattern for storing tokens
type Repository interface {

	SaveUser(userGUID string, username string, email string, role string, passwordHash byte[]) error
	FindPasswordHash(userGUID string) (hash []byte, error)

	//TODO what is best pattern here - varargs e.g. just UpdateUser? or function for each update?
	UpdatePasswordHash(userGUID string, passwordHash byte[]) error
	UpdateLastLogin(userGUID string, /*TODO: datetime here*/ ) error
	
}

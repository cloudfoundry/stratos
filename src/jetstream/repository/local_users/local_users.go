package local_users

// Repository is an application of the repository pattern for storing local users
type Repository interface {
	AddLocalUser(userGUID string, passwordHash []byte, username string, email string, role string) error
	FindPasswordHash(userGUID string) ([]byte, error)
	FindUserGUID(username string) (string, error)
	FindUserScope(userGUID string) (string, error)
	//TODO what is best pattern here - varargs e.g. just UpdateUser? or function for each update?
	//UpdatePasswordHash(userGUID string, passwordHash byte[]) error
	//UpdateLastLogin(userGUID string, /*TODO: datetime here*/ ) error

}

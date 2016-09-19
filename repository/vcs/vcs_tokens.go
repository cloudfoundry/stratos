package vcstokens

// VCSTokenRecord -
type VCSTokenRecord struct {
	UserGUID    string
	Endpoint    string
	AccessToken string
}

// Repository is an application of the repository pattern for storing tokens
type Repository interface {
	FindVCSToken(endpoint string, userGUID string, encryptionKey []byte) (VCSTokenRecord, error)
	SaveVCSToken(t VCSTokenRecord, encryptionKey []byte) error
}

package interfaces

// Token -
type Token struct {
	UserGUID  string
	TokenType string
	Record    TokenRecord
}

// TokenRepository is an application of the repository pattern for storing tokens
type TokenRepository interface {
	FindAuthToken(userGUID string, encryptionKey []byte) (TokenRecord, error)
	SaveAuthToken(userGUID string, tokenRecord TokenRecord, encryptionKey []byte) error

	FindCNSIToken(cnsiGUID string, userGUID string, encryptionKey []byte) (TokenRecord, error)
	FindCNSITokenIncludeDisconnected(cnsiGUID string, userGUID string, encryptionKey []byte) (TokenRecord, error)
	FindAllCNSITokenBackup(cnsiGUID string, encryptionKey []byte) ([]BackupTokenRecord, error)
	DeleteCNSIToken(cnsiGUID string, userGUID string) error
	DeleteCNSITokens(cnsiGUID string) error
	SaveCNSIToken(cnsiGUID string, userGUID string, tokenRecord TokenRecord, encryptionKey []byte) error

	// Update a token's auth data
	UpdateTokenAuth(userGUID string, tokenRecord TokenRecord, encryptionKey []byte) error
}

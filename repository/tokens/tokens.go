package tokens

// TokenRecord -
type TokenRecord struct {
	Scope        string
	AuthToken    string
	RefreshToken string
	TokenExpiry  int64
}

// Token -
type Token struct {
	UserGUID  string
	TokenType string
	Record    TokenRecord
}

// Repository is an application of the repository pattern for storing tokens
type Repository interface {
	FindUAAToken(userGUID string, encryptionKey []byte) (TokenRecord, error)
	SaveUAAToken(userGUID string, tokenRecord TokenRecord, encryptionKey []byte) error

	FindCNSIToken(cnsiGUID string, userGUID string, encryptionKey []byte) (TokenRecord, error)
	DeleteCNSIToken(cnsiGUID string, userGUID string) error
	SaveCNSIToken(cnsiGUID string, userGUID string, tokenRecord TokenRecord, encryptionKey []byte) error
	ListCNSITokensForUser(userGUID string, encryptionKey []byte) ([]*TokenRecord, error)
}

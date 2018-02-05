package tokens

import "github.com/SUSE/stratos-ui/app-core/repository/interfaces"

// Token -
type Token struct {
	UserGUID  string
	TokenType string
	Record    interfaces.TokenRecord
}

// Repository is an application of the repository pattern for storing tokens
type Repository interface {
	FindAuthToken(userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error)
	SaveAuthToken(userGUID string, tokenRecord interfaces.TokenRecord, encryptionKey []byte) error

	FindCNSIToken(cnsiGUID string, userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error)
	FindCNSITokenIncludeDisconnected(cnsiGUID string, userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error)
	DeleteCNSIToken(cnsiGUID string, userGUID string) error
	SaveCNSIToken(cnsiGUID string, userGUID string, tokenRecord interfaces.TokenRecord, encryptionKey []byte) error
	ListCNSITokensForUser(userGUID string, encryptionKey []byte) ([]*interfaces.TokenRecord, error)
}

package tokens

import "github.com/hpcloud/portal-proxy/components/core/backend/repository/interfaces"

// Token -
type Token struct {
	UserGUID  string
	TokenType string
	Record    interfaces.TokenRecord
}

// Repository is an application of the repository pattern for storing tokens
type Repository interface {
	FindUAAToken(userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error)
	SaveUAAToken(userGUID string, tokenRecord interfaces.TokenRecord, encryptionKey []byte) error

	FindCNSIToken(cnsiGUID string, userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error)
	DeleteCNSIToken(cnsiGUID string, userGUID string) error
	SaveCNSIToken(cnsiGUID string, userGUID string, tokenRecord interfaces.TokenRecord, encryptionKey []byte) error
	ListCNSITokensForUser(userGUID string, encryptionKey []byte) ([]*interfaces.TokenRecord, error)
}

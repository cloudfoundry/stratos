package tokens

import "github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"

// Token -
type Token struct {
	UserGUID  string
	TokenType string
	Record    interfaces.TokenRecord
}

const SystemSharedUserGuid = "00000000-1111-2222-3333-444444444444" // User ID for the system shared user for endpoints

// Repository is an application of the repository pattern for storing tokens
type Repository interface {
	FindAuthToken(userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error)
	SaveAuthToken(userGUID string, tokenRecord interfaces.TokenRecord, encryptionKey []byte) error

	FindCNSIToken(cnsiGUID string, userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error)
	FindCNSITokenIncludeDisconnected(cnsiGUID string, userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error)
	DeleteCNSIToken(cnsiGUID string, userGUID string) error
	DeleteCNSITokens(cnsiGUID string) error
	SaveCNSIToken(cnsiGUID string, userGUID string, tokenRecord interfaces.TokenRecord, encryptionKey []byte) error

	// Update a token's auth data
	UpdateTokenAuth(userGUID string, tokenRecord interfaces.TokenRecord, encryptionKey []byte) error
}

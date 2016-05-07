package tokens

type TokenRecord struct {
	AuthToken    string
	RefreshToken string
	TokenExpiry  int64
}

type Token struct {
  UserGUID      string
  TokenType     string
  Record        TokenRecord
}

// Repository is an application of the repository pattern for storing tokens
type Repository interface {
  FindUaaToken(user_guid string) (TokenRecord, error)
  SaveUaaToken(user_guid string, tokenRecord TokenRecord) error

  FindCnsiToken(cnsi_guid string, user_guid string) (TokenRecord, error)
  SaveCnsiToken(cnsi_guid string, user_guid string, tokenRecord TokenRecord) error
}

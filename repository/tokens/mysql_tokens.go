package tokens

import (
	"fmt"
	"database/sql"
	_ "github.com/go-sql-driver/mysql"

 	"portal-proxy/mysql"
 	"portal-proxy/repository"
)

const (
	findUaaToken 	= `SELECT auth_token, refresh_token, token_expiry
								 	 FROM tokens
								 	 WHERE token_type = 'uaa' AND user_guid = ?`
 	saveUaaToken 	= `INSERT INTO tokens (user_guid, token_type, auth_token, refresh_token, token_expiry)
									 VALUES (?, 'uaa', ?, ?, ?)`
  findCnsiToken = `SELECT auth_token, refresh_token, token_expiry
									 FROM tokens
									 WHERE cnsi_guid=? AND user_guid = ? AND token_type = 'cnsi'`
	saveCnsiToken = `INSERT INTO tokens (cnsi_guid, user_guid, token_type, auth_token, refresh_token, token_expiry)
									 VALUES (?, ?, 'cnsi', ?, ?, ?)`
)

// MysqlTokenRepository is a MySQL-backed token repository
type MysqlTokenRepository struct {
	Repository

	db *sql.DB
}

func NewMysqlTokenRepository(configParams mysql.MysqlConnectionParameters) (Repository, error) {
	db, err := mysql.GetConnection(configParams)
	if err != nil {
		return nil, err
	}

	return &MysqlTokenRepository{db: db}, nil
}


func (p *MysqlTokenRepository) SaveUaaToken(user_guid string, tr TokenRecord) error {

  stmt, es := p.db.Prepare(saveUaaToken)
  if es != nil {
      return &repository.DatabaseError{InnerError: es}
  }

  _, err := stmt.Exec(user_guid, tr.AuthToken, tr.RefreshToken, tr.TokenExpiry)
	if err != nil {
		return &repository.DatabaseError{InnerError: err}
	}

	return nil
}


func (p *MysqlTokenRepository) FindUaaToken(user_guid string) (TokenRecord, error) {

  tr := new(TokenRecord)

	err := p.db.QueryRow(findUaaToken, user_guid).Scan(&tr.AuthToken, &tr.RefreshToken, &tr.TokenExpiry)
	if err != nil {
		return TokenRecord{}, &repository.DatabaseError{InnerError: err}
	}

	return *tr, nil
}


func (p *MysqlTokenRepository) SaveCnsiToken(cnsi_guid string, user_guid string, tr TokenRecord) error {

  stmt, es := p.db.Prepare(saveCnsiToken)
  if es != nil {
		return &repository.DatabaseError{InnerError: es}
  }

  _, err := stmt.Exec(cnsi_guid, user_guid, tr.AuthToken, tr.RefreshToken, tr.TokenExpiry)

	if err != nil {
		return &repository.DatabaseError{InnerError: err}
	}

	return nil
}


func (p *MysqlTokenRepository) FindCnsiToken(cnsi_guid string, user_guid string) (TokenRecord, error) {

  tr := new(TokenRecord)

	err := p.db.QueryRow(findCnsiToken, cnsi_guid, user_guid).Scan(&tr.AuthToken, &tr.RefreshToken, &tr.TokenExpiry)
	if err != nil {
		return TokenRecord{}, &repository.DatabaseError{InnerError: err}
	}

	return *tr, nil
}

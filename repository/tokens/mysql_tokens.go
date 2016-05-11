package tokens

import (
	"database/sql"
	"fmt"

	"github.com/hpcloud/portal-proxy/datastore"
)

const (
	findUAAToken = `SELECT auth_token, refresh_token, token_expiry
								 	FROM tokens
								 	WHERE token_type = 'uaa' AND user_guid = ?`
	saveUAAToken = `INSERT INTO tokens (user_guid, token_type, auth_token, refresh_token, token_expiry)
									VALUES (?, 'uaa', ?, ?, ?)`
	findCNSIToken = `SELECT auth_token, refresh_token, token_expiry
									 FROM tokens
									 WHERE cnsi_guid=? AND user_guid = ? AND token_type = 'cnsi'`
	saveCNSIToken = `INSERT INTO tokens (cnsi_guid, user_guid, token_type, auth_token, refresh_token, token_expiry)
									 VALUES (?, ?, 'cnsi', ?, ?, ?)`
)

// MysqlTokenRepository is a MySQL-backed token repository
type MysqlTokenRepository struct {
	db *sql.DB
}

// NewMysqlTokenRepository - get a reference to the token data source
func NewMysqlTokenRepository(configParams datastore.MysqlConnectionParameters) (Repository, error) {
	db, err := datastore.GetConnection(configParams)
	if err != nil {
		return nil, err
	}

	return &MysqlTokenRepository{db: db}, nil
}

// SaveUAAToken - Save the UAA token to the datastore
func (p *MysqlTokenRepository) SaveUAAToken(userGUID string, tr TokenRecord) error {

	stmt, err := p.db.Prepare(saveUAAToken)
	if err != nil {
		return fmt.Errorf("Unable to Prepare/Save UAA token: %v", err)
	}

	_, err = stmt.Exec(userGUID, tr.AuthToken, tr.RefreshToken, tr.TokenExpiry)
	if err != nil {
		return fmt.Errorf("Unable to Save UAA token: %v", err)
	}

	return nil
}

// FindUAAToken - return the UAA token from the datastore
func (p *MysqlTokenRepository) FindUAAToken(userGUID string) (TokenRecord, error) {

	tr := new(TokenRecord)

	err := p.db.QueryRow(findUAAToken, userGUID).Scan(&tr.AuthToken, &tr.RefreshToken, &tr.TokenExpiry)
	if err != nil {
		return TokenRecord{}, fmt.Errorf("Unable to Find UAA token: %v", err)
	}

	return *tr, nil
}

// SaveCNSIToken - Save the CNSI (UAA) token to the datastore
func (p *MysqlTokenRepository) SaveCNSIToken(cnsiGUID string, userGUID string, tr TokenRecord) error {

	stmt, err := p.db.Prepare(saveCNSIToken)
	if err != nil {
		return fmt.Errorf("Unable to Prepare/Save CNSI token: %v", err)
	}

	_, err = stmt.Exec(cnsiGUID, userGUID, tr.AuthToken, tr.RefreshToken, tr.TokenExpiry)

	if err != nil {
		return fmt.Errorf("Unable to Save CNSI token: %v", err)
	}

	return nil
}

// FindCNSIToken - retrieve a CNSI (UAA) token from the datastore
func (p *MysqlTokenRepository) FindCNSIToken(cnsiGUID string, userGUID string) (TokenRecord, error) {

	tr := new(TokenRecord)

	err := p.db.QueryRow(findCNSIToken, cnsiGUID, userGUID).Scan(&tr.AuthToken, &tr.RefreshToken, &tr.TokenExpiry)
	if err != nil {
		return TokenRecord{}, fmt.Errorf("Unable to Find CNSI token: %v", err)
	}

	return *tr, nil
}

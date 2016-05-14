package tokens

import (
	"database/sql"
	"fmt"

	"github.com/hpcloud/portal-proxy/datastore"
)

const (
	findUAAToken = `SELECT auth_token, refresh_token, token_expiry
								 	FROM tokens
								 	WHERE token_type = 'uaa' AND user_guid = $1`
	saveUAAToken = `INSERT INTO tokens (user_guid, token_type, auth_token, refresh_token, token_expiry)
									VALUES ($1, 'uaa', $2, $3, $4)`
	findCNSIToken = `SELECT auth_token, refresh_token, token_expiry
									 FROM tokens
									 WHERE cnsi_guid=$1 AND user_guid = $2 AND token_type = 'cnsi'`
	saveCNSIToken = `INSERT INTO tokens (cnsi_guid, user_guid, token_type, auth_token, refresh_token, token_expiry)
									 VALUES ($1, $2, 'cnsi', $3, $4, $5)`
)

// PgsqlTokenRepository is a PostgreSQL-backed token repository
type PgsqlTokenRepository struct {
	db *sql.DB
}

// NewPgsqlTokenRepository - get a reference to the token data source
func NewPgsqlTokenRepository(dc datastore.DatabaseConfig) (Repository, error) {
	db, err := datastore.GetConnection(dc)
	if err != nil {
		return nil, err
	}

	return &PgsqlTokenRepository{db: db}, nil
}

// SaveUAAToken - Save the UAA token to the datastore
func (p *PgsqlTokenRepository) SaveUAAToken(userGUID string, tr TokenRecord) error {

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
func (p *PgsqlTokenRepository) FindUAAToken(userGUID string) (TokenRecord, error) {

	tr := new(TokenRecord)

	err := p.db.QueryRow(findUAAToken, userGUID).Scan(&tr.AuthToken, &tr.RefreshToken, &tr.TokenExpiry)
	if err != nil {
		return TokenRecord{}, fmt.Errorf("Unable to Find UAA token: %v", err)
	}

	return *tr, nil
}

// SaveCNSIToken - Save the CNSI (UAA) token to the datastore
func (p *PgsqlTokenRepository) SaveCNSIToken(cnsiGUID string, userGUID string, tr TokenRecord) error {

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
func (p *PgsqlTokenRepository) FindCNSIToken(cnsiGUID string, userGUID string) (TokenRecord, error) {

	tr := new(TokenRecord)

	err := p.db.QueryRow(findCNSIToken, cnsiGUID, userGUID).Scan(&tr.AuthToken, &tr.RefreshToken, &tr.TokenExpiry)
	if err != nil {
		return TokenRecord{}, fmt.Errorf("Unable to Find CNSI token: %v", err)
	}

	return *tr, nil
}

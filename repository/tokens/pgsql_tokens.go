package tokens

import (
	"database/sql"
	"fmt"
)

const (
	findUAAToken = `SELECT auth_token, refresh_token, token_expiry
                  FROM tokens
                  WHERE token_type = 'uaa' AND user_guid = $1`

	saveUAAToken = `INSERT INTO tokens (user_guid, token_type, auth_token, refresh_token, token_expiry)
                  VALUES ($1, $2, $3, $4, $5)
                  ON CONFLICT ON CONSTRAINT tokens_user_guid_token_type_key
                  DO UPDATE SET auth_token = EXCLUDED.auth_token, refresh_token = EXCLUDED.refresh_token, token_expiry = EXCLUDED.token_expiry`

	findCNSIToken = `SELECT auth_token, refresh_token, token_expiry
                   FROM tokens
                   WHERE cnsi_guid=$1 AND user_guid = $2 AND token_type = 'cnsi'`

	saveCNSIToken = `INSERT INTO tokens (cnsi_guid, user_guid, token_type, auth_token, refresh_token, token_expiry)
                   VALUES ($1, $2, $3, $4, $5, $6)
                   ON CONFLICT ON CONSTRAINT tokens_user_guid_cnsi_guid_key
                   DO UPDATE SET auth_token = EXCLUDED.auth_token, refresh_token = EXCLUDED.refresh_token, token_expiry = EXCLUDED.token_expiry`
)

// PgsqlTokenRepository is a PostgreSQL-backed token repository
type PgsqlTokenRepository struct {
	db *sql.DB
}

// NewPgsqlTokenRepository - get a reference to the token data source
func NewPgsqlTokenRepository(dcp *sql.DB) (Repository, error) {
	return &PgsqlTokenRepository{db: dcp}, nil
}

// SaveUAAToken - Save the UAA token to the datastore
func (p *PgsqlTokenRepository) SaveUAAToken(userGUID string, tr TokenRecord) error {

	if userGUID == "" {
		return fmt.Errorf("Unable to save UAA Token without a valid User GUID.")
	}

	if tr.AuthToken == "" {
		return fmt.Errorf("Unable to save UAA Token without a valid Auth Token.")
	}

	if tr.RefreshToken == "" {
		return fmt.Errorf("Unable to save UAA Token without a valid Refresh Token.")
	}

	if _, err := p.db.Exec(saveUAAToken, userGUID, "uaa", tr.AuthToken, tr.RefreshToken,
		tr.TokenExpiry); err != nil {
		return fmt.Errorf("Unable to Save UAA token: %v", err)
	}

	return nil
}

// FindUAAToken - return the UAA token from the datastore
func (p *PgsqlTokenRepository) FindUAAToken(userGUID string) (TokenRecord, error) {

	tr := new(TokenRecord)

	if userGUID == "" {
		return TokenRecord{}, fmt.Errorf("Unable to find UAA Token without a valid User GUID.")
	}

	err := p.db.QueryRow(findUAAToken, userGUID).Scan(&tr.AuthToken, &tr.RefreshToken, &tr.TokenExpiry)
	if err != nil {
		return TokenRecord{}, fmt.Errorf("Unable to Find UAA token: %v", err)
	}

	return *tr, nil
}

// SaveCNSIToken - Save the CNSI (UAA) token to the datastore
func (p *PgsqlTokenRepository) SaveCNSIToken(cnsiGUID string, userGUID string, tr TokenRecord) error {

	if cnsiGUID == "" {
		return fmt.Errorf("Unable to save CNSI Token without a valid CNSI GUID.")
	}

	if userGUID == "" {
		return fmt.Errorf("Unable to save CNSI Token without a valid User GUID.")
	}

	if tr.AuthToken == "" {
		return fmt.Errorf("Unable to save CNSI Token without a valid Auth Token.")
	}

	if tr.RefreshToken == "" {
		return fmt.Errorf("Unable to save CNSI Token without a valid Refresh Token.")
	}

	if _, err := p.db.Exec(saveCNSIToken, cnsiGUID, userGUID, "cnsi", tr.AuthToken,
		tr.RefreshToken, tr.TokenExpiry); err != nil {
		return fmt.Errorf("Unable to Save CNSI token: %v", err)
	}

	return nil
}

// FindCNSIToken - retrieve a CNSI (UAA) token from the datastore
func (p *PgsqlTokenRepository) FindCNSIToken(cnsiGUID string, userGUID string) (TokenRecord, error) {

	tr := new(TokenRecord)

	if cnsiGUID == "" {
		return TokenRecord{}, fmt.Errorf("Unable to find CNSI Token without a valid CNSI GUID.")
	}

	if userGUID == "" {
		return TokenRecord{}, fmt.Errorf("Unable to find CNSI Token without a valid User GUID.")
	}

	err := p.db.QueryRow(findCNSIToken, cnsiGUID, userGUID).Scan(&tr.AuthToken, &tr.RefreshToken, &tr.TokenExpiry)
	if err != nil {
		return TokenRecord{}, fmt.Errorf("Unable to Find CNSI token: %v", err)
	}

	return *tr, nil
}

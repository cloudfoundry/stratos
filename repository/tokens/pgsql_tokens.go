package tokens

import (
	"database/sql"
	"fmt"
)

const (
	findUAAToken = `SELECT auth_token, refresh_token, token_expiry
                  FROM tokens
                  WHERE token_type = 'uaa' AND user_guid = $1`

	insertUAAToken = `INSERT INTO tokens (user_guid, token_type, auth_token, refresh_token, token_expiry)
	                  VALUES ($1, $2, $3, $4, $5)`

	updateUAAToken = `UPDATE tokens
	                  SET auth_token = $3, refresh_token = $4, token_expiry = $5
	                  WHERE user_guid = $1 AND token_type = $2`

	findCNSIToken = `SELECT auth_token, refresh_token, token_expiry
                   FROM tokens
                   WHERE cnsi_guid=$1 AND user_guid = $2 AND token_type = 'cnsi'`

	insertCNSIToken = `INSERT INTO tokens (cnsi_guid, user_guid, token_type, auth_token, refresh_token, token_expiry)
	                   VALUES ($1, $2, $3, $4, $5, $6)`

	updateCNSIToken = `UPDATE tokens
	                   SET auth_token = $4, refresh_token = $5, token_expiry = $6
	                   WHERE cnsi_guid = $1 AND user_guid = $2 AND token_type = $3`
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

	// Is there an existing token?
	err := p.db.QueryRow(findUAAToken, userGUID).Scan(&tr.AuthToken, &tr.RefreshToken, &tr.TokenExpiry)
	switch {
	case err == sql.ErrNoRows:

		fmt.Println("Existing UAA token not found - attempting insert.")

		// Row not found
		if _, insertErr := p.db.Exec(insertUAAToken, userGUID, "uaa", tr.AuthToken, tr.RefreshToken,
			tr.TokenExpiry); insertErr != nil {
			fmt.Printf("Unable to INSERT UAA token: %v", insertErr)
			return fmt.Errorf("Unable to INSERT UAA token: %v", insertErr)
		}

		fmt.Println("UAA token INSERT complete.")

	case err != nil:
		fmt.Printf("Unknown error attempting to find UAA token: %v", err)

	default:

		fmt.Println("Existing UAA token found - attempting update.")

		// Found a match - update it
		if _, uodateErr := p.db.Exec(updateUAAToken, userGUID, "uaa", tr.AuthToken, tr.RefreshToken,
			tr.TokenExpiry); uodateErr != nil {
			fmt.Printf("Unable to UPDATE UAA token: %v", uodateErr)
			return fmt.Errorf("Unable to UPDATE UAA token: %v", uodateErr)
		}

		fmt.Println("UAA token UPDATE complete.")
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

	// Is there an existing token?
	err := p.db.QueryRow(findCNSIToken, cnsiGUID, userGUID).Scan(&tr.AuthToken, &tr.RefreshToken, &tr.TokenExpiry)
	switch {
	case err == sql.ErrNoRows:

		fmt.Println("Existing CNSI token not found - attempting insert.")

		// Row not found
		if _, insertErr := p.db.Exec(insertCNSIToken, cnsiGUID, userGUID, "cnsi", tr.AuthToken,
			tr.RefreshToken, tr.TokenExpiry); insertErr != nil {
			fmt.Printf("Unable to INSERT CNSI token: %v", insertErr)
			return fmt.Errorf("Unable to INSERT CNSI token: %v", insertErr)
		}

		fmt.Println("CNSI token INSERT complete.")

	case err != nil:
		fmt.Printf("Unknown error attempting to find CNSI token: %v", err)

	default:

		fmt.Println("Existing CNSI token found - attempting update.")

		// Found a match - update it
		if _, updateErr := p.db.Exec(updateCNSIToken, cnsiGUID, userGUID, "cnsi", tr.AuthToken,
			tr.RefreshToken, tr.TokenExpiry); updateErr != nil {
			fmt.Printf("Unable to UPDATE CNSI token: %v", updateErr)
			return fmt.Errorf("Unable to UPDATE CNSI token: %v", updateErr)
		}

		fmt.Println("CNSI token UPDATE complete.")
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

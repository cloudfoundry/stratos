package tokens

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/SUSE/stratos-ui/components/app-core/backend/datastore"
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/crypto"
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
	log "github.com/Sirupsen/logrus"
)

var findUAAToken = `SELECT auth_token, refresh_token, token_expiry
									FROM tokens
									WHERE token_type = 'uaa' AND user_guid = $1`

var countUAATokens = `SELECT COUNT(*)
										FROM tokens
										WHERE token_type = 'uaa' AND user_guid = $1`

var insertUAAToken = `INSERT INTO tokens (user_guid, token_type, auth_token, refresh_token, token_expiry)
									VALUES ($1, $2, $3, $4, $5)`

var updateUAAToken = `UPDATE tokens
									SET auth_token = $1, refresh_token = $2, token_expiry = $3
									WHERE user_guid = $4 AND token_type = $5`

var findCNSIToken = `SELECT auth_token, refresh_token, token_expiry
										FROM tokens
										WHERE cnsi_guid = $1 AND user_guid = $2 AND token_type = 'cnsi'`

var listCNSITokensForUser = `SELECT auth_token, refresh_token, token_expiry
														FROM tokens
														WHERE token_type = 'cnsi' AND user_guid = $1`

var countCNSITokens = `SELECT COUNT(*)
											FROM tokens
											WHERE cnsi_guid=$1 AND user_guid = $2 AND token_type = 'cnsi'`

var insertCNSIToken = `INSERT INTO tokens (cnsi_guid, user_guid, token_type, auth_token, refresh_token, token_expiry)
										VALUES ($1, $2, $3, $4, $5, $6)`

var updateCNSIToken = `UPDATE tokens
										SET auth_token = $1, refresh_token = $2, token_expiry = $3
										WHERE cnsi_guid = $4 AND user_guid = $5 AND token_type = $6`

var deleteCNSIToken = `DELETE FROM tokens
											WHERE token_type = 'cnsi' AND cnsi_guid = $1 AND user_guid = $2`

// TODO (wchrisjohnson) We need to adjust several calls ^ to accept a list of items (guids) as input

// PgsqlTokenRepository is a PostgreSQL-backed token repository
type PgsqlTokenRepository struct {
	db *sql.DB
}

// NewPgsqlTokenRepository - get a reference to the token data source
func NewPgsqlTokenRepository(dcp *sql.DB) (Repository, error) {
	log.Println("NewPgsqlTokenRepository")
	return &PgsqlTokenRepository{db: dcp}, nil
}

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	// Modify the database statements if needed, for the given database type
	findUAAToken = datastore.ModifySQLStatement(findUAAToken, databaseProvider)
	countUAATokens = datastore.ModifySQLStatement(countUAATokens, databaseProvider)
	insertUAAToken = datastore.ModifySQLStatement(insertUAAToken, databaseProvider)
	updateUAAToken = datastore.ModifySQLStatement(updateUAAToken, databaseProvider)
	findCNSIToken = datastore.ModifySQLStatement(findCNSIToken, databaseProvider)
	listCNSITokensForUser = datastore.ModifySQLStatement(listCNSITokensForUser, databaseProvider)
	countCNSITokens = datastore.ModifySQLStatement(countCNSITokens, databaseProvider)
	insertCNSIToken = datastore.ModifySQLStatement(insertCNSIToken, databaseProvider)
	updateCNSIToken = datastore.ModifySQLStatement(updateCNSIToken, databaseProvider)
	deleteCNSIToken = datastore.ModifySQLStatement(deleteCNSIToken, databaseProvider)
}

// SaveUAAToken - Save the UAA token to the datastore
func (p *PgsqlTokenRepository) SaveUAAToken(userGUID string, tr interfaces.TokenRecord, encryptionKey []byte) error {
	log.Println("SaveUAAToken")
	if userGUID == "" {
		msg := "Unable to save UAA Token without a valid User GUID."
		log.Println(msg)
		return errors.New(msg)
	}

	if tr.AuthToken == "" {
		msg := "Unable to save UAA Token without a valid Auth Token."
		log.Println(msg)
		return errors.New(msg)
	}

	if tr.RefreshToken == "" {
		msg := "Unable to save UAA Token without a valid Refresh Token."
		log.Println(msg)
		return errors.New(msg)
	}

	log.Println("Encrypting Auth Token")
	ciphertextAuthToken, err := crypto.EncryptToken(encryptionKey, tr.AuthToken)
	if err != nil {
		return err
	}

	log.Println("Encrypting Refresh Token")
	ciphertextRefreshToken, err := crypto.EncryptToken(encryptionKey, tr.RefreshToken)
	if err != nil {
		return err
	}

	// Is there an existing token?
	var count int
	err = p.db.QueryRow(countUAATokens, userGUID).Scan(&count)
	if err != nil {
		log.Printf("Unknown error attempting to find UAA token: %v", err)
	}

	switch count {
	case 0:

		log.Println("Performing INSERT of encrypted tokens")
		if _, err := p.db.Exec(insertUAAToken, userGUID, "uaa", ciphertextAuthToken,
			ciphertextRefreshToken, tr.TokenExpiry); err != nil {
			msg := "Unable to INSERT UAA token: %v"
			log.Printf(msg, err)
			return fmt.Errorf(msg, err)
		}

		log.Println("UAA token INSERT complete")

	default:

		log.Println("Performing UPDATE of encrypted tokens")
		if _, updateErr := p.db.Exec(updateUAAToken, ciphertextAuthToken, ciphertextRefreshToken,
			tr.TokenExpiry, userGUID, "uaa"); updateErr != nil {
			msg := "Unable to UPDATE UAA token: %v"
			log.Printf(msg, updateErr)
			return fmt.Errorf(msg, updateErr)
		}

		log.Println("UAA token UPDATE complete.")
	}

	return nil
}

// FindUAAToken - return the UAA token from the datastore
func (p *PgsqlTokenRepository) FindUAAToken(userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error) {
	log.Println("FindUAAToken")
	if userGUID == "" {
		msg := "Unable to find UAA Token without a valid User GUID."
		log.Println(msg)
		return interfaces.TokenRecord{}, errors.New(msg)
	}

	// temp vars to retrieve db data
	var (
		ciphertextAuthToken    []byte
		ciphertextRefreshToken []byte
		tokenExpiry            int64
	)

	// Get the UAA record from the db
	err := p.db.QueryRow(findUAAToken, userGUID).Scan(&ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry)
	if err != nil {
		msg := "Unable to Find UAA token: %v"
		log.Printf(msg, err)
		return interfaces.TokenRecord{}, fmt.Errorf(msg, err)
	}

	log.Println("Decrypting Auth Token")
	plaintextAuthToken, err := crypto.DecryptToken(encryptionKey, ciphertextAuthToken)
	if err != nil {
		return interfaces.TokenRecord{}, err
	}

	log.Println("Decrypting Refresh Token")
	plaintextRefreshToken, err := crypto.DecryptToken(encryptionKey, ciphertextRefreshToken)
	if err != nil {
		return interfaces.TokenRecord{}, err
	}

	// Build a new TokenRecord based on the decrypted tokens
	tr := new(interfaces.TokenRecord)
	tr.AuthToken = plaintextAuthToken
	tr.RefreshToken = plaintextRefreshToken
	tr.TokenExpiry = tokenExpiry

	return *tr, nil
}

// SaveCNSIToken - Save the CNSI (UAA) token to the datastore
func (p *PgsqlTokenRepository) SaveCNSIToken(cnsiGUID string, userGUID string, tr interfaces.TokenRecord, encryptionKey []byte) error {
	log.Println("SaveCNSIToken")
	if cnsiGUID == "" {
		msg := "Unable to save CNSI Token without a valid CNSI GUID."
		log.Println(msg)
		return errors.New(msg)
	}

	if userGUID == "" {
		msg := "Unable to save CNSI Token without a valid User GUID."
		log.Println(msg)
		return errors.New(msg)
	}

	if tr.AuthToken == "" {
		msg := "Unable to save CNSI Token without a valid Auth Token."
		log.Println(msg)
		return errors.New(msg)
	}

	if tr.RefreshToken == "" {
		msg := "Unable to save CNSI Token without a valid Refresh Token."
		log.Println(msg)
		return errors.New(msg)
	}

	log.Println("Encrypting Auth Token")
	ciphertextAuthToken, err := crypto.EncryptToken(encryptionKey, tr.AuthToken)
	if err != nil {
		return err
	}

	log.Println("Encrypting Refresh Token")
	ciphertextRefreshToken, err := crypto.EncryptToken(encryptionKey, tr.RefreshToken)
	if err != nil {
		return err
	}

	// Is there an existing token?
	var count int
	err = p.db.QueryRow(countCNSITokens, cnsiGUID, userGUID).Scan(&count)
	if err != nil {
		log.Printf("Unknown error attempting to find CNSI token: %v", err)
	}

	switch count {
	case 0:

		if _, insertErr := p.db.Exec(insertCNSIToken, cnsiGUID, userGUID, "cnsi", ciphertextAuthToken,
			ciphertextRefreshToken, tr.TokenExpiry); insertErr != nil {

			msg := "Unable to INSERT CNSI token: %v"
			log.Printf(msg, insertErr)
			return fmt.Errorf(msg, insertErr)
		}

		log.Println("CNSI token INSERT complete.")

	default:

		log.Println("Existing CNSI token found - attempting update.")
		result, err := p.db.Exec(updateCNSIToken, ciphertextAuthToken, ciphertextRefreshToken, tr.TokenExpiry, cnsiGUID, userGUID, "cnsi")
		if err != nil {
			msg := "Unable to UPDATE CNSI token: %v"
			log.Printf(msg, err)
			return fmt.Errorf(msg, err)
		}

		rowsUpdates, err := result.RowsAffected()
		if err != nil {
			return errors.New("Unable to UPDATE CNSI token: could not determine number of rows that were updated")
		}

		if rowsUpdates < 1 {
			return errors.New("Unable to UPDATE CNSI token: no rows were updated")
		}

		if rowsUpdates > 1 {
			log.Warn("UPDATE CNSI token: More than 1 row was updated (expected only 1)")
		}

		log.Println("CNSI token UPDATE complete")
	}

	return nil
}

// FindCNSIToken - retrieve a CNSI (UAA) token from the datastore
func (p *PgsqlTokenRepository) FindCNSIToken(cnsiGUID string, userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error) {
	log.Println("FindCNSIToken")
	if cnsiGUID == "" {
		msg := "Unable to find CNSI Token without a valid CNSI GUID."
		log.Println(msg)
		return interfaces.TokenRecord{}, errors.New(msg)
	}

	if userGUID == "" {
		msg := "Unable to find CNSI Token without a valid User GUID."
		log.Println(msg)
		return interfaces.TokenRecord{}, errors.New(msg)
	}

	// temp vars to retrieve db data
	var (
		ciphertextAuthToken    []byte
		ciphertextRefreshToken []byte
		tokenExpiry            int64
	)

	err := p.db.QueryRow(findCNSIToken, cnsiGUID, userGUID).Scan(&ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry)
	if err != nil {
		msg := "Unable to Find CNSI token: %v"
		log.Printf(msg, err)
		return interfaces.TokenRecord{}, fmt.Errorf(msg, err)
	}

	log.Println("Decrypting Auth Token")
	plaintextAuthToken, err := crypto.DecryptToken(encryptionKey, ciphertextAuthToken)
	if err != nil {
		return interfaces.TokenRecord{}, err
	}

	log.Println("Decrypting Refresh Token")
	plaintextRefreshToken, err := crypto.DecryptToken(encryptionKey, ciphertextRefreshToken)
	if err != nil {
		return interfaces.TokenRecord{}, err
	}

	// Build a new TokenRecord based on the decrypted tokens
	tr := new(interfaces.TokenRecord)
	tr.AuthToken = plaintextAuthToken
	tr.RefreshToken = plaintextRefreshToken
	tr.TokenExpiry = tokenExpiry

	return *tr, nil
}

// ListCNSITokensForUser - <TBD>
func (p *PgsqlTokenRepository) ListCNSITokensForUser(userGUID string, encryptionKey []byte) ([]*interfaces.TokenRecord, error) {
	log.Println("ListCNSITokensForUser")

	if userGUID == "" {
		msg := "Unable to list CNSI Tokens without a valid User GUID."
		log.Println(msg)
		return nil, errors.New(msg)
	}

	rows, err := p.db.Query(listCNSITokensForUser, userGUID)
	if err != nil {
		msg := "Unable to retrieve CNSI records: %v"
		log.Printf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}
	defer rows.Close()

	if err = rows.Err(); err != nil {
		msg := "Unable to List token records: %v"
		log.Printf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	var tokenRecordList []*interfaces.TokenRecord
	tokenRecordList = make([]*interfaces.TokenRecord, 0)

	for rows.Next() {
		var (
			ciphertextAuthToken    []byte
			ciphertextRefreshToken []byte
			tokenExpiry            int64
		)

		err := rows.Scan(&ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry)
		if err != nil {
			msg := "Unable to scan token records: %v"
			log.Printf(msg, err)
			return nil, fmt.Errorf(msg, err)
		}

		log.Println("Decrypting Auth Token")
		plaintextAuthToken, err := crypto.DecryptToken(encryptionKey, ciphertextAuthToken)
		if err != nil {
			return nil, err
		}

		log.Println("Decrypting Refresh Token")
		plaintextRefreshToken, err := crypto.DecryptToken(encryptionKey, ciphertextRefreshToken)
		if err != nil {
			return nil, err
		}

		tr := new(interfaces.TokenRecord)
		tr.AuthToken = plaintextAuthToken
		tr.RefreshToken = plaintextRefreshToken
		tr.TokenExpiry = tokenExpiry

		tokenRecordList = append(tokenRecordList, tr)
	}

	// rows.Close()

	return tokenRecordList, nil
}

// DeleteCNSIToken - remove a CNSI token (disconnect from a given CNSI)
func (p *PgsqlTokenRepository) DeleteCNSIToken(cnsiGUID string, userGUID string) error {
	log.Println("DeleteCNSIToken")
	if cnsiGUID == "" {
		msg := "Unable to delete CNSI Token without a valid CNSI GUID."
		log.Println(msg)
		return errors.New(msg)
	}

	if userGUID == "" {
		msg := "Unable to delete CNSI Token without a valid User GUID."
		log.Println(msg)
		return errors.New(msg)
	}

	_, err := p.db.Exec(deleteCNSIToken, cnsiGUID, userGUID)
	if err != nil {
		msg := "Unable to Delete CNSI token: %v"
		log.Printf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

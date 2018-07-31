package tokens

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/SUSE/stratos-ui/datastore"
	"github.com/SUSE/stratos-ui/repository/crypto"
	"github.com/SUSE/stratos-ui/repository/interfaces"
	log "github.com/Sirupsen/logrus"
)

var findAuthToken = `SELECT auth_token, refresh_token, token_expiry, auth_type, meta_data
									FROM tokens
									WHERE token_type = 'uaa' AND user_guid = $1`

var countAuthTokens = `SELECT COUNT(*)
										FROM tokens
										WHERE token_type = 'uaa' AND user_guid = $1`

var insertAuthToken = `INSERT INTO tokens (user_guid, token_type, auth_token, refresh_token, token_expiry)
									VALUES ($1, $2, $3, $4, $5)`

var updateAuthToken = `UPDATE tokens
									SET auth_token = $1, refresh_token = $2, token_expiry = $3
									WHERE user_guid = $4 AND token_type = $5`

var findCNSIToken = `SELECT auth_token, refresh_token, token_expiry, disconnected, auth_type, meta_data, user_guid
										FROM tokens
										WHERE cnsi_guid = $1 AND (user_guid = $2 OR user_guid = $3) AND token_type = 'cnsi'`

var findCNSITokenConnected = `SELECT auth_token, refresh_token, token_expiry, disconnected, auth_type, meta_data, user_guid
										FROM tokens
										WHERE cnsi_guid = $1 AND (user_guid = $2 OR user_guid = $3) AND token_type = 'cnsi' AND disconnected = '0'`

var countCNSITokens = `SELECT COUNT(*)
											FROM tokens
											WHERE cnsi_guid=$1 AND user_guid = $2 AND token_type = 'cnsi'`

var insertCNSIToken = `INSERT INTO tokens (cnsi_guid, user_guid, token_type, auth_token, refresh_token, token_expiry, disconnected,  auth_type, meta_data)
										VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

var updateCNSIToken = `UPDATE tokens
										SET auth_token = $1, refresh_token = $2, token_expiry = $3, disconnected = $4, meta_data = $5
										WHERE cnsi_guid = $6 AND user_guid = $7 AND token_type = $8 AND auth_type = $9`

var deleteCNSIToken = `DELETE FROM tokens
											WHERE token_type = 'cnsi' AND cnsi_guid = $1 AND user_guid = $2`

// TODO (wchrisjohnson) We need to adjust several calls ^ to accept a list of items (guids) as input

// PgsqlTokenRepository is a PostgreSQL-backed token repository
type PgsqlTokenRepository struct {
	db *sql.DB
}

// NewPgsqlTokenRepository - get a reference to the token data source
func NewPgsqlTokenRepository(dcp *sql.DB) (Repository, error) {
	log.Debug("NewPgsqlTokenRepository")
	return &PgsqlTokenRepository{db: dcp}, nil
}

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	// Modify the database statements if needed, for the given database type
	findAuthToken = datastore.ModifySQLStatement(findAuthToken, databaseProvider)
	countAuthTokens = datastore.ModifySQLStatement(countAuthTokens, databaseProvider)
	insertAuthToken = datastore.ModifySQLStatement(insertAuthToken, databaseProvider)
	updateAuthToken = datastore.ModifySQLStatement(updateAuthToken, databaseProvider)
	findCNSIToken = datastore.ModifySQLStatement(findCNSIToken, databaseProvider)
	findCNSITokenConnected = datastore.ModifySQLStatement(findCNSITokenConnected, databaseProvider)
	countCNSITokens = datastore.ModifySQLStatement(countCNSITokens, databaseProvider)
	insertCNSIToken = datastore.ModifySQLStatement(insertCNSIToken, databaseProvider)
	updateCNSIToken = datastore.ModifySQLStatement(updateCNSIToken, databaseProvider)
	deleteCNSIToken = datastore.ModifySQLStatement(deleteCNSIToken, databaseProvider)
}

// saveAuthToken - Save the Auth token to the datastore
func (p *PgsqlTokenRepository) SaveAuthToken(userGUID string, tr interfaces.TokenRecord, encryptionKey []byte) error {
	log.Debug("SaveAuthToken")
	if userGUID == "" {
		msg := "Unable to save Auth Token without a valid User GUID."
		log.Debug(msg)
		return errors.New(msg)
	}

	if tr.AuthToken == "" {
		msg := "Unable to save Auth Token without a valid Auth Token."
		log.Debug(msg)
		return errors.New(msg)
	}

	log.Debug("Encrypting Auth Token")
	ciphertextAuthToken, err := crypto.EncryptToken(encryptionKey, tr.AuthToken)
	if err != nil {
		return err
	}
	var ciphertextRefreshToken []byte
	if tr.RefreshToken != "" {
		log.Debug("Encrypting Refresh Token")
		ciphertextRefreshToken, err = crypto.EncryptToken(encryptionKey, tr.RefreshToken)
		if err != nil {
			return err
		}
	}

	// Is there an existing token?
	var count int
	err = p.db.QueryRow(countAuthTokens, userGUID).Scan(&count)
	if err != nil {
		log.Errorf("Unknown error attempting to find UAA token: %v", err)
	}

	switch count {
	case 0:

		log.Debug("Performing INSERT of encrypted tokens")
		if _, err := p.db.Exec(insertAuthToken, userGUID, "uaa", ciphertextAuthToken,
			ciphertextRefreshToken, tr.TokenExpiry); err != nil {
			msg := "Unable to INSERT UAA token: %v"
			log.Debugf(msg, err)
			return fmt.Errorf(msg, err)
		}

		log.Debug("UAA token INSERT complete")

	default:

		log.Debug("Performing UPDATE of encrypted tokens")
		if _, updateErr := p.db.Exec(updateAuthToken, ciphertextAuthToken, ciphertextRefreshToken,
			tr.TokenExpiry, userGUID, "uaa"); updateErr != nil {
			msg := "Unable to UPDATE UAA token: %v"
			log.Debugf(msg, updateErr)
			return fmt.Errorf(msg, updateErr)
		}

		log.Debug("UAA token UPDATE complete.")
	}

	return nil
}

// FindAuthToken - return the UAA token from the datastore
func (p *PgsqlTokenRepository) FindAuthToken(userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error) {
	log.Debug("FindAuthToken")
	if userGUID == "" {
		msg := "Unable to find UAA Token without a valid User GUID."
		log.Debug(msg)
		return interfaces.TokenRecord{}, errors.New(msg)
	}

	// temp vars to retrieve db data
	var (
		ciphertextAuthToken    []byte
		ciphertextRefreshToken []byte
		tokenExpiry            sql.NullInt64
		authType               string
		metadata               sql.NullString
	)

	// Get the UAA record from the db
	err := p.db.QueryRow(findAuthToken, userGUID).Scan(&ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry, &authType, &metadata)
	if err != nil {
		msg := "Unable to Find UAA token: %v"
		log.Debugf(msg, err)
		return interfaces.TokenRecord{}, fmt.Errorf(msg, err)
	}

	log.Debug("Decrypting Auth Token")
	plaintextAuthToken, err := crypto.DecryptToken(encryptionKey, ciphertextAuthToken)
	if err != nil {
		return interfaces.TokenRecord{}, err
	}

	log.Debug("Decrypting Refresh Token")
	plaintextRefreshToken, err := crypto.DecryptToken(encryptionKey, ciphertextRefreshToken)
	if err != nil {
		return interfaces.TokenRecord{}, err
	}

	// Build a new TokenRecord based on the decrypted tokens
	tr := new(interfaces.TokenRecord)
	tr.AuthToken = plaintextAuthToken
	tr.RefreshToken = plaintextRefreshToken
	if tokenExpiry.Valid {
		tr.TokenExpiry = tokenExpiry.Int64
	}
	tr.AuthType = authType
	if metadata.Valid {
		tr.Metadata = metadata.String
	}

	return *tr, nil
}

// SaveCNSIToken - Save the CNSI (UAA) token to the datastore
func (p *PgsqlTokenRepository) SaveCNSIToken(cnsiGUID string, userGUID string, tr interfaces.TokenRecord, encryptionKey []byte) error {
	log.Debug("SaveCNSIToken")
	if cnsiGUID == "" {
		msg := "Unable to save CNSI Token without a valid CNSI GUID."
		log.Debug(msg)
		return errors.New(msg)
	}

	if userGUID == "" {
		msg := "Unable to save CNSI Token without a valid User GUID."
		log.Debug(msg)
		return errors.New(msg)
	}

	if tr.AuthToken == "" {
		msg := "Unable to save CNSI Token without a valid Auth Token."
		log.Debug(msg)
		return errors.New(msg)
	}

	log.Debug("Encrypting Auth Token")
	ciphertextAuthToken, err := crypto.EncryptToken(encryptionKey, tr.AuthToken)
	if err != nil {
		return err
	}

	var ciphertextRefreshToken []byte
	if tr.RefreshToken != "" {
		log.Debug("Encrypting Refresh Token")
		ciphertextRefreshToken, err = crypto.EncryptToken(encryptionKey, tr.RefreshToken)
		if err != nil {
			return err
		}
	}

	// Is there an existing token?
	var count int
	err = p.db.QueryRow(countCNSITokens, cnsiGUID, userGUID).Scan(&count)
	if err != nil {
		log.Errorf("Unknown error attempting to find CNSI token: %v", err)
	}

	switch count {
	case 0:

		if _, insertErr := p.db.Exec(insertCNSIToken, cnsiGUID, userGUID, "cnsi", ciphertextAuthToken,
			ciphertextRefreshToken, tr.TokenExpiry, tr.Disconnected, tr.AuthType, tr.Metadata); insertErr != nil {

			msg := "Unable to INSERT CNSI token: %v"
			log.Debugf(msg, insertErr)
			return fmt.Errorf(msg, insertErr)
		}

		log.Debug("CNSI token INSERT complete.")

	default:

		log.Debug("Existing CNSI token found - attempting update.")
		result, err := p.db.Exec(updateCNSIToken, ciphertextAuthToken, ciphertextRefreshToken, tr.TokenExpiry,
			tr.Disconnected, tr.Metadata, cnsiGUID, userGUID, "cnsi", tr.AuthType)
		if err != nil {
			msg := "Unable to UPDATE CNSI token: %v"
			log.Debugf(msg, err)
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

		log.Debug("CNSI token UPDATE complete")
	}

	return nil
}

func (p *PgsqlTokenRepository) FindCNSIToken(cnsiGUID string, userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error) {
	log.Debug("FindCNSIToken")
	return p.findCNSIToken(cnsiGUID, userGUID, encryptionKey, false)
}

func (p *PgsqlTokenRepository) FindCNSITokenIncludeDisconnected(cnsiGUID string, userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error) {
	log.Debug("FindCNSITokenIncludeDisconnected")
	return p.findCNSIToken(cnsiGUID, userGUID, encryptionKey, true)
}

func (p *PgsqlTokenRepository) findCNSIToken(cnsiGUID string, userGUID string, encryptionKey []byte, includeDisconnected bool) (interfaces.TokenRecord, error) {
	log.Debug("findCNSIToken")
	if cnsiGUID == "" {
		msg := "Unable to find CNSI Token without a valid CNSI GUID."
		log.Debug(msg)
		return interfaces.TokenRecord{}, errors.New(msg)
	}

	if userGUID == "" {
		msg := "Unable to find CNSI Token without a valid User GUID."
		log.Debug(msg)
		return interfaces.TokenRecord{}, errors.New(msg)
	}

	// temp vars to retrieve db data
	var (
		ciphertextAuthToken    []byte
		ciphertextRefreshToken []byte
		tokenExpiry            sql.NullInt64
		disconnected           bool
		authType               string
		metadata               sql.NullString
		tokenUserGUID          sql.NullString
	)

	var err error
	if includeDisconnected {
		err = p.db.QueryRow(findCNSIToken, cnsiGUID, userGUID, SystemSharedUserGuid).Scan(&ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry, &disconnected, &authType, &metadata, &tokenUserGUID)
	} else {
		err = p.db.QueryRow(findCNSITokenConnected, cnsiGUID, userGUID, SystemSharedUserGuid).Scan(&ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry, &disconnected, &authType, &metadata, &tokenUserGUID)
	}

	if err != nil {
		msg := "Unable to Find CNSI token: %v"
		if err == sql.ErrNoRows {
			log.Debugf(msg, err)
		} else {
			log.Errorf(msg, err)
		}
		return interfaces.TokenRecord{}, fmt.Errorf(msg, err)
	}

	log.Debug("Decrypting Auth Token")
	plaintextAuthToken, err := crypto.DecryptToken(encryptionKey, ciphertextAuthToken)
	if err != nil {
		return interfaces.TokenRecord{}, err
	}

	log.Debug("Decrypting Refresh Token")
	plaintextRefreshToken, err := crypto.DecryptToken(encryptionKey, ciphertextRefreshToken)
	if err != nil {
		return interfaces.TokenRecord{}, err
	}

	// Build a new TokenRecord based on the decrypted tokens
	tr := new(interfaces.TokenRecord)
	tr.AuthToken = plaintextAuthToken
	tr.RefreshToken = plaintextRefreshToken
	if tokenExpiry.Valid {
		tr.TokenExpiry = tokenExpiry.Int64
	}
	tr.Disconnected = disconnected
	tr.AuthType = authType
	if metadata.Valid {
		tr.Metadata = metadata.String
	}
	if tokenUserGUID.Valid {
		tr.SystemShared = tokenUserGUID.String == SystemSharedUserGuid
	}

	return *tr, nil
}

// DeleteCNSIToken - remove a CNSI token (disconnect from a given CNSI)
func (p *PgsqlTokenRepository) DeleteCNSIToken(cnsiGUID string, userGUID string) error {
	log.Debug("DeleteCNSIToken")
	if cnsiGUID == "" {
		msg := "Unable to delete CNSI Token without a valid CNSI GUID."
		log.Debug(msg)
		return errors.New(msg)
	}

	if userGUID == "" {
		msg := "Unable to delete CNSI Token without a valid User GUID."
		log.Debug(msg)
		return errors.New(msg)
	}

	_, err := p.db.Exec(deleteCNSIToken, cnsiGUID, userGUID)
	if err != nil {
		msg := "Unable to Delete CNSI token: %v"
		log.Debugf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

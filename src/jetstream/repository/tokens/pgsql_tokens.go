package tokens

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/crypto"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"
)

var findAuthToken = `SELECT token_guid, auth_token, refresh_token, token_expiry, auth_type, meta_data
									FROM tokens
									WHERE token_type = 'uaa' AND cnsi_guid = 'STRATOS' AND user_guid = $1`

var countAuthTokens = `SELECT COUNT(*)
										FROM tokens
										WHERE token_type = 'uaa' AND cnsi_guid = 'STRATOS' AND user_guid = $1 `

var insertAuthToken = `INSERT INTO tokens (cnsi_guid, token_guid, user_guid, token_type, auth_token, refresh_token, token_expiry)
									VALUES ('STRATOS', $1, $2, $3, $4, $5, $6)`

var updateAuthToken = `UPDATE tokens
									SET auth_token = $1, refresh_token = $2, token_expiry = $3
									WHERE cnsi_guid = 'STRATOS' AND user_guid = $4 AND token_type = $5`

var getToken = `SELECT token_guid, auth_token, refresh_token, token_expiry, disconnected, auth_type, meta_data, user_guid, linked_token
									FROM tokens
									WHERE user_guid = $1 AND token_guid = $2`

var getTokenConnected = `SELECT token_guid, auth_token, refresh_token, token_expiry, disconnected, auth_type, meta_data, user_guid, linked_token
									FROM tokens
									WHERE user_guid = $1 AND token_guid = $2 AND disconnected = '0'`

var findCNSIToken = `SELECT token_guid, auth_token, refresh_token, token_expiry, disconnected, auth_type, meta_data, user_guid, linked_token
										FROM tokens
										WHERE cnsi_guid = $1 AND (user_guid = $2 OR user_guid = $3) AND token_type = 'cnsi'`

var findCNSITokenConnected = `SELECT token_guid, auth_token, refresh_token, token_expiry, disconnected, auth_type, meta_data, user_guid, linked_token
										FROM tokens
										WHERE cnsi_guid = $1 AND (user_guid = $2 OR user_guid = $3) AND token_type = 'cnsi' AND disconnected = '0'`

var findAllCNSIToken = `SELECT user_guid, token_guid, auth_token, refresh_token, token_expiry, disconnected, auth_type, meta_data, user_guid, linked_token
										FROM tokens
										WHERE cnsi_guid = $1 AND token_type = 'cnsi'`

var countCNSITokens = `SELECT COUNT(*)
											FROM tokens
											WHERE cnsi_guid=$1 AND user_guid = $2 AND token_type = 'cnsi'`

var insertCNSIToken = `INSERT INTO tokens (token_guid, cnsi_guid, user_guid, token_type, auth_token, refresh_token, token_expiry, disconnected, auth_type, meta_data, linked_token)
										VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

var updateCNSIToken = `UPDATE tokens
										SET auth_token = $1, refresh_token = $2, token_expiry = $3, disconnected = $4, meta_data = $5, linked_token = $6
										WHERE cnsi_guid = $7 AND user_guid = $8 AND token_type = $9 AND auth_type = $10`
var deleteCNSIToken = `DELETE FROM tokens
										WHERE token_type = 'cnsi' AND cnsi_guid = $1 AND user_guid = $2`
var deleteCNSITokens = `DELETE FROM tokens
											WHERE token_type = 'cnsi' AND cnsi_guid = $1`

var updateToken = `UPDATE tokens
										SET auth_token = $1, refresh_token = $2, token_expiry = $3
										WHERE token_guid = $4 AND user_guid = $5`

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
	findAllCNSIToken = datastore.ModifySQLStatement(findAllCNSIToken, databaseProvider)
	countCNSITokens = datastore.ModifySQLStatement(countCNSITokens, databaseProvider)
	insertCNSIToken = datastore.ModifySQLStatement(insertCNSIToken, databaseProvider)
	updateCNSIToken = datastore.ModifySQLStatement(updateCNSIToken, databaseProvider)
	deleteCNSIToken = datastore.ModifySQLStatement(deleteCNSIToken, databaseProvider)
	deleteCNSITokens = datastore.ModifySQLStatement(deleteCNSITokens, databaseProvider)
	updateToken = datastore.ModifySQLStatement(updateToken, databaseProvider)
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
		tokenGUID := uuid.NewV4().String()
		if _, err := p.db.Exec(insertAuthToken, tokenGUID, userGUID, "uaa", ciphertextAuthToken,
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
		tokenGUID              sql.NullString
		ciphertextAuthToken    []byte
		ciphertextRefreshToken []byte
		tokenExpiry            sql.NullInt64
		authType               string
		metadata               sql.NullString
	)

	// Get the UAA record from the db
	err := p.db.QueryRow(findAuthToken, userGUID).Scan(&tokenGUID, &ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry, &authType, &metadata)
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
	if tokenGUID.Valid {
		tr.TokenGUID = tokenGUID.String
	}
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

	var ciphertextAuthToken, ciphertextRefreshToken []byte
	var err error

	var linkedToken sql.NullString

	// Linked token?
	if tr.LinkedGUID == "" {
		linkedToken = sql.NullString{}
	} else {
		tr.AuthToken = "LINKED TOKEN"
		tr.RefreshToken = "LINKED TOKEN"
		linkedToken = sql.NullString{
			String: tr.LinkedGUID,
			Valid:  true,
		}
	}

	log.Debug("Encrypting Auth Token")
	ciphertextAuthToken, err = crypto.EncryptToken(encryptionKey, tr.AuthToken)
	if err != nil {
		return err
	}
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
		tokenGUID := uuid.NewV4().String()
		if _, insertErr := p.db.Exec(insertCNSIToken, tokenGUID, cnsiGUID, userGUID, "cnsi", ciphertextAuthToken,
			ciphertextRefreshToken, tr.TokenExpiry, tr.Disconnected, tr.AuthType, tr.Metadata, linkedToken); insertErr != nil {

			msg := "Unable to INSERT CNSI token: %v"
			log.Debugf(msg, insertErr)
			return fmt.Errorf(msg, insertErr)
		}

		log.Debug("CNSI token INSERT complete.")

	default:

		log.Debug("Existing CNSI token found - attempting update.")
		result, err := p.db.Exec(updateCNSIToken, ciphertextAuthToken, ciphertextRefreshToken, tr.TokenExpiry,
			tr.Disconnected, tr.Metadata, linkedToken, cnsiGUID, userGUID, "cnsi", tr.AuthType)
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

func (p *PgsqlTokenRepository) FindAllCNSITokenBackup(cnsiGUID string, encryptionKey []byte) ([]interfaces.BackupTokenRecord, error) {
	log.Debug("FindAllCNSITokenBackup")
	if cnsiGUID == "" {
		msg := "Unable to find CNSI Token without a valid CNSI GUID."
		log.Debug(msg)
		return make([]interfaces.BackupTokenRecord, 0), errors.New(msg)
	}

	var rows *sql.Rows
	var err error
	rows, err = p.db.Query(findAllCNSIToken, cnsiGUID)
	if err != nil {
		msg := "Unable to Find All CNSI tokens: %v"
		if err == sql.ErrNoRows {
			log.Debugf(msg, err)
		} else {
			log.Errorf(msg, err)
		}
		return make([]interfaces.BackupTokenRecord, 0), fmt.Errorf(msg, err)
	}

	defer rows.Close()

	btrs := make([]interfaces.BackupTokenRecord, 0)
	for rows.Next() {
		// temp vars to retrieve db data
		var (
			userGUID               string
			tokenGUID              sql.NullString
			ciphertextAuthToken    []byte
			ciphertextRefreshToken []byte
			tokenExpiry            sql.NullInt64
			disconnected           bool
			authType               string
			metadata               sql.NullString
			tokenUserGUID          sql.NullString
			linkedTokenGUID        sql.NullString
		)
		err = rows.Scan(&userGUID, &tokenGUID, &ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry, &disconnected, &authType, &metadata, &tokenUserGUID, &linkedTokenGUID)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan CNSI records: %v", err)
		}

		log.Debug("Decrypting Auth Token")
		plaintextAuthToken, err := crypto.DecryptToken(encryptionKey, ciphertextAuthToken)
		if err != nil {
			return make([]interfaces.BackupTokenRecord, 0), err
		}

		log.Debug("Decrypting Refresh Token")
		plaintextRefreshToken, err := crypto.DecryptToken(encryptionKey, ciphertextRefreshToken)
		if err != nil {
			return make([]interfaces.BackupTokenRecord, 0), err
		}

		// Build a new TokenRecord based on the decrypted tokens
		tr := new(interfaces.TokenRecord)
		if tokenGUID.Valid {
			tr.TokenGUID = tokenGUID.String
		}
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
		if linkedTokenGUID.Valid {
			tr.LinkedGUID = linkedTokenGUID.String
		}

		btr := new(interfaces.BackupTokenRecord)
		btr.TokenRecord = *tr
		btr.EndpointGUID = cnsiGUID
		btr.TokenType = "cnsi"
		btr.UserGUID = userGUID

		btrs = append(btrs, *btr)

	}

	return btrs, nil
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
		tokenGUID              sql.NullString
		ciphertextAuthToken    []byte
		ciphertextRefreshToken []byte
		tokenExpiry            sql.NullInt64
		disconnected           bool
		authType               string
		metadata               sql.NullString
		tokenUserGUID          sql.NullString
		linkedTokenGUID        sql.NullString
	)

	var err error
	if includeDisconnected {
		err = p.db.QueryRow(findCNSIToken, cnsiGUID, userGUID, SystemSharedUserGuid).Scan(&tokenGUID, &ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry, &disconnected, &authType, &metadata, &tokenUserGUID, &linkedTokenGUID)
	} else {
		err = p.db.QueryRow(findCNSITokenConnected, cnsiGUID, userGUID, SystemSharedUserGuid).Scan(&tokenGUID, &ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry, &disconnected, &authType, &metadata, &tokenUserGUID, &linkedTokenGUID)
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

	// If this token is linked - fetch that token and use it instead
	// Currently we don't recurse - we only support one level of linked token - you can't link to another linked token
	if linkedTokenGUID.Valid {
		if includeDisconnected {
			err = p.db.QueryRow(getToken, userGUID, linkedTokenGUID.String).Scan(&tokenGUID, &ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry, &disconnected, &authType, &metadata, &tokenUserGUID, &linkedTokenGUID)
		} else {
			err = p.db.QueryRow(getTokenConnected, userGUID, linkedTokenGUID.String).Scan(&tokenGUID, &ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry, &disconnected, &authType, &metadata, &tokenUserGUID, &linkedTokenGUID)
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
	if tokenGUID.Valid {
		tr.TokenGUID = tokenGUID.String
	}
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
	if linkedTokenGUID.Valid {
		tr.LinkedGUID = linkedTokenGUID.String
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

func (p *PgsqlTokenRepository) DeleteCNSITokens(cnsiGUID string) error {
	log.Debug("DeleteCNSITokens")
	if cnsiGUID == "" {
		msg := "Unable to delete CNSI Token without a valid CNSI GUID."
		log.Debug(msg)
		return errors.New(msg)
	}

	_, err := p.db.Exec(deleteCNSITokens, cnsiGUID)
	if err != nil {
		msg := "Unable to Delete CNSI token: %v"
		log.Debugf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

// UpdateTokenAuth - Update a token's auth data
func (p *PgsqlTokenRepository) UpdateTokenAuth(userGUID string, tr interfaces.TokenRecord, encryptionKey []byte) error {
	log.Debug("UpdateTokenAuth")

	if userGUID == "" {
		msg := "Unable to save Token without a valid User GUID."
		log.Debug(msg)
		return errors.New(msg)
	}

	if tr.AuthToken == "" {
		msg := "Unable to save Token without a valid Auth Token."
		log.Debug(msg)
		return errors.New(msg)
	}

	if tr.RefreshToken == "" {
		msg := "Unable to save Token without a valid Refresh Token."
		log.Debug(msg)
		return errors.New(msg)
	}

	var ciphertextAuthToken, ciphertextRefreshToken []byte
	var err error

	var tokenGUID string

	// Linked token? if so, update the linked token
	if tr.LinkedGUID == "" {
		tokenGUID = tr.TokenGUID
	} else {
		tokenGUID = tr.LinkedGUID
	}

	if tr.RefreshToken == "" {
		msg := "Unable to save Token without a valid Token GUID"
		return errors.New(msg)
	}

	log.Infof("Updating token %s", tokenGUID)

	log.Debug("Encrypting Auth Token")
	ciphertextAuthToken, err = crypto.EncryptToken(encryptionKey, tr.AuthToken)
	if err != nil {
		return err
	}
	if tr.RefreshToken != "" {
		log.Debug("Encrypting Refresh Token")
		ciphertextRefreshToken, err = crypto.EncryptToken(encryptionKey, tr.RefreshToken)
		if err != nil {
			return err
		}
	}

	result, err := p.db.Exec(updateToken, ciphertextAuthToken, ciphertextRefreshToken, tr.TokenExpiry, tokenGUID, userGUID)
	if err != nil {
		msg := "Unable to UPDATE token: %v"
		log.Debugf(msg, err)
		return fmt.Errorf(msg, err)
	}

	rowsUpdates, err := result.RowsAffected()
	if err != nil {
		return errors.New("Unable to UPDATE token: could not determine number of rows that were updated")
	}

	if rowsUpdates < 1 {
		return errors.New("Unable to UPDATE token: no rows were updated")
	}

	if rowsUpdates > 1 {
		log.Warn("UPDATE token: More than 1 row was updated (expected only 1)")
	}

	log.Debug("Token UPDATE complete")

	return nil
}

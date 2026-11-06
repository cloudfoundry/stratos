package tokens

import (
	"database/sql"
	"errors"
	"fmt"
	"log/slog"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/crypto"
	"github.com/cloudfoundry/stratos/src/jetstream/datastore"
	"github.com/google/uuid"
)

var findAuthToken = `SELECT token_guid, auth_token, refresh_token, token_expiry, auth_type, meta_data, enabled
									FROM tokens
									WHERE token_type = 'uaa' AND cnsi_guid = 'STRATOS' AND user_guid = $1`

var countAuthTokens = `SELECT COUNT(*)
										FROM tokens
										WHERE token_type = 'uaa' AND cnsi_guid = 'STRATOS' AND user_guid = $1 `

var insertAuthToken = `INSERT INTO tokens (cnsi_guid, token_guid, user_guid, token_type, auth_token, refresh_token, token_expiry)
									VALUES ('STRATOS', $1, $2, $3, $4, $5, $6)`

var updateAuthToken = `UPDATE tokens
									SET auth_token = $1, refresh_token = $2, token_expiry = $3, last_updated = CURRENT_TIMESTAMP
									WHERE cnsi_guid = 'STRATOS' AND user_guid = $4 AND token_type = $5`

var getToken = `SELECT token_guid, auth_token, refresh_token, token_expiry, disconnected, auth_type, meta_data, user_guid, linked_token, enabled
									FROM tokens
									WHERE user_guid = $1 AND token_guid = $2`

var getTokenConnected = `SELECT token_guid, auth_token, refresh_token, token_expiry, disconnected, auth_type, meta_data, user_guid, linked_token, enabled
									FROM tokens
									WHERE user_guid = $1 AND token_guid = $2 AND disconnected = '0'`

var listAllEnabledConnectedCNSITokens = `SELECT cnsi_guid, token_guid, auth_token, refresh_token, token_expiry, user_guid
										FROM tokens
										WHERE token_type = 'cnsi' AND enabled = '1' AND disconnected = '0'`

var findCNSIToken = `SELECT token_guid, auth_token, refresh_token, token_expiry, disconnected, auth_type, meta_data, user_guid, linked_token, enabled
										FROM tokens
										WHERE cnsi_guid = $1 AND (user_guid = $2 OR user_guid = $3) AND token_type = 'cnsi'`

var findCNSITokenConnected = `SELECT token_guid, auth_token, refresh_token, token_expiry, disconnected, auth_type, meta_data, user_guid, linked_token, enabled
										FROM tokens
										WHERE cnsi_guid = $1 AND (user_guid = $2 OR user_guid = $3) AND token_type = 'cnsi' AND disconnected = '0'`

var findAllCNSIToken = `SELECT user_guid, token_guid, auth_token, refresh_token, token_expiry, disconnected, auth_type, meta_data, user_guid, linked_token, enabled
										FROM tokens
										WHERE cnsi_guid = $1 AND token_type = 'cnsi'`

var countCNSITokens = `SELECT COUNT(*)
											FROM tokens
											WHERE cnsi_guid=$1 AND user_guid = $2 AND token_type = 'cnsi'`

var insertCNSIToken = `INSERT INTO tokens (token_guid, cnsi_guid, user_guid, token_type, auth_token, refresh_token, token_expiry, disconnected, auth_type, meta_data, linked_token)
										VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

var updateCNSIToken = `UPDATE tokens
										SET auth_token = $1, refresh_token = $2, token_expiry = $3, disconnected = $4, meta_data = $5, linked_token = $6, last_updated = CURRENT_TIMESTAMP
										WHERE cnsi_guid = $7 AND user_guid = $8 AND token_type = $9 AND auth_type = $10`
var deleteCNSIToken = `DELETE FROM tokens
										WHERE token_type = 'cnsi' AND cnsi_guid = $1 AND user_guid = $2`
var deleteCNSITokens = `DELETE FROM tokens
											WHERE token_type = 'cnsi' AND cnsi_guid = $1`

var updateToken = `UPDATE tokens
										SET auth_token = $1, refresh_token = $2, token_expiry = $3, last_updated = CURRENT_TIMESTAMP
										WHERE token_guid = $4 AND user_guid = $5`

// PgsqlTokenRepository is a PostgreSQL-backed token repository
type PgsqlTokenRepository struct {
	db *sql.DB
}

// SystemSharedUserGuid - User ID for the system shared user for endpoints. Also used by front end
const SystemSharedUserGuid = "00000000-1111-2222-3333-444444444444"

// NewPgsqlTokenRepository - get a reference to the token data source
func NewPgsqlTokenRepository(dcp *sql.DB) (api.TokenRepository, error) {
	slog.Debug("NewPgsqlTokenRepository")
	return &PgsqlTokenRepository{db: dcp}, nil
}

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	// Modify the database statements if needed, for the given database type
	findAuthToken = datastore.ModifySQLStatement(findAuthToken, databaseProvider)
	countAuthTokens = datastore.ModifySQLStatement(countAuthTokens, databaseProvider)
	insertAuthToken = datastore.ModifySQLStatement(insertAuthToken, databaseProvider)
	updateAuthToken = datastore.ModifySQLStatement(updateAuthToken, databaseProvider)
	listAllEnabledConnectedCNSITokens = datastore.ModifySQLStatement(listAllEnabledConnectedCNSITokens, databaseProvider)
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
func (p *PgsqlTokenRepository) SaveAuthToken(userGUID string, tr api.TokenRecord, encryptionKey []byte) error {
	slog.Debug("SaveAuthToken", "user", userGUID)
	if userGUID == "" {
		msg := "Unable to save Auth Token without a valid User GUID."
		slog.Debug(msg)
		return errors.New(msg)
	}

	if tr.AuthToken == "" {
		msg := "Unable to save Auth Token without a valid Auth Token."
		slog.Debug(msg)
		return errors.New(msg)
	}

	slog.Debug("Encrypting Auth Token")
	ciphertextAuthToken, err := crypto.EncryptToken(encryptionKey, tr.AuthToken)
	if err != nil {
		return err
	}
	var ciphertextRefreshToken []byte
	if tr.RefreshToken != "" {
		slog.Debug("Encrypting Refresh Token")
		ciphertextRefreshToken, err = crypto.EncryptToken(encryptionKey, tr.RefreshToken)
		if err != nil {
			return err
		}
	}

	// Is there an existing token?
	var count int
	err = p.db.QueryRow(countAuthTokens, userGUID).Scan(&count)
	if err != nil {
		slog.Error("unknown error attempting to find the UAA token", "user", userGUID, "error", err)
	}

	switch count {
	case 0:

		slog.Debug("Performing INSERT of encrypted tokens", "user", userGUID)
		tokenGUID := uuid.New().String()
		if _, err := p.db.Exec(insertAuthToken, tokenGUID, userGUID, "uaa", ciphertextAuthToken,
			ciphertextRefreshToken, tr.TokenExpiry); err != nil {
			const msg = "unable to INSERT the UAA token"
			slog.Debug(msg, "user", userGUID, "error", err)
			return fmt.Errorf("%s: %w", msg, err)
		}

		slog.Debug("UAA token INSERT complete", "user", userGUID)

	default:

		slog.Debug("Performing UPDATE of encrypted tokens", "user", userGUID)
		if _, updateErr := p.db.Exec(updateAuthToken, ciphertextAuthToken, ciphertextRefreshToken,
			tr.TokenExpiry, userGUID, "uaa"); updateErr != nil {
			const msg = "unable to UPDATE the UAA token"
			slog.Debug(msg, "user", userGUID, "error", updateErr)
			return fmt.Errorf("%s: %w", msg, updateErr)
		}

		slog.Debug("UAA token UPDATE complete.", "user", userGUID)
	}

	return nil
}

// FindAuthToken - return the UAA token from the datastore
func (p *PgsqlTokenRepository) FindAuthToken(userGUID string, encryptionKey []byte) (api.TokenRecord, error) {
	slog.Debug("FindAuthToken", "user", userGUID)
	if userGUID == "" {
		msg := "Unable to find UAA Token without a valid User GUID."
		slog.Debug(msg)
		return api.TokenRecord{}, errors.New(msg)
	}

	// temp vars to retrieve db data
	var (
		tokenGUID              sql.NullString
		ciphertextAuthToken    []byte
		ciphertextRefreshToken []byte
		tokenExpiry            sql.NullInt64
		authType               string
		metadata               sql.NullString
		enabled                bool
	)

	// Get the UAA record from the db
	err := p.db.QueryRow(findAuthToken, userGUID).Scan(&tokenGUID, &ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry, &authType, &metadata, &enabled)
	if err != nil {
		const msg = "unable to find the UAA token"
		slog.Debug(msg, "user", userGUID, "error", err)
		return api.TokenRecord{}, fmt.Errorf("%s: %w", msg, err)
	}

	slog.Debug("Decrypting Auth Token")
	plaintextAuthToken, err := crypto.DecryptToken(encryptionKey, ciphertextAuthToken)
	if err != nil {
		return api.TokenRecord{}, err
	}

	slog.Debug("Decrypting Refresh Token")
	plaintextRefreshToken, err := crypto.DecryptToken(encryptionKey, ciphertextRefreshToken)
	if err != nil {
		return api.TokenRecord{}, err
	}

	// Build a new TokenRecord based on the decrypted tokens
	tr := new(api.TokenRecord)
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
	tr.Enabled = enabled
	return *tr, nil
}

// SaveCNSIToken - Save the CNSI (UAA) token to the datastore
func (p *PgsqlTokenRepository) SaveCNSIToken(cnsiGUID string, userGUID string, tr api.TokenRecord, encryptionKey []byte) error {
	slog.Debug("SaveCNSIToken", "endpoint", cnsiGUID, "user", userGUID)
	if cnsiGUID == "" {
		msg := "Unable to save CNSI Token without a valid CNSI GUID."
		slog.Debug(msg)
		return errors.New(msg)
	}

	if userGUID == "" {
		msg := "Unable to save CNSI Token without a valid User GUID."
		slog.Debug(msg)
		return errors.New(msg)
	}

	if tr.AuthToken == "" {
		msg := "Unable to save CNSI Token without a valid Auth Token."
		slog.Debug(msg)
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

	slog.Debug("Encrypting Auth Token")
	ciphertextAuthToken, err = crypto.EncryptToken(encryptionKey, tr.AuthToken)
	if err != nil {
		return err
	}
	if tr.RefreshToken != "" {
		slog.Debug("Encrypting Refresh Token")
		ciphertextRefreshToken, err = crypto.EncryptToken(encryptionKey, tr.RefreshToken)
		if err != nil {
			return err
		}
	}

	// Is there an existing token?
	var count int
	err = p.db.QueryRow(countCNSITokens, cnsiGUID, userGUID).Scan(&count)
	if err != nil {
		slog.Error("unknown error attempting to find the CNSI token",
			"endpoint", cnsiGUID, "user", userGUID, "error", err)
	}

	switch count {
	case 0:
		tokenGUID := uuid.New().String()
		if _, insertErr := p.db.Exec(insertCNSIToken, tokenGUID, cnsiGUID, userGUID, "cnsi", ciphertextAuthToken,
			ciphertextRefreshToken, tr.TokenExpiry, tr.Disconnected, tr.AuthType, tr.Metadata, linkedToken); insertErr != nil {

			const msg = "unable to INSERT the CNSI token"
			slog.Debug(msg, "endpoint", cnsiGUID, "user", userGUID, "error", insertErr)
			return fmt.Errorf("%s: %w", msg, insertErr)
		}

		slog.Debug("CNSI token INSERT complete.", "endpoint", cnsiGUID, "user", userGUID)

	default:

		slog.Debug("Existing CNSI token found - attempting update.", "endpoint", cnsiGUID, "user", userGUID)
		result, err := p.db.Exec(updateCNSIToken, ciphertextAuthToken, ciphertextRefreshToken, tr.TokenExpiry,
			tr.Disconnected, tr.Metadata, linkedToken, cnsiGUID, userGUID, "cnsi", tr.AuthType)
		if err != nil {
			const msg = "unable to UPDATE the CNSI token"
			slog.Debug(msg, "endpoint", cnsiGUID, "user", userGUID, "error", err)
			return fmt.Errorf("%s: %w", msg, err)
		}

		rowsUpdates, err := result.RowsAffected()
		if err != nil {
			return errors.New("Unable to UPDATE CNSI token: could not determine number of rows that were updated")
		}

		if rowsUpdates < 1 {
			return errors.New("Unable to UPDATE CNSI token: no rows were updated")
		}

		if rowsUpdates > 1 {
			slog.Warn("UPDATE CNSI token: more than 1 row was updated (expected only 1)",
				"endpoint", cnsiGUID, "user", userGUID, "rows", rowsUpdates)
		}

		slog.Debug("CNSI token UPDATE complete", "endpoint", cnsiGUID, "user", userGUID)
	}

	return nil
}

func (p *PgsqlTokenRepository) ListAllEnabledConnectedCNSITokens(encryptionKey []byte) ([]api.BackupTokenRecord, error) {
	slog.Debug("ListAllEnabledConnectedCNSITokens")

	rows, err := p.db.Query(listAllEnabledConnectedCNSITokens)
	if err != nil {
		const msg = "unable to find all CNSI tokens"
		if err == sql.ErrNoRows {
			slog.Debug(msg, "error", err)
		} else {
			slog.Error(msg, "error", err)
		}
		return make([]api.BackupTokenRecord, 0), fmt.Errorf("%s: %w", msg, err)
	}

	defer func() { _ = rows.Close() }()

	btrs := make([]api.BackupTokenRecord, 0)

	for rows.Next() {
		// temp vars to retrieve db data
		// cnsi_guid, token_guid, auth_token, refresh_token, token_expiry, user_guid
		var (
			cnsiGUID               sql.NullString
			tokenGUID              sql.NullString
			ciphertextAuthToken    []byte
			ciphertextRefreshToken []byte
			tokenExpiry            sql.NullInt64
			tokenUserGUID          sql.NullString
		)
		err = rows.Scan(&cnsiGUID, &tokenGUID, &ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry, &tokenUserGUID)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan CNSI records: %v", err)
		}

		slog.Debug("Decrypting Auth Token")
		plaintextAuthToken, err := crypto.DecryptToken(encryptionKey, ciphertextAuthToken)
		if err != nil {
			return make([]api.BackupTokenRecord, 0), err
		}

		slog.Debug("Decrypting Refresh Token")
		plaintextRefreshToken, err := crypto.DecryptToken(encryptionKey, ciphertextRefreshToken)
		if err != nil {
			return make([]api.BackupTokenRecord, 0), err
		}

		// Build a new TokenRecord based on the decrypted tokens
		tr := new(api.TokenRecord)
		if tokenGUID.Valid {
			tr.TokenGUID = tokenGUID.String
		}
		tr.AuthToken = plaintextAuthToken
		tr.RefreshToken = plaintextRefreshToken
		if tokenExpiry.Valid {
			tr.TokenExpiry = tokenExpiry.Int64
		}
		if tokenUserGUID.Valid {
			tr.SystemShared = tokenUserGUID.String == SystemSharedUserGuid
		}

		btr := new(api.BackupTokenRecord)
		btr.TokenRecord = *tr
		if tokenUserGUID.Valid {
			btr.UserGUID = tokenUserGUID.String
		}
		if cnsiGUID.Valid {
			btr.EndpointGUID = cnsiGUID.String
		}

		btrs = append(btrs, *btr)
	}

	return btrs, nil
}

func (p *PgsqlTokenRepository) FindCNSIToken(cnsiGUID string, userGUID string, encryptionKey []byte) (api.TokenRecord, error) {
	slog.Debug("FindCNSIToken", "endpoint", cnsiGUID, "user", userGUID)
	return p.findCNSIToken(cnsiGUID, userGUID, encryptionKey, false)
}

func (p *PgsqlTokenRepository) FindCNSITokenIncludeDisconnected(cnsiGUID string, userGUID string, encryptionKey []byte) (api.TokenRecord, error) {
	slog.Debug("FindCNSITokenIncludeDisconnected", "endpoint", cnsiGUID, "user", userGUID)
	return p.findCNSIToken(cnsiGUID, userGUID, encryptionKey, true)
}

func (p *PgsqlTokenRepository) FindAllCNSITokenBackup(cnsiGUID string, encryptionKey []byte) ([]api.BackupTokenRecord, error) {
	slog.Debug("FindAllCNSITokenBackup", "endpoint", cnsiGUID)
	if cnsiGUID == "" {
		msg := "Unable to find CNSI Token without a valid CNSI GUID."
		slog.Debug(msg)
		return make([]api.BackupTokenRecord, 0), errors.New(msg)
	}

	var rows *sql.Rows
	var err error
	rows, err = p.db.Query(findAllCNSIToken, cnsiGUID)
	if err != nil {
		const msg = "unable to find all CNSI tokens"
		if err == sql.ErrNoRows {
			slog.Debug(msg, "endpoint", cnsiGUID, "error", err)
		} else {
			slog.Error(msg, "endpoint", cnsiGUID, "error", err)
		}
		return make([]api.BackupTokenRecord, 0), fmt.Errorf("%s: %w", msg, err)
	}

	defer func() { _ = rows.Close() }()

	btrs := make([]api.BackupTokenRecord, 0)
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
			enabled                bool
		)
		err = rows.Scan(&userGUID, &tokenGUID, &ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry, &disconnected, &authType, &metadata, &tokenUserGUID, &linkedTokenGUID, &enabled)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan CNSI records: %v", err)
		}

		slog.Debug("Decrypting Auth Token")
		plaintextAuthToken, err := crypto.DecryptToken(encryptionKey, ciphertextAuthToken)
		if err != nil {
			return make([]api.BackupTokenRecord, 0), err
		}

		slog.Debug("Decrypting Refresh Token")
		plaintextRefreshToken, err := crypto.DecryptToken(encryptionKey, ciphertextRefreshToken)
		if err != nil {
			return make([]api.BackupTokenRecord, 0), err
		}

		// Build a new TokenRecord based on the decrypted tokens
		tr := new(api.TokenRecord)
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

		btr := new(api.BackupTokenRecord)
		btr.TokenRecord = *tr
		btr.EndpointGUID = cnsiGUID
		btr.TokenType = "cnsi"
		btr.UserGUID = userGUID

		btrs = append(btrs, *btr)

	}

	return btrs, nil
}

func (p *PgsqlTokenRepository) findCNSIToken(cnsiGUID string, userGUID string, encryptionKey []byte, includeDisconnected bool) (api.TokenRecord, error) {
	slog.Debug("findCNSIToken", "endpoint", cnsiGUID, "user", userGUID)
	if cnsiGUID == "" {
		msg := "Unable to find CNSI Token without a valid CNSI GUID."
		slog.Debug(msg)
		return api.TokenRecord{}, errors.New(msg)
	}

	if userGUID == "" {
		msg := "Unable to find CNSI Token without a valid User GUID."
		slog.Debug(msg)
		return api.TokenRecord{}, errors.New(msg)
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
		enabled                bool
	)

	var err error
	if includeDisconnected {
		err = p.db.QueryRow(findCNSIToken, cnsiGUID, userGUID, SystemSharedUserGuid).Scan(&tokenGUID, &ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry, &disconnected, &authType, &metadata, &tokenUserGUID, &linkedTokenGUID, &enabled)
	} else {
		err = p.db.QueryRow(findCNSITokenConnected, cnsiGUID, userGUID, SystemSharedUserGuid).Scan(&tokenGUID, &ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry, &disconnected, &authType, &metadata, &tokenUserGUID, &linkedTokenGUID, &enabled)
	}

	if err != nil {
		const msg = "unable to find the CNSI token"
		if err == sql.ErrNoRows {
			slog.Debug(msg, "endpoint", cnsiGUID, "user", userGUID, "error", err)
		} else {
			slog.Error(msg, "endpoint", cnsiGUID, "user", userGUID, "error", err)
		}
		return api.TokenRecord{}, fmt.Errorf("%s: %w", msg, err)
	}

	// If this token is linked - fetch that token and use it instead
	// Currently we don't recurse - we only support one level of linked token - you can't link to another linked token
	if linkedTokenGUID.Valid {
		if includeDisconnected {
			err = p.db.QueryRow(getToken, userGUID, linkedTokenGUID.String).Scan(&tokenGUID, &ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry, &disconnected, &authType, &metadata, &tokenUserGUID, &linkedTokenGUID, &enabled)
		} else {
			err = p.db.QueryRow(getTokenConnected, userGUID, linkedTokenGUID.String).Scan(&tokenGUID, &ciphertextAuthToken, &ciphertextRefreshToken, &tokenExpiry, &disconnected, &authType, &metadata, &tokenUserGUID, &linkedTokenGUID, &enabled)
		}

		if err != nil {
			const msg = "unable to find the linked CNSI token"
			if err == sql.ErrNoRows {
				slog.Debug(msg, "endpoint", cnsiGUID, "user", userGUID, "linkedToken", linkedTokenGUID.String, "error", err)
			} else {
				slog.Error(msg, "endpoint", cnsiGUID, "user", userGUID, "linkedToken", linkedTokenGUID.String, "error", err)
			}
			return api.TokenRecord{}, fmt.Errorf("%s: %w", msg, err)
		}
	}

	slog.Debug("Decrypting Auth Token")
	plaintextAuthToken, err := crypto.DecryptToken(encryptionKey, ciphertextAuthToken)
	if err != nil {
		return api.TokenRecord{}, err
	}

	slog.Debug("Decrypting Refresh Token")
	plaintextRefreshToken, err := crypto.DecryptToken(encryptionKey, ciphertextRefreshToken)
	if err != nil {
		return api.TokenRecord{}, err
	}

	// Build a new TokenRecord based on the decrypted tokens
	tr := new(api.TokenRecord)
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

	tr.Enabled = enabled

	return *tr, nil
}

// DeleteCNSIToken - remove a CNSI token (disconnect from a given CNSI)
func (p *PgsqlTokenRepository) DeleteCNSIToken(cnsiGUID string, userGUID string) error {
	slog.Debug("DeleteCNSIToken", "endpoint", cnsiGUID, "user", userGUID)
	if cnsiGUID == "" {
		msg := "Unable to delete CNSI Token without a valid CNSI GUID."
		slog.Debug(msg)
		return errors.New(msg)
	}

	if userGUID == "" {
		msg := "Unable to delete CNSI Token without a valid User GUID."
		slog.Debug(msg)
		return errors.New(msg)
	}

	_, err := p.db.Exec(deleteCNSIToken, cnsiGUID, userGUID)
	if err != nil {
		const msg = "unable to delete the CNSI token"
		slog.Debug(msg, "endpoint", cnsiGUID, "user", userGUID, "error", err)
		return fmt.Errorf("%s: %w", msg, err)
	}

	return nil
}

func (p *PgsqlTokenRepository) DeleteCNSITokens(cnsiGUID string) error {
	slog.Debug("DeleteCNSITokens", "endpoint", cnsiGUID)
	if cnsiGUID == "" {
		msg := "Unable to delete CNSI Token without a valid CNSI GUID."
		slog.Debug(msg)
		return errors.New(msg)
	}

	_, err := p.db.Exec(deleteCNSITokens, cnsiGUID)
	if err != nil {
		const msg = "unable to delete the CNSI tokens"
		slog.Debug(msg, "endpoint", cnsiGUID, "error", err)
		return fmt.Errorf("%s: %w", msg, err)
	}

	return nil
}

// UpdateTokenAuth - Update a token's auth data
func (p *PgsqlTokenRepository) UpdateTokenAuth(userGUID string, tr api.TokenRecord, encryptionKey []byte) error {
	slog.Debug("UpdateTokenAuth", "user", userGUID)

	if userGUID == "" {
		msg := "Unable to save Token without a valid User GUID."
		slog.Debug(msg)
		return errors.New(msg)
	}

	if tr.AuthToken == "" {
		msg := "Unable to save Token without a valid Auth Token."
		slog.Debug(msg)
		return errors.New(msg)
	}

	// Deliberately no "RefreshToken must be non-empty" guard here: the
	// rejected-token disposal write (RefreshOAuthToken, oauth_requests.go)
	// calls this with an intentionally empty RefreshToken to record that
	// UAA rejected it. Both AuthToken and RefreshToken are always encrypted
	// below (even when empty) so the write never leaves a nil ciphertext —
	// crypto.Decrypt errors ("ciphertext too short") on a nil/short byte
	// slice, so a nil ciphertext would break every future FindCNSIToken
	// read of this row, not just its renewability.

	var ciphertextAuthToken, ciphertextRefreshToken []byte
	var err error

	var tokenGUID string

	// Linked token? if so, update the linked token
	if tr.LinkedGUID == "" {
		tokenGUID = tr.TokenGUID
	} else {
		tokenGUID = tr.LinkedGUID
	}

	slog.Info("Updating token", "token", tokenGUID, "user", userGUID)

	slog.Debug("Encrypting Auth Token")
	ciphertextAuthToken, err = crypto.EncryptToken(encryptionKey, tr.AuthToken)
	if err != nil {
		return err
	}
	slog.Debug("Encrypting Refresh Token")
	ciphertextRefreshToken, err = crypto.EncryptToken(encryptionKey, tr.RefreshToken)
	if err != nil {
		return err
	}

	result, err := p.db.Exec(updateToken, ciphertextAuthToken, ciphertextRefreshToken, tr.TokenExpiry, tokenGUID, userGUID)
	if err != nil {
		const msg = "unable to UPDATE the token"
		slog.Debug(msg, "token", tokenGUID, "user", userGUID, "error", err)
		return fmt.Errorf("%s: %w", msg, err)
	}

	rowsUpdates, err := result.RowsAffected()
	if err != nil {
		return errors.New("Unable to UPDATE token: could not determine number of rows that were updated")
	}

	if rowsUpdates < 1 {
		return errors.New("Unable to UPDATE token: no rows were updated")
	}

	if rowsUpdates > 1 {
		slog.Warn("UPDATE token: more than 1 row was updated (expected only 1)",
			"token", tokenGUID, "user", userGUID, "rows", rowsUpdates)
	}

	slog.Debug("Token UPDATE complete", "token", tokenGUID, "user", userGUID)

	return nil
}

package tokens

import (
	"database/sql"
	"fmt"
	"log"
)

const (
	findUAAToken = `SELECT auth_token, refresh_token, token_expiry
                  FROM tokens
                  WHERE token_type = 'uaa' AND user_guid = $1`

	countUAATokens = `SELECT COUNT(*)
                    FROM tokens
                    WHERE token_type = 'uaa' AND user_guid = $1`

	insertUAAToken = `INSERT INTO tokens (user_guid, token_type, auth_token, refresh_token, token_expiry)
	                  VALUES ($1, $2, $3, $4, $5)`

	updateUAAToken = `UPDATE tokens
	                  SET auth_token = $3, refresh_token = $4, token_expiry = $5
	                  WHERE user_guid = $1 AND token_type = $2`

	findCNSIToken = `SELECT auth_token, refresh_token, token_expiry
                   FROM tokens
                   WHERE cnsi_guid = $1 AND user_guid = $2 AND token_type = 'cnsi'`

	listCNSITokensForUser = `SELECT auth_token, refresh_token, token_expiry
                           FROM tokens
                           WHERE token_type = 'cnsi' AND user_guid = $1`

	countCNSITokens = `SELECT COUNT(*)
                     FROM tokens
                     WHERE cnsi_guid=$1 AND user_guid = $2 AND token_type = 'cnsi'`

	insertCNSIToken = `INSERT INTO tokens (cnsi_guid, user_guid, token_type, auth_token, refresh_token, token_expiry)
	                   VALUES ($1, $2, $3, $4, $5, $6)`

	updateCNSIToken = `UPDATE tokens
	                   SET auth_token = $4, refresh_token = $5, token_expiry = $6
	                   WHERE cnsi_guid = $1 AND user_guid = $2 AND token_type = $3`

	deleteCNSIToken = `DELETE FROM tokens
                     WHERE token_type = 'cnsi' AND cnsi_guid = $1 AND user_guid = $2`
)

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

// SaveUAAToken - Save the UAA token to the datastore
func (p *PgsqlTokenRepository) SaveUAAToken(userGUID string, tr TokenRecord, encryptionKey []byte) error {
	log.Println("SaveUAAToken")
	if userGUID == "" {
		msg := "Unable to save UAA Token without a valid User GUID."
		log.Println(msg)
		return fmt.Errorf(msg)
	}

	if tr.AuthToken == "" {
		msg := "Unable to save UAA Token without a valid Auth Token."
		log.Println(msg)
		return fmt.Errorf(msg)
	}

	if tr.RefreshToken == "" {
		msg := "Unable to save UAA Token without a valid Refresh Token."
		log.Println(msg)
		return fmt.Errorf(msg)
	}

	log.Println("Encrypting Auth Token")
	ciphertextAuthToken, err := encryptToken(encryptionKey, tr.AuthToken)
	if err != nil {
		return err
	}

	log.Println("Encrypting Refresh Token")
	ciphertextRefreshToken, err := encryptToken(encryptionKey, tr.RefreshToken)
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
		if _, updateErr := p.db.Exec(updateUAAToken, userGUID, "uaa",
			ciphertextAuthToken, ciphertextRefreshToken,
			tr.TokenExpiry); updateErr != nil {
			msg := "Unable to UPDATE UAA token: %v"
			log.Printf(msg, updateErr)
			return fmt.Errorf(msg, updateErr)
		}

		log.Println("UAA token UPDATE complete.")
	}

	return nil
}

// FindUAAToken - return the UAA token from the datastore
func (p *PgsqlTokenRepository) FindUAAToken(userGUID string, encryptionKey []byte) (TokenRecord, error) {
	log.Println("FindUAAToken")
	if userGUID == "" {
		msg := "Unable to find UAA Token without a valid User GUID."
		log.Printf(msg)
		return TokenRecord{}, fmt.Errorf(msg)
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
		return TokenRecord{}, fmt.Errorf(msg, err)
	}

	log.Println("Decrypting Auth Token")
	plaintextAuthToken, err := decryptToken(encryptionKey, ciphertextAuthToken)
	if err != nil {
		return TokenRecord{}, err
	}

	log.Println("Decrypting Refresh Token")
	plaintextRefreshToken, err := decryptToken(encryptionKey, ciphertextRefreshToken)
	if err != nil {
		return TokenRecord{}, err
	}

	// Build a new TokenRecord based on the decrypted tokens
	tr := new(TokenRecord)
	tr.AuthToken = plaintextAuthToken
	tr.RefreshToken = plaintextRefreshToken
	tr.TokenExpiry = tokenExpiry

	return *tr, nil
}

// SaveCNSIToken - Save the CNSI (UAA) token to the datastore
func (p *PgsqlTokenRepository) SaveCNSIToken(cnsiGUID string, userGUID string, tr TokenRecord, encryptionKey []byte) error {
	log.Println("SaveCNSIToken")
	if cnsiGUID == "" {
		msg := "Unable to save CNSI Token without a valid CNSI GUID."
		log.Println(msg)
		return fmt.Errorf(msg)
	}

	if userGUID == "" {
		msg := "Unable to save CNSI Token without a valid User GUID."
		log.Println(msg)
		return fmt.Errorf(msg)
	}

	if tr.AuthToken == "" {
		msg := "Unable to save CNSI Token without a valid Auth Token."
		log.Println(msg)
		return fmt.Errorf(msg)
	}

	if tr.RefreshToken == "" {
		msg := "Unable to save CNSI Token without a valid Refresh Token."
		log.Println(msg)
		return fmt.Errorf(msg)
	}

	log.Println("Encrypting Auth Token")
	ciphertextAuthToken, err := encryptToken(encryptionKey, tr.AuthToken)
	if err != nil {
		return err
	}

	log.Println("Encrypting Refresh Token")
	ciphertextRefreshToken, err := encryptToken(encryptionKey, tr.RefreshToken)
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
			log.Printf(msg, err)
			return fmt.Errorf(msg, err)
		}

		log.Println("CNSI token INSERT complete.")

	default:

		log.Println("Existing CNSI token found - attempting update.")
		if _, err := p.db.Exec(updateCNSIToken, cnsiGUID, userGUID, "cnsi", ciphertextAuthToken,
			ciphertextRefreshToken, tr.TokenExpiry); err != nil {
			msg := "Unable to UPDATE CNSI token: %v"
			log.Printf(msg, err)
			return fmt.Errorf(msg, err)
		}

		log.Println("CNSI token UPDATE complete")
	}

	return nil
}

// FindCNSIToken - retrieve a CNSI (UAA) token from the datastore
func (p *PgsqlTokenRepository) FindCNSIToken(cnsiGUID string, userGUID string, encryptionKey []byte) (TokenRecord, error) {
	log.Println("FindCNSIToken")
	if cnsiGUID == "" {
		msg := "Unable to find CNSI Token without a valid CNSI GUID."
		log.Println(msg)
		return TokenRecord{}, fmt.Errorf(msg)
	}

	if userGUID == "" {
		msg := "Unable to find CNSI Token without a valid User GUID."
		log.Println(msg)
		return TokenRecord{}, fmt.Errorf(msg)
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
		return TokenRecord{}, fmt.Errorf(msg, err)
	}

	log.Println("Decrypting Auth Token")
	plaintextAuthToken, err := decryptToken(encryptionKey, ciphertextAuthToken)
	if err != nil {
		return TokenRecord{}, err
	}

	log.Println("Decrypting Refresh Token")
	plaintextRefreshToken, err := decryptToken(encryptionKey, ciphertextRefreshToken)
	if err != nil {
		return TokenRecord{}, err
	}

	// Build a new TokenRecord based on the decrypted tokens
	tr := new(TokenRecord)
	tr.AuthToken = plaintextAuthToken
	tr.RefreshToken = plaintextRefreshToken
	tr.TokenExpiry = tokenExpiry

	return *tr, nil
}

// ListCNSITokensForUser - <TBD>
func (p *PgsqlTokenRepository) ListCNSITokensForUser(userGUID string, encryptionKey []byte) ([]*TokenRecord, error) {
	log.Println("ListCNSITokensForUser")

	if userGUID == "" {
		msg := "Unable to list CNSI Tokens without a valid User GUID."
		log.Println(msg)
		return nil, fmt.Errorf(msg)
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

	var tokenRecordList []*TokenRecord
	tokenRecordList = make([]*TokenRecord, 0)

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
		plaintextAuthToken, err := decryptToken(encryptionKey, ciphertextAuthToken)
		if err != nil {
			return nil, err
		}

		log.Println("Decrypting Refresh Token")
		plaintextRefreshToken, err := decryptToken(encryptionKey, ciphertextRefreshToken)
		if err != nil {
			return nil, err
		}

		tr := new(TokenRecord)
		tr.AuthToken = plaintextAuthToken
		tr.RefreshToken = plaintextRefreshToken
		tr.TokenExpiry = tokenExpiry

		tokenRecordList = append(tokenRecordList, tr)
	}

	// TODO (wchrisjohnson) - https://jira.hpcloud.net/browse/TEAMFOUR-817
	// rows.Close()

	return tokenRecordList, nil
}

// DeleteCNSIToken - remove a CNSI token (disconnect from a given CNSI)
func (p *PgsqlTokenRepository) DeleteCNSIToken(cnsiGUID string, userGUID string) error {
	log.Println("DeleteCNSIToken")
	if cnsiGUID == "" {
		msg := "Unable to delete CNSI Token without a valid CNSI GUID."
		log.Println(msg)
		return fmt.Errorf(msg)
	}

	if userGUID == "" {
		msg := "Unable to delete CNSI Token without a valid User GUID."
		log.Println(msg)
		return fmt.Errorf(msg)
	}

	_, err := p.db.Exec(deleteCNSIToken, cnsiGUID, userGUID)
	if err != nil {
		msg := "Unable to Delete CNSI token: %v"
		log.Printf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

// Note:
// When it's time to store the encrypted token in PostgreSQL, it's gets a bit
// hairy. The encrypted token is binary data, not really text data, which
// typically has a character set, unlike binary data. Generally speaking, it
// comes down to one of two choices: store it in a bytea column, and deal with
// some funkiness; or store it in a text column and make sure to base64 encode
// it going in and decode it coming out.
// https://wiki.postgresql.org/wiki/BinaryFilesInDB
// http://engineering.pivotal.io/post/ByteA_versus_TEXT_in_PostgreSQL/
// I chose option 1.

// encryptToken - TBD
func encryptToken(key []byte, t string) ([]byte, error) {
	log.Println("encryptToken")
	var plaintextToken = []byte(t)
	ciphertextToken, err := Encrypt(key, plaintextToken)
	if err != nil {
		msg := "Unable to encrypt token: %v"
		log.Printf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	return ciphertextToken, nil
}

// Note:
// When it's time to store the encrypted token in PostgreSQL, it's gets a bit
// hairy. The encrypted token is binary data, not really text data, which
// typically has a character set, unlike binary data. Generally speaking, it
// comes down to one of two choices: store it in a bytea column, and deal with
// some funkiness; or store it in a text column and make sure to base64 encode
// it going in and decode it coming out.
// https://wiki.postgresql.org/wiki/BinaryFilesInDB
// http://engineering.pivotal.io/post/ByteA_versus_TEXT_in_PostgreSQL/
// I chose option 1.

// decryptToken - TBD
func decryptToken(key, t []byte) (string, error) {
	log.Println("decryptToken")
	plaintextToken, err := Decrypt(key, t)
	if err != nil {
		msg := "Unable to decrypt token: %v"
		log.Printf(msg, err)
		return "", fmt.Errorf(msg, err)
	}

	return string(plaintextToken), nil
}

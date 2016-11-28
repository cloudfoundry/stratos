package vcstokens

import (
	"database/sql"
	"errors"
	"fmt"
	"log"

	"github.com/hpcloud/portal-proxy/repository/crypto"
	"github.com/hpcloud/portal-proxy/repository/vcs"
)

const (
	findVcsToken = `SELECT guid, user_guid, vcs_guid, name, token
	                FROM vcs_tokens
	                WHERE user_guid = $1 AND guid = $2`

	findMatchingVcsToken = `SELECT guid, user_guid, vcs_guid, name, token
	                        FROM vcs_tokens
	                        WHERE user_guid = $1 AND vcs_guid = $2 AND name = $3`

	saveVcsToken = `INSERT INTO vcs_tokens (guid, user_guid, vcs_guid, name, token)
	                VALUES ($1, $2, $3, $4, $5)`

	renameVcsToken = `UPDATE vcs_tokens
	                  SET name = $3
	                  WHERE user_guid = $1 AND guid = $2`

	deleteVcsToken = `DELETE FROM vcs_tokens WHERE user_guid = $1 AND guid = $2`

	listVcsTokensByUser = `SELECT t.guid, t.user_guid, t.vcs_guid, t.name, t.token, v.guid, v.label, v.type, v.browse_url, v.api_url, v.skip_ssl_validation
	                       FROM vcs v, vcs_tokens t
	                       WHERE t.user_guid=$1 AND v.guid = t.vcs_guid`
)

// PgsqlVCSTokenRepository is a PostgreSQL-backed token repository
type PgsqlVcsTokenRepository struct {
	db *sql.DB
}

type Scannable interface {
	Scan(dest ...interface{}) error
}

// TokenNotFound - Error returned when a matching token was not found in the DB
type TokenNotFound struct {
	matchDetails string
}

func (e *TokenNotFound) Error() string {
	return "Unable to Find VCS token matching [" + e.matchDetails + "]"
}

// scanRow - scan a DB row into our VcsTokenRecord struct
func scanRow(scannable Scannable, encryptionKey []byte) (*VcsTokenRecord, error) {
	tr := &VcsTokenRecord{}
	var (
		plainTextAccessToken string
		cipherTextAccessToken []byte
	)

	// Get the encrypted token from the db
	err := scannable.Scan(&tr.Guid, &tr.UserGuid, &tr.VcsGuid, &tr.Name, &cipherTextAccessToken)
	if err != nil {
		msg := "Unable to Find VCS token: %v"
		log.Printf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	log.Println("Decrypting VCS Token")
	plainTextAccessToken, err = crypto.DecryptToken(encryptionKey, cipherTextAccessToken)
	if err != nil {
		return nil, err
	}
	tr.Token = plainTextAccessToken

	return tr, nil
}

// NewPgsqlVCSTokenRepository - get a reference to the token data source
func NewPgsqlVcsTokenRepository(dcp *sql.DB) (Repository, error) {
	return &PgsqlVcsTokenRepository{db: dcp}, nil
}

// SaveVCSToken - Save the VCS token to the DB
func (p *PgsqlVcsTokenRepository) SaveVcsToken(tr *VcsTokenRecord, encryptionKey []byte) error {
	log.Println("SaveVCSToken")

	if tr.UserGuid == "" {
		// Should not happen as we are protected by the session middleware
		return errors.New("Unable to save VCS Token without a valid user id")
	}

	if tr.Guid == "" {
		return errors.New("Unable to save VCS Token without a valid guid")
	}

	if tr.VcsGuid == "" {
		return errors.New("Unable to save VCS Token without a valid VCS id")
	}

	if tr.Name == "" {
		return errors.New("Unable to save VCS Token without a valid Name.")
	}

	if tr.Token == "" {
		return errors.New("Unable to save VCS Token without a valid VCS token.")
	}

	if _, err := p.FindMatchingVcsToken(tr, encryptionKey); err == nil {
		return errors.New("Token with the same Name already exists for this user in this VCS")
	}

	cipherTextAccessToken, err := crypto.EncryptToken(encryptionKey, tr.Token)
	if err != nil {
		return err
	}

	log.Println("Performing INSERT of encrypted VCS token")
	if _, err := p.db.Exec(saveVcsToken, tr.Guid, tr.UserGuid, tr.VcsGuid, tr.Name, cipherTextAccessToken); err != nil {
		return fmt.Errorf("Unable to INSERT VCS token: %v", err)
	}

	return nil
}

// FindVCSToken - look up a VCS token by guid from the DB
func (p *PgsqlVcsTokenRepository) FindVcsToken(userGuid string, tokenGuid string, encryptionKey []byte) (*VcsTokenRecord, error) {
	log.Println("FindVCSToken")

	if userGuid == "" {
		return nil, errors.New("Unable to find VCS Token without a valid user id")
	}

	if tokenGuid == "" {
		return nil, errors.New("Unable to find VCS Token without a valid token id")
	}

	// Get the encrypted token from the db
	tr, err := scanRow(p.db.QueryRow(findVcsToken, userGuid, tokenGuid), encryptionKey)
	if err != nil {
		return nil, &TokenNotFound{"id: " + tokenGuid + " for user: " + userGuid}
	}
	return tr, nil
}

// FindMatchingVcsToken - return the VCS token with equivalent properties from the DB
func (p *PgsqlVcsTokenRepository) FindMatchingVcsToken(match *VcsTokenRecord, encryptionKey []byte) (*VcsTokenRecord, error) {
	log.Println("FindVCSToken")

	if match.UserGuid == "" {
		return nil, errors.New("Unable to match VCS Token without a valid user id")
	}

	if match.VcsGuid == "" {
		return nil, errors.New("Unable to match VCS Token without a valid VCS id")
	}

	if match.Name == "" {
		return nil, errors.New("Unable to match VCS Token without a valid Name")
	}

	// Get the encrypted token from the db
	tr, err := scanRow(p.db.QueryRow(findMatchingVcsToken, match.UserGuid, match.VcsGuid, match.Name), encryptionKey)
	if err != nil {
		return nil, &TokenNotFound{"Name: " + match.Name + ", VCS: " + match.VcsGuid + " for user: " + match.UserGuid}
	}
	return tr, nil
}

// RenameVcsToken - rename the VCS token in the DB
func (p *PgsqlVcsTokenRepository) RenameVcsToken(userGuid string, tokenGuid string, tokenName string) error {
	log.Println("RenameVcsToken")

	// Get the VCS record from the db
	res, err := p.db.Exec(renameVcsToken, userGuid, tokenGuid, tokenName)
	if err != nil {
		return fmt.Errorf("Unable to rename VCS token: %v", err)
	}
	if rows, _ := res.RowsAffected(); rows < 1 {
		return &TokenNotFound{"id: " + tokenGuid + " for user: " + userGuid}
	}
	log.Println("Rename was succesful")
	return nil
}

// FindVCSToken - return the VCS token from the DB
func (p *PgsqlVcsTokenRepository) DeleteVcsToken(userGuid string, tokenGuid string) error {
	log.Println("DeleteVcsToken")

	// Get the VCS record from the db
	res, err := p.db.Exec(deleteVcsToken, userGuid, tokenGuid)
	if err != nil {
		return fmt.Errorf("Unable to delete VCS token: %v", err)
	}
	if rows, _ := res.RowsAffected(); rows < 1 {
		return &TokenNotFound{"id: " + tokenGuid + " for user: " + userGuid}
	}
	log.Println("Delete was succesful")
	return nil
}

func (p *PgsqlVcsTokenRepository) ListVcsTokenByUser(userGuid string, encryptionKey []byte) ([]*UserVcsToken, error) {
	log.Println("ListByUser")
	rows, err := p.db.Query(listVcsTokensByUser, userGuid)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve VCS records: %v", err)
	}
	defer rows.Close()

	vcsTokensList := make([]*UserVcsToken, 0)
	for rows.Next() {

		// Reconstruct both the VCS and Token records in one query
		tr := &VcsTokenRecord{}
		vr := &vcs.VcsRecord{}
		var cipherTextAccessToken []byte

		err := rows.Scan(&tr.Guid, &tr.UserGuid, &tr.VcsGuid, &tr.Name, &cipherTextAccessToken,
			&vr.Guid, &vr.Label, &vr.VcsType, &vr.BrowseUrl, &vr.ApiUrl, &vr.SkipSslValidation)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan VCS records: %v", err)
		}
		log.Println("Decrypting VCS Token")
		tr.Token, err = crypto.DecryptToken(encryptionKey, cipherTextAccessToken)
		if err != nil {
			return nil, err
		}
		userVcsToken := &UserVcsToken{
			VcsToken: tr,
			Vcs: vr,
		}
		vcsTokensList = append(vcsTokensList, userVcsToken)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to list VCS records: %v", err)
	}

	return vcsTokensList, nil
}

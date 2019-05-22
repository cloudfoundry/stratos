package local_users

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/crypto"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"
)

var findPasswordHash = `SELECT password_hash
									FROM local_users
									WHERE user_guid = $1`
var insertLocalUser = `INSERT INTO local_users (user_guid, user_guid, token_type, auth_token, refresh_token, token_expiry)
VALUES ($1, $2, $3, $4, $5, $6)`

// PgsqlTokenRepository is a PostgreSQL-backed token repository
type PgsqlLocalUsersRepository struct {
	db *sql.DB
}

// NewPgsqlLocalUsersRepository - get a reference to the local users data source
func NewPgsqlLocalUsersRepository(dcp *sql.DB) (Repository, error) {
	log.Debug("NewPgsqlLocalUsersRepository")
	return &PgsqlLocalUsersRepository{db: dcp}, nil
}

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	// Modify the database statements if needed, for the given database type
	findPasswordHash = datastore.ModifySQLStatement(findPasswordHash, databaseProvider)
}

// FindPasswordHash - return the password hash from the datastore
func (p *PgsqlTokenRepository) FindPasswordHash(userGUID string) (hash []byte, error) {
	log.Debug("FindPasswordHash")
	if userGUID == "" {
		msg := "Unable to find password hash without a valid User GUID."
		log.Debug(msg)
		return nil, errors.New(msg)
	}

	// temp vars to retrieve db data
	var (
		passwordHash              []byte
	)

	// Get the password hash from the db
	err := p.db.QueryRow(findPasswordHash, userGUID).Scan(&passwordHash)
	if err != nil {
		msg := "Unable to Find password hash: %v"
		log.Debugf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	return passwordHash, nil
}

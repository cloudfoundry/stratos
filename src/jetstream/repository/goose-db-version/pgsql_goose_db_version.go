package goosedbversion

import (
	"database/sql"
	"errors"
	"fmt"

	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
)

const (
	getCurrentVersion = `SELECT version_id FROM goose_db_version WHERE is_applied = '1' ORDER BY id DESC LIMIT 1`

	listVersions = `SELECT id, version_id, is_applied, tstamp FROM goose_db_version WHERE is_applied = '1' ORDER BY id DESC`
)

// PostgresGooseDBVersionRepository is a PostgreSQL-backed Goose DB Version repository
type PostgresGooseDBVersionRepository struct {
	db *sql.DB
}

// NewPostgresGooseDBVersionRepository will create a new instance of the PostgresInstanceRepository
func NewPostgresGooseDBVersionRepository(dcp *sql.DB) (Repository, error) {
	log.Debug("NewPostgresGooseDBVersionRepository")
	return &PostgresGooseDBVersionRepository{db: dcp}, nil
}

// GetCurrentVersion - Returns the latest GooseDBVersionRecord
func (p *PostgresGooseDBVersionRepository) GetCurrentVersion() (api.GooseDBVersionRecord, error) {
	log.Debug("GetCurrentVersion")

	dbVersion := new(api.GooseDBVersionRecord)

	err := p.db.QueryRow(getCurrentVersion).Scan(&dbVersion.VersionID)

	switch {
	case err == sql.ErrNoRows:
		return api.GooseDBVersionRecord{}, errors.New("No database versions found")
	case err != nil:
		return api.GooseDBVersionRecord{}, fmt.Errorf("Error trying to get current database version: %v", err)
	default:
		// do nothing
	}

	return *dbVersion, nil
}

// List - Returns a list of all versions
func (p *PostgresGooseDBVersionRepository) List() ([]*api.GooseDBVersionRecord, error) {
	log.Debug("List")
	rows, err := p.db.Query(listVersions)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Goose Version records: %v", err)
	}
	defer rows.Close()

	var versionList []*api.GooseDBVersionRecord
	versionList = make([]*api.GooseDBVersionRecord, 0)

	for rows.Next() {
		version := new(api.GooseDBVersionRecord)
		err := rows.Scan(&version.ID, &version.VersionID, &version.IsApplied, &version.Timestamp)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan Goose Version records: %v", err)
		}
		versionList = append(versionList, version)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to List Goose Version records: %v", err)
	}

	return versionList, nil
}

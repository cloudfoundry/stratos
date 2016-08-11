package goosedbversion

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
)

const (
	getCurrentVersion = `SELECT version_id FROM goose_db_version WHERE is_applied = 't' ORDER BY id DESC LIMIT 1`
)

// PostgresGooseDBVersionRepository is a PostgreSQL-backed Goose DB Version repository
type PostgresGooseDBVersionRepository struct {
	db *sql.DB
}

// NewPostgresCNSIRepository will create a new instance of the PostgresInstanceRepository
func NewPostgresGooseDBVersionRepository(dcp *sql.DB) (Repository, error) {
	log.Println("NewPostgresGooseDBVersionRepository")
	return &PostgresGooseDBVersionRepository{db: dcp}, nil
}

// GetCurrentVersion - Returns the latest GooseDBVersionRecord
func (p *PostgresGooseDBVersionRepository) GetCurrentVersion() (GooseDBVersionRecord, error) {
	log.Println("GetCurrentVersion")

	dbVersion := new(GooseDBVersionRecord)

	err := p.db.QueryRow(getCurrentVersion).Scan(&dbVersion.VersionID)

	switch {
	case err == sql.ErrNoRows:
		return GooseDBVersionRecord{}, errors.New("No database versions found")
	case err != nil:
		return GooseDBVersionRecord{}, fmt.Errorf("Error trying to get current database version: %v", err)
	default:
		// do nothing
	}

	return *dbVersion, nil
}

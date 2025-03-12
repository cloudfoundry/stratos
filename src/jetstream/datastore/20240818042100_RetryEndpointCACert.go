package datastore

import (
	"database/sql"
	"log"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20240818042100, nil)
}

func CheckIfMigrationExists(db *sql.Tx, migration string, args ...interface{}) (bool, error) {
	query := "SELECT 1 FROM goose_db_version WHERE version_id = $1 LIMIT 1"
	var exists bool
	err := db.QueryRow(query, migration).Scan(&exists)
	if err != nil && err != sql.ErrNoRows {
		return false, err
	}
	return err != sql.ErrNoRows, nil
}

func Up20240818042100(txn *sql.Tx) error {
	// When upgrading from 4.4.x, the migration 20201201163100 was not applied because 20210201110000 was already present.
	exists, err := CheckIfMigrationExists(txn, "20201201163100")
	if err != nil {
		return err
	}

	if !exists {
		log.Printf("Migration 20201201163100 has not been applied. Adding missing entries.")
		createCertColumn := "ALTER TABLE cnsis ADD ca_cert TEXT"
		_, err := txn.Exec(createCertColumn)
		if err != nil {
			return err
		}

		createEnableColumn := "ALTER TABLE tokens ADD enabled BOOLEAN NOT NULL DEFAULT TRUE"
		_, err = txn.Exec(createEnableColumn)
		if err != nil {
			return err
		}
	} else {
		// Migration has already been applied
		log.Printf("Migration 20201201163100 has been applied.")
		return nil
	}
	return nil
}

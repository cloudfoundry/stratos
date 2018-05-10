package datastore

import (
	"database/sql"
	"fmt"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func (s *StratosMigrations) Up_20171108102900(txn *sql.Tx, conf *goose.DBConf) {

	createTokens := "ALTER TABLE tokens ADD auth_type VARCHAR(255) DEFAULT \"OAuth2\""
	_, err := txn.Exec(createTokens)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}

	createTokens = "ALTER TABLE tokens ADD meta_data TEXT"
	_, err = txn.Exec(createTokens)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
}

func Down_20171108102900(txn *sql.Tx) {
	dropTables := "ALTER TABLE tokens DROP COLUMN auth_type"
	_, err := txn.Exec(dropTables)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
	dropTables = "ALTER TABLE tokens DROP COLUMN meta_data"
	_, err = txn.Exec(dropTables)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
}

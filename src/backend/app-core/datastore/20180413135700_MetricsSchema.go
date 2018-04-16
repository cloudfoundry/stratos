package datastore

import (
	"database/sql"
	"fmt"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func (s *StratosMigrations) Up_20180413135700(txn *sql.Tx, conf *goose.DBConf) {

	alterColumn := "ALTER TABLE cnsis modify cnsi_type VARCHAR(16) NOT NULL"
	_, err := txn.Exec(alterColumn)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
}

func Down_20180413135700(txn *sql.Tx) {
	alterColumn := "ALTER TABLE cnsis modify cnsi_type VARCHAR(3) NOT NULL"
	_, err := txn.Exec(alterColumn)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
}

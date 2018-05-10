package datastore

import (
	"database/sql"
	"fmt"

	"bitbucket.org/liamstask/goose/lib/goose"
)

// Up is executed when this migration is applied
func (s *StratosMigrations) Up_20170829154900(txn *sql.Tx, conf *goose.DBConf) {

	alterTokens := "ALTER TABLE tokens ADD COLUMN disconnected boolean NOT NULL DEFAULT FALSE;"

	_, err := txn.Exec(alterTokens)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
}

// Down is executed when this migration is rolled back
func Down_20170829154900(txn *sql.Tx) {
	dropColumn := "ALTER TABLE \"table_name\" DROP COLUMN \"column_name\";"
	_, err := txn.Exec(dropColumn)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}

}

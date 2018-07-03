package datastore

import (
	"database/sql"
	"fmt"
	"strings"

	"bitbucket.org/liamstask/goose/lib/goose"
)

// Up is executed when this migration is applied
func (s *StratosMigrations) Up_20180703142800(txn *sql.Tx, conf *goose.DBConf) {
	binaryDataType := "BYTEA"
	if strings.Contains(conf.Driver.Name, "mysql") {
		binaryDataType = "BLOB"
	}

	alterCnsis := "ALTER TABLE cnsis ADD COLUMN client_id VARCHAR(255) NOT NULL DEFAULT 'cf';"

	_, err := txn.Exec(alterCnsis)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}

	alterCnsis = "ALTER TABLE cnsis ADD COLUMN client_secret " + binaryDataType + ";"

	_, err = txn.Exec(alterCnsis)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
}

// Down is executed when this migration is rolled back
func Down_20180703142800(txn *sql.Tx) {
	dropColumn := "ALTER TABLE cnsis DROP COLUMN client_id;"
	_, err := txn.Exec(dropColumn)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}

	dropColumn = "ALTER TABLE cnsis DROP COLUMN client_secret;"
	_, err = txn.Exec(dropColumn)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}

}
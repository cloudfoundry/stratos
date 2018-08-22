package main

import (
	"database/sql"
	"fmt"
	"os"
)

// Up is executed when this migration is applied
func Up_20180605183300(txn *sql.Tx) {
	databaseProvider := os.Getenv("DATABASE_PROVIDER")
	fmt.Printf("ENV is: %s", databaseProvider)
	binaryDataType := "BYTEA"
	if databaseProvider == "mysql" {
		binaryDataType = "BLOB"
	}

	alterCnsis := "ALTER TABLE cnsis ADD COLUMN client_id VARCHAR(255) NOT NULL;"

	_, err := txn.Exec(alterCnsis)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}

	alterCnsis = "ALTER TABLE cnsis ADD COLUMN client_secret " + binaryDataType + " NOT NULL;"

	_, err = txn.Exec(alterCnsis)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
}

// Down is executed when this migration is rolled back
func Down_20180605183300(txn *sql.Tx) {
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

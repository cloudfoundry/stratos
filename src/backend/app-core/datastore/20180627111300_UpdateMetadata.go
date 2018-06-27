package datastore

import (
	"database/sql"
	"fmt"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func (s *StratosMigrations) Up_20180627111300(txn *sql.Tx, conf *goose.DBConf) {

	updateMetadata := "ALTER TABLE tokens modify meta_data TEXT DEFAULT ''"
	_, err := txn.Exec(updateMetadata)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
	updateMetadata = "UPDATE tokens SET meta_data='' where meta_data is NULL"
	_, err = txn.Exec(updateMetadata)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}

}

func Down_20180627111300(txn *sql.Tx) {
	dropTables := "ALTER TABLE tokens modify meta_data TEXT DEFAULT ''"
	_, err := txn.Exec(dropTables)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
	dropTables = "UPDATE tokens SET meta_data=NULL where meta_data is ''"
	_, err = txn.Exec(dropTables)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
}

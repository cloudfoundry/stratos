package datastore

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20200117152200, "SesssionData", func(txn *sql.Tx, conf *goose.DBConf) error {
		sessionDataTable := "CREATE TABLE IF NOT EXISTS session_data ("
		sessionDataTable += "  session           VARCHAR(255)      NOT NULL,"
		sessionDataTable += "  groupName         VARCHAR(32)       NOT NULL,"
		sessionDataTable += "  name              VARCHAR(64)       NOT NULL,"
		sessionDataTable += "  value             TEXT              NOT NULL,"
		sessionDataTable += "  keep_on_expire    BOOLEAN           NOT NULL DEFAULT FALSE,"
		sessionDataTable += "  expired           BOOLEAN           NOT NULL DEFAULT FALSE);"

		_, err := txn.Exec(sessionDataTable)
		return err
	})
}

package datastore

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20200814140918, "ApiKeys", func(txn *sql.Tx, conf *goose.DBConf) error {
		apiTokenTable := "CREATE TABLE IF NOT EXISTS api_keys ("
		apiTokenTable += "guid            VARCHAR(36) NOT NULL UNIQUE,"
		apiTokenTable += "secret          VARCHAR(64) NOT NULL UNIQUE,"
		apiTokenTable += "user_guid       VARCHAR(36) NOT NULL,"
		apiTokenTable += "comment         VARCHAR(255) NOT NULL,"
		apiTokenTable += "last_used       TIMESTAMP,"
		apiTokenTable += "PRIMARY KEY (guid) );"

		_, err := txn.Exec(apiTokenTable)
		return err
	})
}

package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20200814140918, nil)
}
func Up20200814140918(txn *sql.Tx) error {
		apiTokenTable := "CREATE TABLE IF NOT EXISTS api_keys ("
		apiTokenTable += "guid            VARCHAR(36) NOT NULL UNIQUE,"
		apiTokenTable += "secret          VARCHAR(64) NOT NULL UNIQUE,"
		apiTokenTable += "user_guid       VARCHAR(36) NOT NULL,"
		apiTokenTable += "comment         VARCHAR(255) NOT NULL,"
		apiTokenTable += "last_used       TIMESTAMP,"
		apiTokenTable += "PRIMARY KEY (guid) );"

		_, err := txn.Exec(apiTokenTable)
		return err
	
}

package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20181129140500, nil)
}

func Up20181129140500(txn *sql.Tx) error {
	createFavoritesTable := "CREATE TABLE IF NOT EXISTS favorites ("
	createFavoritesTable += "guid                      VARCHAR(255)  NOT NULL,"
	createFavoritesTable += "user_guid                 VARCHAR(36)   NOT NULL,"
	createFavoritesTable += "endpoint_type             VARCHAR(16)   NOT NULL,"
	createFavoritesTable += "endpoint_id               VARCHAR(255)  NOT NULL,"
	createFavoritesTable += "entity_type               VARCHAR(255)  NOT NULL,"
	createFavoritesTable += "entity_id                 VARCHAR(255),"
	createFavoritesTable += "metadata                  TEXT,"
	createFavoritesTable += "last_updated              TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,"
	createFavoritesTable += "PRIMARY KEY (guid, user_guid) );"

	_, err := txn.Exec(createFavoritesTable)
	if err != nil {
		return err
	}

	createIndex := "CREATE INDEX favorites_user_guid ON favorites (user_guid);"
	_, err = txn.Exec(createIndex)
	if err != nil {
		return err
	}

	return nil
}

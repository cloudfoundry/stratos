package datastore

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20200915341000, "Relations", func(txn *sql.Tx, conf *goose.DBConf) error {

		createFavoritesTable := "CREATE TABLE IF NOT EXISTS relations ("
		createFavoritesTable += "provider                  VARCHAR(255)  NOT NULL,"
		createFavoritesTable += "type                      VARCHAR(36)   NOT NULL,"
		createFavoritesTable += "target                    VARCHAR(255)  NOT NULL,"
		createFavoritesTable += "metadata                  TEXT,"
		createFavoritesTable += "last_updated              TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,"
		createFavoritesTable += "PRIMARY KEY (provider, type, target) );"

		_, err := txn.Exec(createFavoritesTable)
		if err != nil {
			return err
		}

		// Add a marker to the config table so that later we know we need to add relations for existing endpoints
		addMarker := "INSERT INTO config (groupName, name, value) VALUES ('system', '__RELATIONS_MIGRATION_NEEDED', 'true')"

		_, err = txn.Exec(addMarker)
		if err != nil {
			return err
		}

		return nil
	})
}

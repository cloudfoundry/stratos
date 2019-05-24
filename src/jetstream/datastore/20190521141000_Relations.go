package datastore

import (
	"database/sql"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20190521141000, "Relations", func(txn *sql.Tx, conf *goose.DBConf) error {

		createFavoritesTable := "CREATE TABLE IF NOT EXISTS relations ("
		createFavoritesTable += "provider                  VARCHAR(255)  NOT NULL,"
		createFavoritesTable += "type                      VARCHAR(36)   NOT NULL,"
		createFavoritesTable += "target                    VARCHAR(255)  NOT NULL,"
		createFavoritesTable += "metadata                  TEXT,"
		createFavoritesTable += "last_updated              TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,"
		createFavoritesTable += "PRIMARY KEY (provider, target) );"

		_, err := txn.Exec(createFavoritesTable)
		if err != nil {
			return err
		}

		return nil
	})
}

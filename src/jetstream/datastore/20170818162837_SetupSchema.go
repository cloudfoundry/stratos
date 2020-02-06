package datastore

import (
	"database/sql"
	"strings"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20170818162837, "SetupSchema", func(txn *sql.Tx, conf *goose.DBConf) error {
		consoleConfigTable := "CREATE TABLE IF NOT EXISTS console_config ("
		consoleConfigTable += "  uaa_endpoint              VARCHAR(255)              NOT NULL, "
		consoleConfigTable += "  console_admin_scope       VARCHAR(255)              NOT NULL,"
		consoleConfigTable += "  console_client            VARCHAR(255)              NOT NULL,"
		consoleConfigTable += "  console_client_secret     VARCHAR(255)              NOT NULL, "
		consoleConfigTable += "  skip_ssl_validation       BOOLEAN                   NOT NULL DEFAULT FALSE,"
		consoleConfigTable += "  is_setup_complete         BOOLEAN                   NOT NULL DEFAULT FALSE,"
		consoleConfigTable += "  last_updated              TIMESTAMP                 NOT NULL DEFAULT CURRENT_TIMESTAMP);"

		_, err := txn.Exec(consoleConfigTable)
		if err != nil {
			return err
		}

		// Find a way to ensure this in Mysql
		if strings.Contains(conf.Driver.Name, "postgres") {
			createIndex := "CREATE UNIQUE INDEX console_config_one_row"
			createIndex += "  ON console_config((uaa_endpoint IS NOT NULL));"
			_, err = txn.Exec(createIndex)
			if err != nil {
				return err
			}
		}

		return nil
	})
}

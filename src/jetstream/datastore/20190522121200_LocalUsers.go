package datastore

import (
	"database/sql"
	"strings"

	"bitbucket.org/liamstask/goose/lib/goose"
)

func init() {
	RegisterMigration(20190522121200, "LocalUsers", func(txn *sql.Tx, conf *goose.DBConf) error {
		binaryDataType := "BYTEA"
		if strings.Contains(conf.Driver.Name, "mysql") {
			binaryDataType = "BLOB"
		}

		createLocalUsers := "CREATE TABLE IF NOT EXISTS local_users ("
		createLocalUsers += "user_guid     VARCHAR(36) NOT NULL, "
		createLocalUsers += "password_hash " + binaryDataType + "       NOT NULL, "
		createLocalUsers += "user_name     VARCHAR(36)  NOT NULL, "
		createLocalUsers += "user_email    VARCHAR(36), "
		createLocalUsers += "user_scope    VARCHAR(36), "
		createLocalUsers += "last_login  TIMESTAMP, "
		createLocalUsers += "last_updated  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)"

		if strings.Contains(conf.Driver.Name, "postgres") {
			createLocalUsers += " WITH (OIDS=FALSE);"
		} else {
			createLocalUsers += ";"
		}

		_, err := txn.Exec(createLocalUsers)
		if err != nil {
			return err
		}

		createIndex := "CREATE INDEX local_users_user_guid ON local_users (user_guid);"
		_, err = txn.Exec(createIndex)
		if err != nil {
			return err
		}
		createIndex = "CREATE INDEX local_users_user_name ON local_users (user_name);"
		_, err = txn.Exec(createIndex)
		if err != nil {
			return err
		}

		return nil
	})
}

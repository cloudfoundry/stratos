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

		//Add auth_endpoint_type to console_config table - allows ability to enable local users.
		addColumn := "ALTER TABLE console_config ADD auth_endpoint_type VARCHAR(255);"
		_, err := txn.Exec(addColumn)
		if err != nil {
			return err
		}

		createLocalUsers := "CREATE TABLE IF NOT EXISTS local_users ("
		createLocalUsers += "user_guid     VARCHAR(36) UNIQUE NOT NULL, "
		createLocalUsers += "password_hash " + binaryDataType + "       NOT NULL, "
		createLocalUsers += "user_name     VARCHAR(128)  UNIQUE NOT NULL, "
		createLocalUsers += "user_email    VARCHAR(254), "
		createLocalUsers += "user_scope    VARCHAR(64), "
		createLocalUsers += "last_login    TIMESTAMP, "
		createLocalUsers += "last_updated  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "
		createLocalUsers += "PRIMARY KEY (user_guid) )"

		//Trigger to update last_updated timestamp
		createUpdateModifiedTrigger := "CREATE TRIGGER update_last_updated "
		createUpdateModifiedTrigger += "AFTER UPDATE ON local_users "
		createUpdateModifiedTrigger += "BEGIN UPDATE local_users SET last_updated = DATETIME('now') WHERE _rowid_ = new._rowid_; "
		createUpdateModifiedTrigger += "END;"

		//Configure Postgres migration options 
		if strings.Contains(conf.Driver.Name, "postgres") {
			createLocalUsers += " WITH (OIDS=FALSE);"

			//Postgres requires a trigger function
			//Create trigger function and generate trigger statement
			postgresTrigger, err := setupPostgresTrigger(txn)
			if err != nil {
				return err
			}
			createUpdateModifiedTrigger = postgresTrigger

		} else if strings.Contains(conf.Driver.Name, "mysql") {
			// MySQL
			createUpdateModifiedTrigger = "CREATE TRIGGER update_last_updated "
			createUpdateModifiedTrigger += "AFTER UPDATE ON local_users "
			createUpdateModifiedTrigger += "FOR EACH ROW BEGIN "
			createUpdateModifiedTrigger += "UPDATE local_users SET last_updated = NOW() WHERE user_guid = NEW.user_guid; "
			createUpdateModifiedTrigger += "END;"

			createLocalUsers += ";"
			} else {
			createLocalUsers += ";"
		}

		_, err = txn.Exec(createLocalUsers)
		if err != nil {
			return err
		}

		_, err = txn.Exec(createUpdateModifiedTrigger)
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

func setupPostgresTrigger(txn *sql.Tx) (string, error) {
	
	createPostgresUpdateModifiedTrigger :=  "CREATE TRIGGER update_trigger "
	createPostgresUpdateModifiedTrigger +=	"AFTER UPDATE ON local_users FOR EACH ROW "
	createPostgresUpdateModifiedTrigger +=	"EXECUTE PROCEDURE update_last_modified_time(); "

	postgresTriggerFunction :=	"CREATE OR REPLACE FUNCTION update_last_modified_time() "
	postgresTriggerFunction +=	"RETURNS trigger AS "
	postgresTriggerFunction +=	"$BODY$ "
	postgresTriggerFunction +=	"BEGIN "
	postgresTriggerFunction +=	"UPDATE local_users "
	postgresTriggerFunction +=	"SET last_updated = CURRENT_TIMESTAMP WHERE new.user_guid = old.user_guid; "
	postgresTriggerFunction +=	"RETURN NEW; END; $BODY$ "
	postgresTriggerFunction +=	"LANGUAGE plpgsql VOLATILE COST 100;"

	_, err := txn.Exec(postgresTriggerFunction)
	if err != nil {
		return "", err
	}

	return createPostgresUpdateModifiedTrigger, err
}


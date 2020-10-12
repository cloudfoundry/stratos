package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20170818120003, nil)
}

func Up20170818120003(txn *sql.Tx) error {
	dialect := goose.GetDialect()

	binaryDataType := "BYTEA"

	if _, ok := dialect.(goose.MySQLDialect); ok {
		binaryDataType = "BLOB"
	}

	createTokens := "CREATE TABLE IF NOT EXISTS tokens ("
	createTokens += "user_guid     VARCHAR(36) NOT NULL, "
	createTokens += "cnsi_guid     VARCHAR(36), "
	createTokens += "token_type    VARCHAR(4)  NOT NULL, "
	createTokens += "auth_token    " + binaryDataType + "       NOT NULL, "
	createTokens += "refresh_token " + binaryDataType + "       NOT NULL, "
	createTokens += "token_expiry  BIGINT      NOT NULL, "
	createTokens += "last_updated  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)"

	if _, ok := dialect.(goose.PostgresDialect); ok {
		createTokens += " WITH (OIDS=FALSE);"
	} else {
		createTokens += ";"
	}

	_, err := txn.Exec(createTokens)
	if err != nil {
		return err
	}

	createCnsisTable := "CREATE TABLE IF NOT EXISTS cnsis ("
	createCnsisTable += "guid    VARCHAR(36)   NOT NULL UNIQUE,"
	createCnsisTable += "name                      VARCHAR(255)  NOT NULL,"
	createCnsisTable += "cnsi_type                 VARCHAR(3)    NOT NULL,"
	createCnsisTable += "api_endpoint              VARCHAR(255)  NOT NULL,"
	createCnsisTable += "auth_endpoint             VARCHAR(255)  NOT NULL,"
	createCnsisTable += "token_endpoint            VARCHAR(255)  NOT NULL,"
	createCnsisTable += "doppler_logging_endpoint  VARCHAR(255)  NOT NULL,"
	createCnsisTable += "skip_ssl_validation       BOOLEAN       NOT NULL DEFAULT FALSE,"
	createCnsisTable += "last_updated              TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,"
	createCnsisTable += "PRIMARY KEY (guid) );"

	_, err = txn.Exec(createCnsisTable)
	if err != nil {
		return err
	}

	createIndex := "CREATE INDEX tokens_user_guid ON tokens (user_guid);"
	_, err = txn.Exec(createIndex)
	if err != nil {
		return err
	}
	createIndex = "CREATE INDEX tokens_cnsi_guid ON tokens (cnsi_guid);"
	_, err = txn.Exec(createIndex)
	if err != nil {
		return err
	}
	createIndex = "CREATE INDEX tokens_token_type ON tokens (token_type);"
	_, err = txn.Exec(createIndex)
	if err != nil {
		return err
	}
	createIndex = "CREATE INDEX cnsis_name ON cnsis (name);"
	_, err = txn.Exec(createIndex)
	if err != nil {
		return err
	}
	createIndex = "CREATE INDEX cnsis_cnsi_type ON cnsis (cnsi_type);"
	_, err = txn.Exec(createIndex)
	if err != nil {
		return err
	}

	return nil
}

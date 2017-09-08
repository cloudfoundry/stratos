package main

import (
	"database/sql"
	"fmt"
	"os"
)

// Up is executed when this migration is applied
func Up_20170818120003(txn *sql.Tx) {

	databaseProvider := os.Getenv("DATABASE_PROVIDER")
	fmt.Printf("ENV is: %s, %s", databaseProvider, os.Getenv("MYSQL_ROOT_PASSWORD"))
	binaryDataType := "BYTEA"
	if databaseProvider == "mysql" {
		binaryDataType = "BLOB"
	}
	createTokens := "CREATE TABLE IF NOT EXISTS tokens ("
	createTokens += "user_guid     VARCHAR(36) NOT NULL, "
	createTokens += "cnsi_guid     VARCHAR(36), "
	createTokens += "token_type    VARCHAR(4)  NOT NULL, "
	createTokens += "auth_token    " + binaryDataType + "       NOT NULL, "
	createTokens += "refresh_token " + binaryDataType + "       NOT NULL, "
	createTokens += "token_expiry  BIGINT      NOT NULL, "
	createTokens += "last_updated  TIMESTAMP NOT NULL DEFAULT (NOW()) )"

	if databaseProvider == "pgsql" {
		createTokens += " WITH (OIDS=FALSE);"
	}

	_, err := txn.Exec(createTokens)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
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
	createCnsisTable += "last_updated              TIMESTAMP     NOT NULL DEFAULT (NOW()),"
	createCnsisTable += "PRIMARY KEY (guid) );"

	_, err = txn.Exec(createCnsisTable)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}

	createIndex := "CREATE INDEX tokens_user_guid ON tokens (user_guid);"
	_, err = txn.Exec(createIndex)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
	createIndex = "CREATE INDEX tokens_cnsi_guid ON tokens (cnsi_guid);"
	_, err = txn.Exec(createIndex)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
	createIndex = "CREATE INDEX tokens_token_type ON tokens (token_type);"
	_, err = txn.Exec(createIndex)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
	createIndex = "CREATE INDEX cnsis_name ON cnsis (name);"
	_, err = txn.Exec(createIndex)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
	createIndex = "CREATE INDEX cnsis_cnsi_type ON cnsis (cnsi_type);"
	_, err = txn.Exec(createIndex)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}

}

// Down is executed when this migration is rolled back
func Down_20170818120003(txn *sql.Tx) {

	dropTables := "DROP  INDEX IF EXISTS tokens_token_type;"
	_, err := txn.Exec(dropTables)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
	dropTables = "DROP  INDEX IF EXISTS tokens_cnsi_guid;"
	_, err = txn.Exec(dropTables)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
	dropTables = "DROP  INDEX IF EXISTS tokens_user_guid;"
	_, err = txn.Exec(dropTables)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
	dropTables = "DROP  TABLE IF EXISTS tokens;"
	_, err = txn.Exec(dropTables)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
	dropTables = "DROP  INDEX IF EXISTS cnsis_cnsi_type;"
	_, err = txn.Exec(dropTables)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
	dropTables = "DROP  INDEX IF EXISTS cnsis_name;"
	_, err = txn.Exec(dropTables)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
	dropTables = "DROP  TABLE IF EXISTS cnsis;"
	_, err = txn.Exec(dropTables)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}

}

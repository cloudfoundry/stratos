package constants

const (
	ERR_GOOSE_DB_NO_DATABASE_VERSIONS_FOUND              = "pgsql_goosedb: no database versions found"
	ERR_GOOSE_DB_NO_SUCH_TABLE                           = "pgsql_goosedb: no such table"
	ERR_GOOSE_DB_FAILED_GETTING_CURRENT_DATABASE_VERSION = "pgsql_goosedb: error trying to get current database version: %w"
)

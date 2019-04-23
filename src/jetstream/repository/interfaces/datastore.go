package interfaces

import (
	"regexp"
)

const (
	// SQLite DB Provider
	SQLITE string = "sqlite"
	// PGSQL DB Provider
	PGSQL = "pgsql"
	// MYSQL DB Provider
	MYSQL = "mysql"
)

// ModifySQLStatement - Modify the given DB statement for the specified provider, as appropraite
// e.g Postgres uses $1, $2 etc
// SQLite uses ?
func ModifySQLStatement(sql string, databaseProvider string) string {
	if databaseProvider == SQLITE || databaseProvider == MYSQL {
		sqlParamReplace := regexp.MustCompile("\\$[0-9]+")
		return sqlParamReplace.ReplaceAllString(sql, "?")
	}

	// Default is to return the SQL provided directly
	return sql
}

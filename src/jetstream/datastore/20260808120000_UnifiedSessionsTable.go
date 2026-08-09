package datastore

import (
	"database/sql"

	"github.com/pressly/goose"
)

func init() {
	goose.AddMigration(Up20260808120000, nil)
}

// Up20260808120000 unifies the session table across database providers.
// Until now each provider's session store created its own table — pgstore
// hardcoded "http_sessions" while the MySQL and SQLite stores were handed
// "sessions" — and the split forced per-provider table-name resolution in
// every statement joining against it. The single sessionstore package now
// expects one schema under one name, created here rather than by the store.
//
// Drop-and-recreate is deliberate: sessions are ephemeral, the old stores'
// schemas differ from each other, and recreating gives every provider the
// same shape at the cost of a one-time sign-out on upgrade (release-noted).
// Orphaned session_data rows are expired by the existing cleanup pass, and
// kube-terminal pods annotated with old session ids are reaped by their
// cleanup for the same reason.
func Up20260808120000(txn *sql.Tx) error {
	dialect := goose.GetDialect()

	// The postgres-only table pgstore created; harmless no-op elsewhere.
	if _, err := txn.Exec("DROP TABLE IF EXISTS http_sessions;"); err != nil {
		return err
	}
	if _, err := txn.Exec("DROP TABLE IF EXISTS sessions;"); err != nil {
		return err
	}

	var createSessions string
	if _, ok := dialect.(*goose.PostgresDialect); ok {
		createSessions = `CREATE TABLE sessions (
			id            BIGSERIAL PRIMARY KEY,
			session_data  TEXT NOT NULL,
			created_on    TIMESTAMP WITH TIME ZONE NOT NULL,
			modified_on   TIMESTAMP WITH TIME ZONE NOT NULL,
			expires_on    TIMESTAMP WITH TIME ZONE NOT NULL);`
	} else if _, ok := dialect.(*goose.MySQLDialect); ok {
		createSessions = `CREATE TABLE sessions (
			id            BIGINT NOT NULL AUTO_INCREMENT,
			session_data  LONGTEXT NOT NULL,
			created_on    DATETIME NOT NULL,
			modified_on   DATETIME NOT NULL,
			expires_on    DATETIME NOT NULL,
			PRIMARY KEY (id));`
	} else {
		// SQLite. AUTOINCREMENT (vs the old store's bare INTEGER PRIMARY KEY)
		// forbids rowid reuse: a reused session id would resurrect that id's
		// stale session_data rows and kube-terminal pod annotations.
		createSessions = `CREATE TABLE sessions (
			id            INTEGER PRIMARY KEY AUTOINCREMENT,
			session_data  TEXT NOT NULL,
			created_on    TIMESTAMP NOT NULL,
			modified_on   TIMESTAMP NOT NULL,
			expires_on    TIMESTAMP NOT NULL);`
	}

	_, err := txn.Exec(createSessions)
	return err
}

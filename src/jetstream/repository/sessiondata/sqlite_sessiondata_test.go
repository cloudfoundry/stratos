package sessiondata

import (
	"database/sql"
	"testing"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/datastore"

	_ "github.com/ncruces/go-sqlite3/driver"
)

// These statements are only proven by running them against a database that
// actually has the session table — a wrong table name fails at execution
// ("no such table"), which no assertion on the statement text can catch.
//
// SQLite is the provider the gate can run for real.
func sqliteSessionDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("open in-memory sqlite: %v", err)
	}
	t.Cleanup(func() { db.Close() })

	// Mirrors the SQLite DDL of migration 20260808120000 plus the
	// session_data table from migration 20200117152200.
	schema := []string{
		`CREATE TABLE sessions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			session_data TEXT NOT NULL DEFAULT '',
			created_on TIMESTAMP NOT NULL DEFAULT 0,
			modified_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			expires_on TIMESTAMP NOT NULL DEFAULT 0)`,
		`CREATE TABLE session_data (
			session VARCHAR(255) NOT NULL,
			groupName VARCHAR(32) NOT NULL,
			name VARCHAR(64) NOT NULL,
			value TEXT NOT NULL,
			keep_on_expire BOOLEAN NOT NULL DEFAULT FALSE,
			expired BOOLEAN NOT NULL DEFAULT FALSE)`,
	}
	for _, stmt := range schema {
		if _, err := db.Exec(stmt); err != nil {
			t.Fatalf("create schema: %v", err)
		}
	}
	return db
}

func TestExpireSessionDataRunsAgainstSQLite(t *testing.T) {
	InitRepositoryProvider(datastore.SQLITE)
	db := sqliteSessionDB(t)

	// Session 1 still exists; session 2 does not.
	if _, err := db.Exec(`INSERT INTO sessions (id) VALUES (1)`); err != nil {
		t.Fatalf("seed session: %v", err)
	}
	for _, session := range []string{"1", "2"} {
		if _, err := db.Exec(`INSERT INTO session_data (session, groupName, name, value) VALUES (?, 'g', 'n', 'v')`, session); err != nil {
			t.Fatalf("seed session_data: %v", err)
		}
	}

	if _, err := db.Exec(expireSessionData); err != nil {
		t.Fatalf("expireSessionData failed to execute: %v", err)
	}

	// Only the row whose session is gone may be expired — proving the
	// statement resolved a table that actually holds the live session.
	var expired int
	if err := db.QueryRow(`SELECT COUNT(*) FROM session_data WHERE expired=true`).Scan(&expired); err != nil {
		t.Fatalf("count expired: %v", err)
	}
	if expired != 1 {
		t.Errorf("expired %d session_data rows, want 1 (the orphaned session)", expired)
	}

	var liveExpired int
	if err := db.QueryRow(`SELECT COUNT(*) FROM session_data WHERE session='1' AND expired=true`).Scan(&liveExpired); err != nil {
		t.Fatalf("count live expired: %v", err)
	}
	if liveExpired != 0 {
		t.Errorf("expired the session_data of a session that still exists")
	}
}

func TestIsValidSessionRunsAgainstSQLite(t *testing.T) {
	InitRepositoryProvider(datastore.SQLITE)
	db := sqliteSessionDB(t)

	future := time.Now().Add(time.Hour)
	past := time.Now().Add(-time.Hour)
	if _, err := db.Exec(`INSERT INTO sessions (id, expires_on) VALUES (1, ?), (2, ?)`, future, past); err != nil {
		t.Fatalf("seed sessions: %v", err)
	}

	repo := &SessionDataRepository{db: db}

	valid, err := repo.IsValidSession(1)
	if err != nil {
		t.Fatalf("IsValidSession on a live session failed: %v", err)
	}
	if !valid {
		t.Error("session expiring in the future reported as invalid")
	}

	expired, err := repo.IsValidSession(2)
	if err != nil {
		t.Fatalf("IsValidSession on an expired session failed: %v", err)
	}
	if expired {
		t.Error("session that expired in the past reported as valid")
	}

	missing, err := repo.IsValidSession(99)
	if err != nil {
		t.Fatalf("IsValidSession on a missing session failed: %v", err)
	}
	if missing {
		t.Error("session that does not exist reported as valid")
	}
}

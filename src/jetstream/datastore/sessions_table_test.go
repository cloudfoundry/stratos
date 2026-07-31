package datastore

import (
	"strings"
	"testing"
)

// The session table is created by the session store library, and only two of
// the three take a table name from us — pgstore hardcodes "http_sessions".
// Statements joining against it therefore have to resolve the name per
// provider; these tests pin that resolution in both directions, since a
// statement hardcoding either spelling works on one provider and fails on the
// others.
func TestSessionsTableName(t *testing.T) {
	cases := map[string]string{
		PGSQL:  "http_sessions",
		MYSQL:  "sessions",
		SQLITE: "sessions",
	}

	for provider, expected := range cases {
		if actual := SessionsTableName(provider); actual != expected {
			t.Errorf("SessionsTableName(%q) = %q, want %q", provider, actual, expected)
		}
	}
}

func TestModifySQLStatementResolvesSessionsTable(t *testing.T) {
	stmt := `SELECT id from ` + SessionsTablePlaceholder + ` WHERE id=$1`

	pg := ModifySQLStatement(stmt, PGSQL)
	if !strings.Contains(pg, "from http_sessions ") {
		t.Errorf("pgsql statement does not query http_sessions: %s", pg)
	}

	for _, provider := range []string{MYSQL, SQLITE} {
		out := ModifySQLStatement(stmt, provider)
		if !strings.Contains(out, "from sessions ") {
			t.Errorf("%s statement does not query sessions: %s", provider, out)
		}
		if strings.Contains(out, "http_sessions") {
			t.Errorf("%s statement queries the postgres-only table: %s", provider, out)
		}
	}

	// The placeholder must never survive into a statement handed to a driver.
	for _, provider := range []string{PGSQL, MYSQL, SQLITE} {
		if strings.Contains(ModifySQLStatement(stmt, provider), SessionsTablePlaceholder) {
			t.Errorf("%s statement still carries the unresolved placeholder", provider)
		}
	}
}

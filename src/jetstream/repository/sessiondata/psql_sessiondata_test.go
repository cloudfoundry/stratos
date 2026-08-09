package sessiondata

import (
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/datastore"
)

// TestSessionTableStatements pins the statements that join against the
// session table to the one name migration 20260808120000 creates on every
// provider. Before the stores were unified (GH #5733) the table was
// "http_sessions" on Postgres and "sessions" elsewhere, and a hardcoded
// spelling here failed on whichever providers it wasn't written for —
// "pq: relation \"sessions\" does not exist" on every cleanup tick was the
// original regression (GH #5730).
func TestSessionTableStatements(t *testing.T) {
	for name, stmt := range map[string]string{
		"expireSessionData": expireSessionData,
		"isValidSession":    isValidSession,
	} {
		if !strings.Contains(stmt, "from sessions") {
			t.Errorf("%s does not reference the sessions table — got: %s", name, stmt)
		}
		if strings.Contains(stmt, "http_sessions") {
			t.Errorf("%s references the pre-unification postgres table — got: %s", name, stmt)
		}
		// Postgres positional parameters must not survive dialect resolution.
		for _, provider := range []string{datastore.MYSQL, datastore.SQLITE} {
			if out := datastore.ModifySQLStatement(stmt, provider); strings.Contains(out, "$") {
				t.Errorf("%s not dialect-resolved for %s: %s", name, provider, out)
			}
		}
	}
}

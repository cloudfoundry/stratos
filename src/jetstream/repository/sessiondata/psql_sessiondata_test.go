package sessiondata

import (
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/datastore"
)

// TestExpireSessionDataTableName guards the regression that had
// expireSessionData naming a session table that does not exist on the running
// provider — originally "sessions" on Postgres, which failed with
// "pq: relation \"sessions\" does not exist" on every cleanup tick.
//
// The guard is per provider because the session store names that table
// differently on each, so there is no single correct spelling to assert. The
// statements are package state mutated by InitRepositoryProvider, so each case
// re-resolves from the pristine template.
func TestExpireSessionDataTableName(t *testing.T) {
	template := expireSessionData
	t.Cleanup(func() { expireSessionData = template })

	for _, provider := range []string{datastore.PGSQL, datastore.MYSQL, datastore.SQLITE} {
		expireSessionData = datastore.ModifySQLStatement(template, provider)

		want := "from " + datastore.SessionsTableName(provider)
		if !strings.Contains(expireSessionData, want) {
			t.Errorf("%s: expireSessionData does not reference %q — got: %s", provider, want, expireSessionData)
		}
		if strings.Contains(expireSessionData, datastore.SessionsTablePlaceholder) {
			t.Errorf("%s: expireSessionData still carries the unresolved placeholder", provider)
		}
	}
}

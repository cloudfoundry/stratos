package sessiondata

import (
	"testing"
)

// TestExpireSessionDataTableName verifies that the expireSessionData SQL
// references "http_sessions" (the table name pgstore actually creates) and
// not the incorrect "sessions" name that caused
// "pq: relation \"sessions\" does not exist" on every cleanup tick.
func TestExpireSessionDataTableName(t *testing.T) {
	const wrongTable = "from sessions"
	const rightTable = "from http_sessions"

	if contains(expireSessionData, wrongTable) {
		t.Errorf("expireSessionData references %q — pgstore creates %q; this causes a DB error on every cleanup tick", wrongTable, rightTable)
	}
	if !contains(expireSessionData, rightTable) {
		t.Errorf("expireSessionData does not reference %q — got: %s", rightTable, expireSessionData)
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsAt(s, substr))
}

func containsAt(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

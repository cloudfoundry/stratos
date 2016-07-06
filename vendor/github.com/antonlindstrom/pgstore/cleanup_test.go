package pgstore

import (
	"net/http"
	"os"
	"testing"
	"time"
)

func TestCleanup(t *testing.T) {
	ss := NewPGStore(os.Getenv("PGSTORE_TEST_CONN"), []byte(secret))
	if ss == nil {
		t.Skip("This test requires a real database")
	}

	defer ss.Close()
	// Start the cleanup goroutine.
	defer ss.StopCleanup(ss.Cleanup(time.Millisecond * 500))

	req, err := http.NewRequest("GET", "http://www.example.com", nil)
	if err != nil {
		t.Fatal("Failed to create request", err)
	}

	session, err := ss.Get(req, "newsess")
	if err != nil {
		t.Fatal("Failed to create session", err)
	}

	// Expire the session
	session.Options.MaxAge = 1

	m := make(http.Header)
	if err = ss.Save(req, headerOnlyResponseWriter(m), session); err != nil {
		t.Fatal("failed to save session:", err.Error())
	}

	// Give the ticker a moment to run
	time.Sleep(time.Second * 1)

	// SELECT expired sessions. We should get a zero-length result slice back.
	var results []int64
	_, err = ss.DbMap.Select(&results, "SELECT id FROM http_sessions WHERE expires_on < now()")
	if err != nil {
		t.Fatalf("failed to select expired sessions from DB: %v", err)
	}

	if len(results) > 0 {
		t.Fatalf("ticker did not delete expired sessions: want 0 got %v", len(results))
	}
}

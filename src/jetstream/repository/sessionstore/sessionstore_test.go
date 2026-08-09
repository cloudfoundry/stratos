package sessionstore

import (
	"database/sql"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"

	_ "github.com/ncruces/go-sqlite3/driver"

	"github.com/cloudfoundry/stratos/src/jetstream/datastore"
)

const cookieName = "test-session"

var testKey = []byte("0123456789abcdef0123456789abcdef")

// openStore gives a store over an in-memory SQLite with the sessions table
// exactly as migration 20260808120000 creates it there.
func openStore(t *testing.T) (*Store, *sql.DB) {
	t.Helper()
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { db.Close() })
	// A pool with >1 conn would hand each query a different empty :memory: DB.
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(`CREATE TABLE sessions (
		id            INTEGER PRIMARY KEY AUTOINCREMENT,
		session_data  TEXT NOT NULL,
		created_on    TIMESTAMP NOT NULL,
		modified_on   TIMESTAMP NOT NULL,
		expires_on    TIMESTAMP NOT NULL);`); err != nil {
		t.Fatal(err)
	}
	store, err := New(db, datastore.SQLITE, "/", 3600, testKey)
	if err != nil {
		t.Fatal(err)
	}
	return store, db
}

// saveNew creates a session with the given values, saves it, and returns the
// session cookie the client would hold.
func saveNew(t *testing.T, store *Store, values map[interface{}]interface{}) *http.Cookie {
	t.Helper()
	req := httptest.NewRequest("GET", "/", nil)
	session, err := store.New(req, cookieName)
	if err != nil {
		t.Fatal(err)
	}
	for k, v := range values {
		session.Values[k] = v
	}
	rec := httptest.NewRecorder()
	if err := store.Save(req, rec, session); err != nil {
		t.Fatal(err)
	}
	cookies := rec.Result().Cookies()
	if len(cookies) != 1 {
		t.Fatalf("expected 1 cookie, got %d", len(cookies))
	}
	if !cookies[0].Secure {
		t.Error("session cookie not marked Secure")
	}
	if _, err := strconv.Atoi(session.ID); err != nil {
		t.Errorf("session id %q is not an integer — the kube-terminal annotation contract needs one", session.ID)
	}
	return cookies[0]
}

func requestWith(cookie *http.Cookie) *http.Request {
	req := httptest.NewRequest("GET", "/", nil)
	req.AddCookie(cookie)
	return req
}

func rowCount(t *testing.T, db *sql.DB) int {
	t.Helper()
	var n int
	if err := db.QueryRow("SELECT COUNT(*) FROM sessions").Scan(&n); err != nil {
		t.Fatal(err)
	}
	return n
}

func TestSaveAndLoadRoundTrip(t *testing.T) {
	store, _ := openStore(t)
	cookie := saveNew(t, store, map[interface{}]interface{}{"user_id": "abc-123"})

	session, err := store.New(requestWith(cookie), cookieName)
	if err != nil {
		t.Fatal(err)
	}
	if session.IsNew {
		t.Fatal("stored session came back as new")
	}
	if got := session.Values["user_id"]; got != "abc-123" {
		t.Errorf("user_id = %v, want abc-123", got)
	}
	// handleSessionExpiryHeader reads expires_on from the loaded values.
	if _, ok := session.Values["expires_on"].(time.Time); !ok {
		t.Error("loaded session carries no expires_on time")
	}
}

func TestLogoutDeletesRow(t *testing.T) {
	store, db := openStore(t)
	cookie := saveNew(t, store, map[interface{}]interface{}{"user_id": "abc-123"})
	if rowCount(t, db) != 1 {
		t.Fatal("expected one session row")
	}

	// clearSession's contract: save with a negative MaxAge destroys.
	req := requestWith(cookie)
	session, err := store.New(req, cookieName)
	if err != nil {
		t.Fatal(err)
	}
	session.Options.MaxAge = -1
	rec := httptest.NewRecorder()
	if err := store.Save(req, rec, session); err != nil {
		t.Fatal(err)
	}

	if n := rowCount(t, db); n != 0 {
		t.Errorf("logout left %d session rows", n)
	}
	cookies := rec.Result().Cookies()
	if len(cookies) != 1 || cookies[0].MaxAge >= 0 {
		t.Error("logout did not expire the cookie")
	}
}

func TestExpiredSessionNotLoaded(t *testing.T) {
	store, db := openStore(t)
	cookie := saveNew(t, store, map[interface{}]interface{}{"user_id": "abc-123"})
	if _, err := db.Exec("UPDATE sessions SET expires_on = ?", time.Now().UTC().Add(-time.Hour)); err != nil {
		t.Fatal(err)
	}

	session, err := store.New(requestWith(cookie), cookieName)
	if err != nil {
		t.Fatal(err)
	}
	if !session.IsNew {
		t.Error("expired session was loaded")
	}
}

func TestCleanupDeletesOnlyExpired(t *testing.T) {
	store, db := openStore(t)
	saveNew(t, store, map[interface{}]interface{}{"which": "live"})
	saveNew(t, store, map[interface{}]interface{}{"which": "expired"})
	if _, err := db.Exec("UPDATE sessions SET expires_on = ? WHERE id = 2", time.Now().UTC().Add(-time.Hour)); err != nil {
		t.Fatal(err)
	}

	if err := store.deleteExpired(); err != nil {
		t.Fatal(err)
	}
	if n := rowCount(t, db); n != 1 {
		t.Errorf("expected 1 surviving session row, got %d", n)
	}
}

func TestTamperedCookieYieldsNewSession(t *testing.T) {
	store, _ := openStore(t)
	cookie := saveNew(t, store, map[interface{}]interface{}{"user_id": "abc-123"})
	cookie.Value = cookie.Value[:len(cookie.Value)-2] + "xx"

	session, err := store.New(requestWith(cookie), cookieName)
	if err != nil {
		t.Fatal(err)
	}
	if !session.IsNew {
		t.Error("tampered cookie resolved to a stored session")
	}
}

// TestPostgresStatements pins the PG-specific split: $N placeholders survive
// only there, and the insert path appends RETURNING id because lib/pq has no
// LastInsertId.
func TestPostgresStatements(t *testing.T) {
	store, err := New(nil, datastore.PGSQL, "/", 3600, testKey)
	if err == nil || store != nil {
		t.Fatal("nil db must be rejected")
	}

	db, _ := sql.Open("sqlite3", ":memory:")
	defer db.Close()
	pg, err := New(db, datastore.PGSQL, "/", 3600, testKey)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(pg.stmtInsert, "$4") || strings.Contains(pg.stmtInsert, "?") {
		t.Errorf("pg insert lost its positional parameters: %s", pg.stmtInsert)
	}
	sq, err := New(db, datastore.SQLITE, "/", 3600, testKey)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(sq.stmtInsert, "$") {
		t.Errorf("sqlite insert kept pg parameters: %s", sq.stmtInsert)
	}
}

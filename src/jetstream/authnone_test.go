package main

import (
	"database/sql"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v5"

	"github.com/cloudfoundry/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry/stratos/src/jetstream/repository/sessionstore"
)

type noAuthVerify struct {
	t  *testing.T
	e  *echo.Echo
	db *sql.DB
}

// newNoAuthVerify serves GET /verify the way verifySession does in no-auth
// mode: the hook runs on every call, and the response carries the session
// cookie.
func newNoAuthVerify(t *testing.T) *noAuthVerify {
	db, err := datastore.GetInMemorySQLLiteConnection()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { db.Close() })
	store, err := sessionstore.New(db, datastore.SQLITE, "/", 3600, []byte("0123456789abcdef0123456789abcdef"))
	if err != nil {
		t.Fatal(err)
	}
	pp := &portalProxy{SessionStore: store, SessionCookieName: "console-session"}
	auth := &noAuth{p: pp}
	e := echo.New()
	e.GET("/verify", func(c *echo.Context) error {
		auth.BeforeVerifySession(c)
		userID, err := pp.GetSessionValue(c, "user_id")
		if err != nil {
			return c.NoContent(http.StatusUnauthorized)
		}
		return c.String(http.StatusOK, userID.(string))
	})
	return &noAuthVerify{t: t, e: e, db: db}
}

func (s *noAuthVerify) verify(cookie *http.Cookie) (*httptest.ResponseRecorder, *http.Cookie) {
	req := httptest.NewRequest(http.MethodGet, "/verify", nil)
	if cookie != nil {
		req.AddCookie(cookie)
	}
	rec := httptest.NewRecorder()
	s.e.ServeHTTP(rec, req)
	var last *http.Cookie
	for _, c := range rec.Result().Cookies() {
		if c.Name == "console-session" {
			last = c
		}
	}
	if last == nil {
		s.t.Fatal("response set no session cookie")
	}
	return rec, last
}

func (s *noAuthVerify) sessions() int {
	var n int
	if err := s.db.QueryRow("SELECT COUNT(*) FROM sessions").Scan(&n); err != nil {
		s.t.Fatal(err)
	}
	return n
}

// Verifying again with a live no-auth session must keep that session: a new
// row and cookie per call orphans rows and splits the XSRF token between
// overlapping calls.
func TestNoAuthVerifyReusesTheSession(t *testing.T) {
	s := newNoAuthVerify(t)
	_, first := s.verify(nil)
	rec, again := s.verify(first)

	if rec.Body.String() != noAuthUserID {
		t.Errorf("verify answered %q, want the no-auth user", rec.Body.String())
	}
	if again.Value != first.Value {
		t.Error("a second verify with a live session rotated the session cookie")
	}
	if n := s.sessions(); n != 1 {
		t.Errorf("%d session rows after two verifies, want 1", n)
	}
}

// A cookie naming a session that is gone must still get a working session.
func TestNoAuthVerifyWithDeadCookie(t *testing.T) {
	s := newNoAuthVerify(t)
	_, first := s.verify(nil)
	if _, err := s.db.Exec("DELETE FROM sessions"); err != nil {
		t.Fatal(err)
	}

	rec, again := s.verify(first)
	if rec.Body.String() != noAuthUserID {
		t.Errorf("verify with a dead cookie answered %d %q, want the no-auth user", rec.Code, rec.Body.String())
	}
	if again.Value == first.Value {
		t.Error("a dead cookie was not replaced with a new session")
	}
	if n := s.sessions(); n != 1 {
		t.Errorf("%d session rows, want 1", n)
	}
}

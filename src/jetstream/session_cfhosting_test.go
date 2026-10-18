package main

import (
	"database/sql"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v5"

	"github.com/cloudfoundry/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/cloudfoundryhosting"
	"github.com/cloudfoundry/stratos/src/jetstream/repository/sessionstore"
)

// cfHostedLogin serves the order a console deployed to Cloud Foundry uses:
// the hosting plugin's session middleware loads the session from the cookie
// before the login handler sets the user on it. POST /login signs in as
// user-1; GET /whoami answers the signed-in user or 401.
type cfHostedLogin struct {
	t  *testing.T
	e  *echo.Echo
	db *sql.DB
}

func newCFHostedLogin(t *testing.T) *cfHostedLogin {
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
	plugin, _ := cloudfoundryhosting.Init(pp)

	e := echo.New()
	e.Use(plugin.(*cloudfoundryhosting.CFHosting).SessionEchoMiddleware)
	e.POST("/login", func(c *echo.Context) error {
		if err := pp.setLoginSession(c, map[string]interface{}{"user_id": "user-1"}); err != nil {
			return err
		}
		return c.NoContent(http.StatusOK)
	})
	e.GET("/whoami", func(c *echo.Context) error {
		userID, err := pp.GetSessionValue(c, "user_id")
		if err != nil {
			return c.NoContent(http.StatusUnauthorized)
		}
		return c.String(http.StatusOK, userID.(string))
	})
	return &cfHostedLogin{t: t, e: e, db: db}
}

func (s *cfHostedLogin) send(method, path string, cookie *http.Cookie) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, nil)
	if cookie != nil {
		req.AddCookie(cookie)
	}
	rec := httptest.NewRecorder()
	s.e.ServeHTTP(rec, req)
	return rec
}

// sessionCookie is the last session cookie the response set.
func (s *cfHostedLogin) sessionCookie(rec *httptest.ResponseRecorder) *http.Cookie {
	var last *http.Cookie
	for _, c := range rec.Result().Cookies() {
		if c.Name == "console-session" {
			last = c
		}
	}
	if last == nil {
		s.t.Fatal("response set no session cookie")
	}
	return last
}

func (s *cfHostedLogin) whoami(cookie *http.Cookie) (int, string) {
	rec := s.send(http.MethodGet, "/whoami", cookie)
	return rec.Code, rec.Body.String()
}

// A browser whose cookie names a session that is gone (signed out elsewhere,
// cleaned up after expiry) must still be able to sign in.
func TestCFHostedLoginWithDeadCookie(t *testing.T) {
	s := newCFHostedLogin(t)
	first := s.sessionCookie(s.send(http.MethodPost, "/login", nil))
	if _, err := s.db.Exec("DELETE FROM sessions"); err != nil {
		t.Fatal(err)
	}

	again := s.sessionCookie(s.send(http.MethodPost, "/login", first))
	if code, user := s.whoami(again); code != http.StatusOK || user != "user-1" {
		t.Errorf("after signing in with a dead session cookie: %d %q, want 200 \"user-1\"", code, user)
	}
}

// A login must not sign in the session the request arrived with: whoever
// else holds that cookie would share the signed-in session.
func TestCFHostedLoginStartsNewSession(t *testing.T) {
	s := newCFHostedLogin(t)
	before := s.sessionCookie(s.send(http.MethodGet, "/whoami", nil))

	after := s.sessionCookie(s.send(http.MethodPost, "/login", before))
	if code, user := s.whoami(after); code != http.StatusOK || user != "user-1" {
		t.Fatalf("signed-in cookie: %d %q, want 200 \"user-1\"", code, user)
	}
	if code, user := s.whoami(before); code != http.StatusUnauthorized {
		t.Errorf("the cookie from before the login: %d %q, want 401", code, user)
	}
}

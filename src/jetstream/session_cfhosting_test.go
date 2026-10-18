package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v5"

	"github.com/cloudfoundry/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/cloudfoundryhosting"
	"github.com/cloudfoundry/stratos/src/jetstream/repository/sessionstore"
)

// TestCFHostedLoginWithDeadCookie runs the order a console deployed to Cloud
// Foundry uses: the hosting plugin's session middleware loads the session
// from the cookie before the login handler sets the user on it. A browser
// whose cookie names a session that is gone (signed out elsewhere, cleaned
// up after expiry) must still be able to sign in.
func TestCFHostedLoginWithDeadCookie(t *testing.T) {
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
	// The login handlers' session step.
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

	send := func(method, path string, cookie *http.Cookie) *httptest.ResponseRecorder {
		req := httptest.NewRequest(method, path, nil)
		if cookie != nil {
			req.AddCookie(cookie)
		}
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)
		return rec
	}
	sessionCookie := func(rec *httptest.ResponseRecorder) *http.Cookie {
		var last *http.Cookie
		for _, c := range rec.Result().Cookies() {
			if c.Name == "console-session" {
				last = c
			}
		}
		if last == nil {
			t.Fatal("response set no session cookie")
		}
		return last
	}

	first := sessionCookie(send(http.MethodPost, "/login", nil))
	if _, err := db.Exec("DELETE FROM sessions"); err != nil {
		t.Fatal(err)
	}

	again := sessionCookie(send(http.MethodPost, "/login", first))
	rec := send(http.MethodGet, "/whoami", again)
	if rec.Code != http.StatusOK || rec.Body.String() != "user-1" {
		t.Errorf("after signing in with a dead session cookie: %d %q, want 200 \"user-1\"", rec.Code, rec.Body.String())
	}
}

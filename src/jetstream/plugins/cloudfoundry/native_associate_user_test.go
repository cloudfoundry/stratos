// src/jetstream/plugins/cloudfoundry/native_associate_user_test.go
package cloudfoundry

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestAssociateUser_ResolvesThenCreates verifies the happy path: the handler
// resolves username+origin to a GUID via GET /v3/users, then POSTs
// {"guid":"..."} to /v3/users to associate the user with the foundation.
// It returns 200 with associated=true.
func TestAssociateUser_ResolvesThenCreates(t *testing.T) {
	var postedBody string
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.URL.Path == "/v3":
			_, _ = io.ReadAll(r.Body)
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.Method == http.MethodGet && r.URL.Path == "/v3/users":
			_, _ = io.ReadAll(r.Body)
			assert.Contains(t, r.URL.RawQuery, "usernames=alice")
			assert.Contains(t, r.URL.RawQuery, "origins=ldap")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_pages": 1},
				"resources":  []map[string]interface{}{{"guid": "u-1", "username": "alice", "origin": "ldap"}},
			})
		case r.Method == http.MethodPost && r.URL.Path == "/v3/users":
			b, _ := io.ReadAll(r.Body)
			postedBody = string(b)
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{"guid": "u-1", "username": "alice", "origin": "ldap"})
		default:
			_, _ = io.ReadAll(r.Body)
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPost, "/pp/v1/cf/users/cnsi-1/associate",
		`{"username":"alice","origin":"ldap"}`)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).associateUser(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, "u-1", resp["guid"])
	assert.Equal(t, true, resp["associated"])

	// Verify that the POST /v3/users body contains the resolved GUID.
	assert.Contains(t, postedBody, "u-1")
}

// TestAssociateUser_AlreadyAssociatedIsSuccess verifies that a 422 response
// from POST /v3/users (user already associated) is treated as a benign
// success — the handler returns 200 with associated=false.
func TestAssociateUser_AlreadyAssociatedIsSuccess(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.ReadAll(r.Body)
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.Method == http.MethodGet && r.URL.Path == "/v3/users":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_pages": 1},
				"resources":  []map[string]interface{}{{"guid": "u-2", "username": "bob", "origin": "uaa"}},
			})
		case r.Method == http.MethodPost && r.URL.Path == "/v3/users":
			// CF returns 422 when the user is already associated.
			w.WriteHeader(http.StatusUnprocessableEntity)
			_, _ = w.Write([]byte(`{"errors":[{"code":10008,"title":"CF-UnprocessableEntity","detail":"The user guid u-2 was taken"}]}`))
		default:
			http.NotFound(w, r)
		}
	}))

	defer ts.Close()

	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPost, "/pp/v1/cf/users/cnsi-1/associate",
		`{"username":"bob","origin":"uaa"}`)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).associateUser(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, "u-2", resp["guid"])
	assert.Equal(t, false, resp["associated"])
}

// TestAssociateUser_UserNotFound verifies that when findUserGUID returns
// "user not found", the handler returns 404 with a clear message.
func TestAssociateUser_UserNotFound(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.ReadAll(r.Body)
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.Method == http.MethodGet && r.URL.Path == "/v3/users":
			// Empty resources → findUserGUID returns "user not found: ghost".
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_pages": 1},
				"resources":  []map[string]interface{}{},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	ctx, _ := newPhase1CContext(e, http.MethodPost, "/pp/v1/cf/users/cnsi-1/associate",
		`{"username":"ghost","origin":"uaa"}`)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	err := newPhase1CPlugin(ts.URL).associateUser(ctx)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusNotFound, httpErr.Code)
	assert.Contains(t, httpErr.Message.(string), "ghost")
}

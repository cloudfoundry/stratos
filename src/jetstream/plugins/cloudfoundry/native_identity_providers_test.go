// src/jetstream/plugins/cloudfoundry/native_identity_providers_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestIdentityProviders_ListsOrigins verifies the happy path: the handler
// proxies UAA GET /identity-providers?active_only=true and projects each
// provider to {originKey, type, name, active}.
func TestIdentityProviders_ListsOrigins(t *testing.T) {
	uaaProviders := []map[string]interface{}{
		{"originKey": "uaa", "type": "internal", "name": "UAA", "active": true},
		{"originKey": "ldap", "type": "ldap", "name": "Corporate LDAP", "active": true},
	}
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/identity-providers" {
			assert.Equal(t, "true", r.URL.Query().Get("active_only"), "handler must pass active_only=true to UAA")
			assert.Contains(t, r.Header.Get("Authorization"), "bearer ", "handler must send bearer token")
			_ = json.NewEncoder(w).Encode(uaaProviders)
			return
		}
		http.NotFound(w, r)
	}))
	defer ts.Close()

	// Point AuthorizationEndpoint at the fake UAA server.
	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID: "user-1",
			cnsiRecord: api.CNSIRecord{
				GUID:                  "cnsi-1",
				APIEndpoint:           mustParseURL(ts.URL),
				AuthorizationEndpoint: ts.URL,
			},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/identity-providers/cnsi-1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetPathValues(echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}})

	require.NoError(t, plugin.getIdentityProviders(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var providers []identityProvider
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &providers))
	require.Len(t, providers, 2)
	assert.Equal(t, "uaa", providers[0].OriginKey)
	assert.Equal(t, "internal", providers[0].Type)
	assert.Equal(t, "UAA", providers[0].Name)
	assert.True(t, providers[0].Active)
	assert.Equal(t, "ldap", providers[1].OriginKey)
	assert.Equal(t, "ldap", providers[1].Type)
	assert.Equal(t, "Corporate LDAP", providers[1].Name)
	assert.True(t, providers[1].Active)
}

// idpNoTokenProxy is a mockNativeCFProxy whose user has no stored token.
type idpNoTokenProxy struct{ mockNativeCFProxy }

func (idpNoTokenProxy) GetCNSITokenRecord(_, _ string) (api.TokenRecord, bool) {
	return api.TokenRecord{}, false
}

// callIdentityProviders runs the handler against a fake UAA that answers
// /identity-providers with the given status and body.
func callIdentityProviders(t *testing.T, status int, body string, noToken bool) (*httptest.ResponseRecorder, error) {
	t.Helper()
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/identity-providers" {
			w.WriteHeader(status)
			_, _ = w.Write([]byte(body))
			return
		}
		http.NotFound(w, r)
	}))
	t.Cleanup(ts.Close)

	base := mockNativeCFProxy{
		userID: "user-1",
		cnsiRecord: api.CNSIRecord{
			GUID:                  "cnsi-1",
			APIEndpoint:           mustParseURL(ts.URL),
			AuthorizationEndpoint: ts.URL,
		},
		tokenRecord: api.TokenRecord{AuthToken: "test-token"},
	}
	plugin := &CloudFoundrySpecification{testProxy: &base}
	if noToken {
		plugin.testProxy = &idpNoTokenProxy{base}
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/identity-providers/cnsi-1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetPathValues(echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}})
	return rec, plugin.getIdentityProviders(ctx)
}

// TestIdentityProviders_UAA403AnswersEmptyList verifies that a UAA 403 (the
// user may not list providers) is answered with HTTP 200 and an empty list,
// so the browser logs no failed request.
func TestIdentityProviders_UAA403AnswersEmptyList(t *testing.T) {
	rec, err := callIdentityProviders(t, http.StatusForbidden,
		`{"error":"access_denied","error_description":"Insufficient scope"}`, false)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.JSONEq(t, "[]", rec.Body.String())
}

// TestIdentityProviders_UAAFailureIs502 verifies other UAA failures stay errors.
func TestIdentityProviders_UAAFailureIs502(t *testing.T) {
	_, err := callIdentityProviders(t, http.StatusInternalServerError, "boom", false)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok, "handler must return an echo.HTTPError")
	assert.Equal(t, http.StatusBadGateway, httpErr.Code)
}

// TestIdentityProviders_NoTokenIs403 verifies a user who is not connected to
// the endpoint still gets an error.
func TestIdentityProviders_NoTokenIs403(t *testing.T) {
	_, err := callIdentityProviders(t, http.StatusOK, "[]", true)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok, "handler must return an echo.HTTPError")
	assert.Equal(t, http.StatusForbidden, httpErr.Code)
}

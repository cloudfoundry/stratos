// src/jetstream/plugins/cloudfoundry/native_identity_providers_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
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
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

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

// TestIdentityProviders_403PassedThrough verifies that a 403 from UAA is
// propagated as HTTP 403 — the frontend degrades to a free-text origin field
// when it sees a 403.
func TestIdentityProviders_403PassedThrough(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/identity-providers" {
			w.WriteHeader(http.StatusForbidden)
			_, _ = w.Write([]byte(`{"error":"access_denied","error_description":"Insufficient scope"}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer ts.Close()

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
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	err := plugin.getIdentityProviders(ctx)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok, "handler must return an echo.HTTPError")
	assert.Equal(t, http.StatusForbidden, httpErr.Code)
}

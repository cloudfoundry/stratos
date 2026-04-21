// src/jetstream/plugins/cloudfoundry/native_apps_writes_test.go
package cloudfoundry

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestDeleteNativeApp_Forwards_v3_Apps_Delete verifies the handler issues a
// DELETE to /v3/apps/{guid} against the target CF foundation and surfaces a
// successful async-delete response as 202 Accepted to the Stratos-shape
// caller (matching what CF v3 returns natively).
func TestDeleteNativeApp_Forwards_v3_Apps_Delete(t *testing.T) {
	capiCalls := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		capiCalls++
		assert.Equal(t, http.MethodDelete, r.Method)
		assert.Equal(t, "/v3/apps/app-1", r.URL.Path)
		// CF v3 app delete returns 202 Accepted with a Location header for the async job
		w.Header().Set("Location", "/v3/jobs/delete-job-1")
		w.WriteHeader(http.StatusAccepted)
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/apps/cnsi-1/app-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")

	require.NoError(t, plugin.deleteNativeApp(c))
	assert.Equal(t, http.StatusAccepted, rec.Code)
	assert.Equal(t, 1, capiCalls)
}

// TestDeleteNativeApp_PropagatesCapiError verifies that when CF returns a
// non-2xx error envelope the Stratos handler surfaces an appropriate HTTP
// status and preserves the CF error body so upstream callers can diagnose
// the failure (e.g. ResourceNotFound).
func TestDeleteNativeApp_PropagatesCapiError(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(`{"errors":[{"code":10010,"title":"CF-ResourceNotFound","detail":"App not found"}]}`))
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/apps/cnsi-1/missing", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "missing")

	require.NoError(t, plugin.deleteNativeApp(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
	assert.Contains(t, rec.Body.String(), "ResourceNotFound")
}

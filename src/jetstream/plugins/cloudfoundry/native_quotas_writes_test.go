// src/jetstream/plugins/cloudfoundry/native_quotas_writes_test.go
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

// TestDeleteNativeOrgQuota_BareFallbackWhenAsyncUnwired verifies the
// handler issues a DELETE to /v3/organization_quotas/{guid} and, without
// stratosjobs wiring present, falls back to bare-202 behavior (same
// safety net as deleteNativeRoute). The async-job contract itself is
// exercised by the CFJobTranslator tests; this test pins the capi->CF
// transport + the fallback path, replacing the previous bare-204
// contract that swallowed the job reference.
func TestDeleteNativeOrgQuota_BareFallbackWhenAsyncUnwired(t *testing.T) {
	capiCalls := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		capiCalls++
		assert.Equal(t, http.MethodDelete, r.Method)
		assert.Equal(t, "/v3/organization_quotas/quota-1", r.URL.Path)
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
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/organization_quotas/cnsi-1/quota-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/organization_quotas/:cnsiGuid/:quotaGuid")
	c.SetParamNames("cnsiGuid", "quotaGuid")
	c.SetParamValues("cnsi-1", "quota-1")

	require.NoError(t, plugin.deleteNativeOrgQuota(c))
	assert.Equal(t, http.StatusAccepted, rec.Code)
	assert.Equal(t, 1, capiCalls)
}

// TestDeleteNativeOrgQuota_PropagatesCapiError verifies a non-2xx CF
// error flows through handleCapiError — the 422 quota-still-assigned
// case the consumer surfaces via snackbar.
func TestDeleteNativeOrgQuota_PropagatesCapiError(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		w.Write([]byte(`{"errors":[{"code":10008,"title":"CF-UnprocessableEntity","detail":"This quota is applied to one or more organizations."}]}`))
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
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/organization_quotas/cnsi-1/quota-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/organization_quotas/:cnsiGuid/:quotaGuid")
	c.SetParamNames("cnsiGuid", "quotaGuid")
	c.SetParamValues("cnsi-1", "quota-1")

	require.NoError(t, plugin.deleteNativeOrgQuota(c))
	assert.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	assert.Contains(t, rec.Body.String(), "UnprocessableEntity")
}

// TestDeleteNativeSpaceQuota_BareFallbackWhenAsyncUnwired pins the same
// transport + fallback contract for /v3/space_quotas/{guid}.
func TestDeleteNativeSpaceQuota_BareFallbackWhenAsyncUnwired(t *testing.T) {
	capiCalls := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		capiCalls++
		assert.Equal(t, http.MethodDelete, r.Method)
		assert.Equal(t, "/v3/space_quotas/squota-1", r.URL.Path)
		w.Header().Set("Location", "/v3/jobs/delete-job-2")
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
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/space_quotas/cnsi-1/squota-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/space_quotas/:cnsiGuid/:quotaGuid")
	c.SetParamNames("cnsiGuid", "quotaGuid")
	c.SetParamValues("cnsi-1", "squota-1")

	require.NoError(t, plugin.deleteNativeSpaceQuota(c))
	assert.Equal(t, http.StatusAccepted, rec.Code)
	assert.Equal(t, 1, capiCalls)
}

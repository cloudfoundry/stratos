// src/jetstream/plugins/cloudfoundry/native_stacks_reads_test.go
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

// TestGetNativeStacks_ReturnsMappedStacks verifies the handler drives a
// CAPI Stacks().List call and maps capi.Stack resources onto flat StStack
// DTOs. Stacks are read-only and small (typically <10 per foundation); a
// single page suffices for the common case but the handler still drains
// all pages defensively.
func TestGetNativeStacks_ReturnsMappedStacks(t *testing.T) {
	hits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/stacks" && r.Method == http.MethodGet:
			hits++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"pagination": {"total_results": 2, "total_pages": 1, "next": null},
				"resources": [
					{
						"guid":"stack-1",
						"created_at":"2026-04-22T12:00:00Z",
						"updated_at":"2026-04-22T12:00:00Z",
						"name":"cflinuxfs4",
						"description":"Cloud Foundry Linux-based filesystem (Ubuntu 22.04)",
						"build_rootfs_image":"cloudfoundry/cflinuxfs4",
						"run_rootfs_image":"cloudfoundry/cflinuxfs4",
						"default":true
					},
					{
						"guid":"stack-2",
						"created_at":"2026-04-22T12:05:00Z",
						"updated_at":"2026-04-22T12:05:00Z",
						"name":"windows",
						"description":"Windows stack",
						"default":false
					}
				]
			}`))
		default:
			http.NotFound(w, r)
		}
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/stacks/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/stacks/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeStacks(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, hits, "should make exactly one list call when single page")

	var resp StStacksResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	assert.Equal(t, 2, resp.TotalResults)

	s0 := resp.Resources[0]
	assert.Equal(t, "stack-1", s0.GUID)
	assert.Equal(t, "cflinuxfs4", s0.Name)
	assert.Equal(t, "Cloud Foundry Linux-based filesystem (Ubuntu 22.04)", s0.Description)
	assert.Equal(t, "cloudfoundry/cflinuxfs4", s0.BuildRootfsImage)
	assert.Equal(t, "cloudfoundry/cflinuxfs4", s0.RunRootfsImage)
	assert.True(t, s0.Default)
	assert.Equal(t, "cnsi-1", s0.CnsiGUID)
	assert.Equal(t, "2026-04-22T12:00:00Z", s0.CreatedAt)

	s1 := resp.Resources[1]
	assert.Equal(t, "stack-2", s1.GUID)
	assert.Equal(t, "windows", s1.Name)
	assert.False(t, s1.Default)
}

// TestGetNativeStacks_EmptyResult ensures the resources slice marshals as
// `[]` (not null) when CF returns no stacks. Frontend iterates without a
// nil guard.
func TestGetNativeStacks_EmptyResult(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/stacks" && r.Method == http.MethodGet:
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"pagination": {"total_results": 0, "total_pages": 1, "next": null},"resources":[]}`))
		default:
			http.NotFound(w, r)
		}
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/stacks/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/stacks/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeStacks(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	body := rec.Body.String()
	assert.Contains(t, body, `"resources":[]`, "empty resources must marshal as [] not null")
}

// TestGetNativeStacks_DrainsAllPages confirms the handler walks pagination
// links, accumulating resources across pages.
func TestGetNativeStacks_DrainsAllPages(t *testing.T) {
	hits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/stacks" && r.Method == http.MethodGet:
			hits++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			if r.URL.Query().Get("page") == "2" {
				w.Write([]byte(`{
					"pagination": {"total_results": 3, "total_pages": 2, "next": null},
					"resources": [{"guid":"stack-3","name":"third","description":"","default":false}]
				}`))
				return
			}
			w.Write([]byte(`{
				"pagination": {"total_results": 3, "total_pages": 2, "next": {"href": "/v3/stacks?page=2"}},
				"resources": [
					{"guid":"stack-1","name":"first","description":"","default":true},
					{"guid":"stack-2","name":"second","description":"","default":false}
				]
			}`))
		default:
			http.NotFound(w, r)
		}
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/stacks/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/stacks/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeStacks(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 2, hits, "should drain both pages")

	var resp StStacksResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 3)
	assert.Equal(t, 3, resp.TotalResults)
}

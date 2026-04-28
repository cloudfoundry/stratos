// src/jetstream/plugins/cloudfoundry/native_buildpacks_reads_test.go
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

// TestGetNativeBuildpacks_ReturnsMappedBuildpacks verifies the handler
// drives a CAPI Buildpacks().List call and maps capi.Buildpack resources
// onto flat StBuildpack DTOs. Buildpacks govern how source bundles get
// staged; the CF Buildpacks tab is read-only at this tier — uploads and
// reorders stay legacy until a use case warrants them.
func TestGetNativeBuildpacks_ReturnsMappedBuildpacks(t *testing.T) {
	hits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/buildpacks" && r.Method == http.MethodGet:
			hits++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"pagination": {"total_results": 2, "total_pages": 1, "next": null},
				"resources": [
					{
						"guid":"bp-1",
						"created_at":"2026-04-22T12:00:00Z",
						"updated_at":"2026-04-22T12:00:00Z",
						"name":"java_buildpack",
						"state":"READY",
						"filename":"java_buildpack-cached-cflinuxfs4-v4.50.tgz",
						"stack":"cflinuxfs4",
						"position":1,
						"lifecycle":"buildpack",
						"enabled":true,
						"locked":false
					},
					{
						"guid":"bp-2",
						"created_at":"2026-04-22T12:05:00Z",
						"updated_at":"2026-04-22T12:05:00Z",
						"name":"go_buildpack",
						"state":"AWAITING_UPLOAD",
						"filename":null,
						"stack":null,
						"position":2,
						"lifecycle":"buildpack",
						"enabled":false,
						"locked":true
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/buildpacks/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/buildpacks/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeBuildpacks(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, hits, "should make exactly one list call when single page")

	var resp StBuildpacksResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	assert.Equal(t, 2, resp.TotalResults)

	b0 := resp.Resources[0]
	assert.Equal(t, "bp-1", b0.GUID)
	assert.Equal(t, "java_buildpack", b0.Name)
	assert.Equal(t, "READY", b0.State)
	assert.Equal(t, "java_buildpack-cached-cflinuxfs4-v4.50.tgz", b0.Filename)
	assert.Equal(t, "cflinuxfs4", b0.Stack)
	assert.Equal(t, 1, b0.Position)
	assert.Equal(t, "buildpack", b0.Lifecycle)
	assert.True(t, b0.Enabled)
	assert.False(t, b0.Locked)
	assert.Equal(t, "cnsi-1", b0.CnsiGUID)
	assert.Equal(t, "2026-04-22T12:00:00Z", b0.CreatedAt)

	b1 := resp.Resources[1]
	assert.Equal(t, "bp-2", b1.GUID)
	assert.Equal(t, "go_buildpack", b1.Name)
	assert.Equal(t, "AWAITING_UPLOAD", b1.State)
	assert.Equal(t, "", b1.Filename, "null filename must marshal as empty string")
	assert.Equal(t, "", b1.Stack, "null stack must marshal as empty string")
	assert.False(t, b1.Enabled)
	assert.True(t, b1.Locked)
}

// TestGetNativeBuildpacks_EmptyResult ensures the resources slice
// marshals as `[]` (not null) when CF returns no buildpacks.
func TestGetNativeBuildpacks_EmptyResult(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/buildpacks" && r.Method == http.MethodGet:
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/buildpacks/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/buildpacks/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeBuildpacks(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	body := rec.Body.String()
	assert.Contains(t, body, `"resources":[]`, "empty resources must marshal as [] not null")
}

// TestGetNativeBuildpacks_DrainsAllPages confirms the handler walks
// pagination links, accumulating resources across pages.
func TestGetNativeBuildpacks_DrainsAllPages(t *testing.T) {
	hits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/buildpacks" && r.Method == http.MethodGet:
			hits++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			if r.URL.Query().Get("page") == "2" {
				w.Write([]byte(`{
					"pagination": {"total_results": 3, "total_pages": 2, "next": null},
					"resources": [{"guid":"bp-3","name":"third","state":"READY","position":3,"lifecycle":"buildpack","enabled":true,"locked":false}]
				}`))
				return
			}
			w.Write([]byte(`{
				"pagination": {"total_results": 3, "total_pages": 2, "next": {"href": "/v3/buildpacks?page=2"}},
				"resources": [
					{"guid":"bp-1","name":"first","state":"READY","position":1,"lifecycle":"buildpack","enabled":true,"locked":false},
					{"guid":"bp-2","name":"second","state":"READY","position":2,"lifecycle":"buildpack","enabled":true,"locked":false}
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/buildpacks/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/buildpacks/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeBuildpacks(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 2, hits, "should drain both pages")

	var resp StBuildpacksResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 3)
	assert.Equal(t, 3, resp.TotalResults)
}

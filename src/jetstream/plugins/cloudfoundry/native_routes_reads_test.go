// src/jetstream/plugins/cloudfoundry/native_routes_reads_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestGetAppRoutes_ReturnsMappedRoutes verifies the handler drives the
// CAPI List(routes, app_guids=<app>) call and maps the resulting
// capi.Route resources onto flat Stratos StRoute DTOs, preserving the
// CF-rendered URL plus host/path/port/domainGuid/spaceGuid relationships.
func TestGetAppRoutes_ReturnsMappedRoutes(t *testing.T) {
	hits := 0
	var capturedQuery string
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/routes" && r.Method == http.MethodGet:
			hits++
			capturedQuery = r.URL.RawQuery
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"pagination": {"total_results": 2, "total_pages": 1, "next": null},
				"resources": [
					{
						"guid":"route-1",
						"created_at":"2026-04-22T12:00:00Z",
						"updated_at":"2026-04-22T12:00:00Z",
						"protocol":"http",
						"host":"sample-go-app-e2e-1",
						"path":"",
						"port":null,
						"url":"sample-go-app-e2e-1.run.adepttech.ca",
						"relationships": {
							"space": {"data": {"guid": "space-1"}},
							"domain": {"data": {"guid": "domain-1"}}
						}
					},
					{
						"guid":"route-2",
						"created_at":"2026-04-22T12:05:00Z",
						"updated_at":"2026-04-22T12:05:00Z",
						"protocol":"http",
						"host":"sample-go-app-e2e-2",
						"path":"/api",
						"port":null,
						"url":"sample-go-app-e2e-2.run.adepttech.ca/api",
						"relationships": {
							"space": {"data": {"guid": "space-1"}},
							"domain": {"data": {"guid": "domain-1"}}
						}
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/cnsi-1/app-1/routes", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/routes")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")

	require.NoError(t, plugin.getAppRoutes(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, hits, "should make exactly one list call when single page")
	assert.Contains(t, capturedQuery, "app_guids=app-1", "must filter by app_guids")

	var resp StAppRoutesResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	assert.Equal(t, 2, resp.TotalResults)

	r0 := resp.Resources[0]
	assert.Equal(t, "route-1", r0.GUID)
	assert.Equal(t, "sample-go-app-e2e-1.run.adepttech.ca", r0.URL)
	assert.Equal(t, "sample-go-app-e2e-1", r0.Host)
	assert.Equal(t, "", r0.Path)
	assert.Nil(t, r0.Port)
	assert.Equal(t, "domain-1", r0.DomainGUID)
	assert.Equal(t, "space-1", r0.SpaceGUID)

	r1 := resp.Resources[1]
	assert.Equal(t, "route-2", r1.GUID)
	assert.Equal(t, "/api", r1.Path)
	assert.Equal(t, "sample-go-app-e2e-2.run.adepttech.ca/api", r1.URL)
}

// TestGetAppRoutes_EmptyResult verifies the handler returns an empty
// (not null) resources array when CF returns no routes for the app. The
// JSON contract matters: frontend pickers iterate the array without a
// nil guard, and Go marshals nil slices as "null" unless we pre-allocate.
func TestGetAppRoutes_EmptyResult(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/routes" && r.Method == http.MethodGet:
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/cnsi-1/app-1/routes", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/routes")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")

	require.NoError(t, plugin.getAppRoutes(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	// Body must render "resources":[] (not null) so frontend can iterate safely.
	body := rec.Body.String()
	assert.True(t, strings.Contains(body, `"resources":[]`), "expected empty array, got: %s", body)
}

// TestGetAppRoutes_PropagatesError verifies a non-2xx from CAPI flows through
// handleCapiError — the handler returns an error (not 200) and does not
// swallow CF's failure.
func TestGetAppRoutes_PropagatesError(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/routes" && r.Method == http.MethodGet:
			w.WriteHeader(http.StatusForbidden)
			w.Write([]byte(`{"errors":[{"code":10008,"title":"CF-NotAuthorized","detail":"no"}]}`))
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/cnsi-1/app-1/routes", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/routes")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")

	// handleCapiError writes the upstream status directly and returns nil;
	// the caller propagates by reflecting the error response to the UI.
	require.NoError(t, plugin.getAppRoutes(c))
	assert.Equal(t, http.StatusForbidden, rec.Code)
	assert.Contains(t, rec.Body.String(), "CF-NotAuthorized")
}

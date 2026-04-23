// src/jetstream/plugins/cloudfoundry/native_routes_writes_test.go
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

// TestDeleteNativeRoute_BareFallbackWhenAsyncUnwired verifies the handler
// issues a DELETE to /v3/routes/{guid} and, without stratosjobs wiring
// present, falls back to bare-202 behavior (same safety net as
// deleteNativeApp). The async-job contract itself is exercised by the
// CFJobTranslator tests; this test pins the capi->CF transport + the
// fallback path.
func TestDeleteNativeRoute_BareFallbackWhenAsyncUnwired(t *testing.T) {
	capiCalls := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		capiCalls++
		assert.Equal(t, http.MethodDelete, r.Method)
		assert.Equal(t, "/v3/routes/route-1", r.URL.Path)
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
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/routes/cnsi-1/route-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/routes/:cnsiGuid/:routeGuid")
	c.SetParamNames("cnsiGuid", "routeGuid")
	c.SetParamValues("cnsi-1", "route-1")

	require.NoError(t, plugin.deleteNativeRoute(c))
	assert.Equal(t, http.StatusAccepted, rec.Code)
	assert.Equal(t, 1, capiCalls)
}

// TestDeleteNativeRoute_PropagatesCapiError verifies a non-2xx CF error
// flows through handleCapiError (upstream status mirrored to the caller,
// CF error envelope preserved in the body).
func TestDeleteNativeRoute_PropagatesCapiError(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(`{"errors":[{"code":10010,"title":"CF-ResourceNotFound","detail":"Route not found"}]}`))
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
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/routes/cnsi-1/missing", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/routes/:cnsiGuid/:routeGuid")
	c.SetParamNames("cnsiGuid", "routeGuid")
	c.SetParamValues("cnsi-1", "missing")

	require.NoError(t, plugin.deleteNativeRoute(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
	assert.Contains(t, rec.Body.String(), "ResourceNotFound")
}


// TestUnmapRouteFromApp_FindsDestinationAndDeletes verifies the handler
// issues a GET to /v3/routes/{routeGuid}/destinations, finds the destination
// whose app.guid matches the appGuid path parameter, and then issues a
// DELETE to /v3/routes/{routeGuid}/destinations/{destGuid}. The capi
// RemoveDestination returns nil on CF's 204 No Content — the handler
// mirrors that status to the Stratos-shape caller.
func TestUnmapRouteFromApp_FindsDestinationAndDeletes(t *testing.T) {
	listHits := 0
	deleteHits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/routes/route-1/destinations" && r.Method == http.MethodGet:
			listHits++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"destinations":[{"guid":"dest-1","app":{"guid":"app-1"}},{"guid":"dest-2","app":{"guid":"app-2"}}],"links":{}}`))
		case r.URL.Path == "/v3/routes/route-1/destinations/dest-1" && r.Method == http.MethodDelete:
			deleteHits++
			w.WriteHeader(http.StatusNoContent)
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
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/routes/cnsi-1/route-1/apps/app-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/routes/:cnsiGuid/:routeGuid/apps/:appGuid")
	c.SetParamNames("cnsiGuid", "routeGuid", "appGuid")
	c.SetParamValues("cnsi-1", "route-1", "app-1")

	require.NoError(t, plugin.unmapRouteFromApp(c))
	assert.Equal(t, http.StatusNoContent, rec.Code)
	assert.Equal(t, 1, listHits)
	assert.Equal(t, 1, deleteHits)
}

// TestUnmapRouteFromApp_NotFoundIfAppNotBound verifies that if the destination
// list does not contain a binding for the requested app, the handler returns
// 404 Not Found *without* issuing a DELETE to CAPI. The partial-state shape
// "list succeeded, nothing to delete" is a semantic 404 because the resource
// being targeted (the mapping) does not exist.
func TestUnmapRouteFromApp_NotFoundIfAppNotBound(t *testing.T) {
	deleteHits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/routes/route-1/destinations" && r.Method == http.MethodGet:
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"destinations":[{"guid":"dest-2","app":{"guid":"app-2"}}],"links":{}}`))
		case r.Method == http.MethodDelete:
			deleteHits++
			w.WriteHeader(http.StatusNoContent)
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
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/routes/cnsi-1/route-1/apps/app-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/routes/:cnsiGuid/:routeGuid/apps/:appGuid")
	c.SetParamNames("cnsiGuid", "routeGuid", "appGuid")
	c.SetParamValues("cnsi-1", "route-1", "app-1")

	err := plugin.unmapRouteFromApp(c)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok, "expected *echo.HTTPError, got %T", err)
	assert.Equal(t, http.StatusNotFound, httpErr.Code)
	assert.Equal(t, 0, deleteHits, "no DELETE should be issued when no matching destination is found")
}

// TestUnmapRouteFromApp_PropagatesListError verifies that a non-2xx from the
// upstream destinations-list endpoint is classified via handleCapiError — the
// handler surfaces the CF error body and no DELETE is attempted. We use 404
// (which the capi client does not retry) to exercise the error-propagation
// path deterministically without depending on retry behaviour.
func TestUnmapRouteFromApp_PropagatesListError(t *testing.T) {
	deleteHits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/routes/route-1/destinations" && r.Method == http.MethodGet:
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`{"errors":[{"code":10010,"title":"CF-ResourceNotFound","detail":"Route not found"}]}`))
		case r.Method == http.MethodDelete:
			deleteHits++
			w.WriteHeader(http.StatusNoContent)
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
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/routes/cnsi-1/route-1/apps/app-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/routes/:cnsiGuid/:routeGuid/apps/:appGuid")
	c.SetParamNames("cnsiGuid", "routeGuid", "appGuid")
	c.SetParamValues("cnsi-1", "route-1", "app-1")

	require.NoError(t, plugin.unmapRouteFromApp(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
	assert.Contains(t, rec.Body.String(), "ResourceNotFound")
	assert.Equal(t, 0, deleteHits, "no DELETE should be attempted when the list call fails")
}

// TestUnmapRouteFromApp_PropagatesDeleteError verifies that a non-2xx from the
// destination DELETE (e.g. a transient CF 422) is classified via
// handleCapiError after the list succeeded and a matching destination was
// found.
func TestUnmapRouteFromApp_PropagatesDeleteError(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/routes/route-1/destinations" && r.Method == http.MethodGet:
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"destinations":[{"guid":"dest-1","app":{"guid":"app-1"}}],"links":{}}`))
		case r.URL.Path == "/v3/routes/route-1/destinations/dest-1" && r.Method == http.MethodDelete:
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnprocessableEntity)
			w.Write([]byte(`{"errors":[{"code":10008,"title":"CF-UnprocessableEntity","detail":"destination locked"}]}`))
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
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/routes/cnsi-1/route-1/apps/app-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/routes/:cnsiGuid/:routeGuid/apps/:appGuid")
	c.SetParamNames("cnsiGuid", "routeGuid", "appGuid")
	c.SetParamValues("cnsi-1", "route-1", "app-1")

	require.NoError(t, plugin.unmapRouteFromApp(c))
	assert.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	assert.Contains(t, rec.Body.String(), "UnprocessableEntity")
}

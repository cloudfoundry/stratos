// src/jetstream/plugins/cloudfoundry/native_routes_bulk_writes_test.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// newBulkTestPlugin wires a CloudFoundrySpecification at the given capi
// server URL using the same mockNativeCFProxy shape as the sibling
// native_routes_writes tests.
func newBulkTestPlugin(capiURL string) *CloudFoundrySpecification {
	return &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiURL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}
}

// newBulkContext builds an echo context for a POST bulk endpoint with the
// given body and path params.
func newBulkContext(path string, body string, paramNames, paramValues []string) (echo.Context, *httptest.ResponseRecorder) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1"+strings.NewReplacer(":cnsiGuid", paramValues[0]).Replace(path), strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1" + path)
	c.SetParamNames(paramNames...)
	c.SetParamValues(paramValues...)
	return c, rec
}

// TestBulkDeleteNativeRoutes_HappyPath verifies the handler issues one
// DELETE /v3/routes/{guid} per requested guid, and — with the async-job
// contract unwired, the tests' standing fallback — reports every accepted
// delete as PENDING (no job) inside a 200 BulkResult envelope, in input
// order.
func TestBulkDeleteNativeRoutes_HappyPath(t *testing.T) {
	var mu sync.Mutex
	deleted := map[string]int{}
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		require.Equal(t, http.MethodDelete, r.Method)
		require.True(t, strings.HasPrefix(r.URL.Path, "/v3/routes/"), "unexpected path %s", r.URL.Path)
		guid := strings.TrimPrefix(r.URL.Path, "/v3/routes/")
		mu.Lock()
		deleted[guid]++
		mu.Unlock()
		w.Header().Set("Location", "/v3/jobs/job-"+guid)
		w.WriteHeader(http.StatusAccepted)
	}))
	defer capiServer.Close()

	plugin := newBulkTestPlugin(capiServer.URL)
	c, rec := newBulkContext("/cf/routes/:cnsiGuid/bulk/delete",
		`{"guids":["route-1","route-2","route-3"]}`,
		[]string{"cnsiGuid"}, []string{"cnsi-1"})

	require.NoError(t, plugin.bulkDeleteNativeRoutes(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, stratosSchemaVersion, rec.Header().Get("X-Stratos-Schema-Version"))

	assert.Equal(t, map[string]int{"route-1": 1, "route-2": 1, "route-3": 1}, deleted)

	var result BulkResult
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &result))
	require.Len(t, result.Results, 3)
	for i, guid := range []string{"route-1", "route-2", "route-3"} {
		assert.Equal(t, guid, result.Results[i].GUID, "input order must be preserved")
		assert.Equal(t, bulkStatePending, result.Results[i].State)
		assert.Nil(t, result.Results[i].Job, "unwired-async fallback carries no handoff job")
		assert.Empty(t, result.Results[i].Errors)
	}
	assert.Equal(t, 0, result.Succeeded)
	assert.Equal(t, 0, result.Failed)
	assert.Equal(t, 3, result.Pending)
}

// TestBulkDeleteNativeRoutes_PartialFailure verifies a CF 404 on one guid
// marks only that item FAILED — with the CF error envelope's title/detail
// mapped into the per-item errors — while the other items proceed
// unaffected and input order is preserved.
func TestBulkDeleteNativeRoutes_PartialFailure(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		if r.URL.Path == "/v3/routes/missing" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`{"errors":[{"code":10010,"title":"CF-ResourceNotFound","detail":"Route not found"}]}`))
			return
		}
		w.Header().Set("Location", "/v3/jobs/job-1")
		w.WriteHeader(http.StatusAccepted)
	}))
	defer capiServer.Close()

	plugin := newBulkTestPlugin(capiServer.URL)
	c, rec := newBulkContext("/cf/routes/:cnsiGuid/bulk/delete",
		`{"guids":["route-1","missing","route-3"]}`,
		[]string{"cnsiGuid"}, []string{"cnsi-1"})

	require.NoError(t, plugin.bulkDeleteNativeRoutes(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var result BulkResult
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &result))
	require.Len(t, result.Results, 3)

	assert.Equal(t, "route-1", result.Results[0].GUID)
	assert.Equal(t, bulkStatePending, result.Results[0].State)

	assert.Equal(t, "missing", result.Results[1].GUID)
	assert.Equal(t, bulkStateFailed, result.Results[1].State)
	require.NotEmpty(t, result.Results[1].Errors)
	assert.Equal(t, "CF-ResourceNotFound", result.Results[1].Errors[0].Code)
	assert.Contains(t, result.Results[1].Errors[0].Message, "Route not found")

	assert.Equal(t, "route-3", result.Results[2].GUID)
	assert.Equal(t, bulkStatePending, result.Results[2].State)

	assert.Equal(t, 0, result.Succeeded)
	assert.Equal(t, 1, result.Failed)
	assert.Equal(t, 2, result.Pending)
}

// TestBulkUnmapNativeRoutes verifies the handler issues a synchronous
// PATCH /v3/routes/{guid}/destinations with body {"destinations":[]} per
// guid, and every successful replace is reported COMPLETE in a 200
// BulkResult envelope.
func TestBulkUnmapNativeRoutes(t *testing.T) {
	var mu sync.Mutex
	patched := map[string]string{}
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		require.Equal(t, http.MethodPatch, r.Method)
		require.True(t, strings.HasSuffix(r.URL.Path, "/destinations"), "unexpected path %s", r.URL.Path)
		guid := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, "/v3/routes/"), "/destinations")
		body, _ := io.ReadAll(r.Body)
		mu.Lock()
		patched[guid] = string(body)
		mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"destinations":[]}`))
	}))
	defer capiServer.Close()

	plugin := newBulkTestPlugin(capiServer.URL)
	c, rec := newBulkContext("/cf/routes/:cnsiGuid/bulk/unmap",
		`{"guids":["route-1","route-2"]}`,
		[]string{"cnsiGuid"}, []string{"cnsi-1"})

	require.NoError(t, plugin.bulkUnmapNativeRoutes(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	require.Len(t, patched, 2)
	for guid, body := range patched {
		assert.JSONEq(t, `{"destinations":[]}`, body, "guid %s", guid)
	}

	var result BulkResult
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &result))
	require.Len(t, result.Results, 2)
	for i, guid := range []string{"route-1", "route-2"} {
		assert.Equal(t, guid, result.Results[i].GUID)
		assert.Equal(t, bulkStateComplete, result.Results[i].State)
	}
	assert.Equal(t, 2, result.Succeeded)
	assert.Equal(t, 0, result.Failed)
	assert.Equal(t, 0, result.Pending)
}

// TestUnmapAllRouteDestinations verifies the single-route endpoint issues
// one PATCH /v3/routes/{routeGuid}/destinations with body
// {"destinations":[]} and mirrors success as 204 No Content.
func TestUnmapAllRouteDestinations(t *testing.T) {
	patchHits := 0
	var patchBody string
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		require.Equal(t, http.MethodPatch, r.Method)
		require.Equal(t, "/v3/routes/route-1/destinations", r.URL.Path)
		patchHits++
		body, _ := io.ReadAll(r.Body)
		patchBody = string(body)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"destinations":[]}`))
	}))
	defer capiServer.Close()

	plugin := newBulkTestPlugin(capiServer.URL)
	c, rec := newBulkContext("/cf/routes/:cnsiGuid/:routeGuid/unmap_all", "",
		[]string{"cnsiGuid", "routeGuid"}, []string{"cnsi-1", "route-1"})

	require.NoError(t, plugin.unmapAllRouteDestinations(c))
	assert.Equal(t, http.StatusNoContent, rec.Code)
	assert.Equal(t, 1, patchHits)
	assert.JSONEq(t, `{"destinations":[]}`, patchBody)
}

// TestUnmapAllRouteDestinations_PropagatesCapiError verifies an upstream
// CF error flows through handleCapiError (status mirrored, envelope
// preserved) rather than surfacing as a bare 500.
func TestUnmapAllRouteDestinations_PropagatesCapiError(t *testing.T) {
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

	plugin := newBulkTestPlugin(capiServer.URL)
	c, rec := newBulkContext("/cf/routes/:cnsiGuid/:routeGuid/unmap_all", "",
		[]string{"cnsiGuid", "routeGuid"}, []string{"cnsi-1", "missing"})

	require.NoError(t, plugin.unmapAllRouteDestinations(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
	assert.Contains(t, rec.Body.String(), "ResourceNotFound")
}

// TestBulkRoutes_Validation verifies the shared body validation: empty
// guids and oversized (> bulkMaxItems) guids both reject with 400 before
// any CF call is made.
func TestBulkRoutes_Validation(t *testing.T) {
	capiHits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capiHits++
		http.NotFound(w, r)
	}))
	defer capiServer.Close()

	tooMany := make([]string, bulkMaxItems+1)
	for i := range tooMany {
		tooMany[i] = fmt.Sprintf("route-%d", i)
	}
	tooManyBody, err := json.Marshal(map[string][]string{"guids": tooMany})
	require.NoError(t, err)

	cases := []struct {
		name string
		body string
	}{
		{"empty guids", `{"guids":[]}`},
		{"missing guids", `{}`},
		{"too many guids", string(tooManyBody)},
	}

	handlers := map[string]func(*CloudFoundrySpecification) echo.HandlerFunc{
		"delete": func(p *CloudFoundrySpecification) echo.HandlerFunc { return p.bulkDeleteNativeRoutes },
		"unmap":  func(p *CloudFoundrySpecification) echo.HandlerFunc { return p.bulkUnmapNativeRoutes },
	}

	for action, handler := range handlers {
		for _, tc := range cases {
			t.Run(action+"/"+tc.name, func(t *testing.T) {
				plugin := newBulkTestPlugin(capiServer.URL)
				c, _ := newBulkContext("/cf/routes/:cnsiGuid/bulk/"+action, tc.body,
					[]string{"cnsiGuid"}, []string{"cnsi-1"})

				err := handler(plugin)(c)
				require.Error(t, err)
				httpErr, ok := err.(*echo.HTTPError)
				require.True(t, ok, "expected *echo.HTTPError, got %T", err)
				assert.Equal(t, http.StatusBadRequest, httpErr.Code)
			})
		}
	}
	assert.Equal(t, 0, capiHits, "validation must reject before any CF call")
}

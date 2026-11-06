// src/jetstream/plugins/cloudfoundry/native_apps_bulk_writes_test.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestBulkDeleteNativeApps_HappyPath verifies the handler issues one
// DELETE /v3/apps/{guid} per requested guid, and — with the async-job
// contract unwired, the tests' standing fallback — reports every accepted
// delete as PENDING (no job) inside a 200 BulkResult envelope, in input
// order.
func TestBulkDeleteNativeApps_HappyPath(t *testing.T) {
	var mu sync.Mutex
	deleted := map[string]int{}
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		require.Equal(t, http.MethodDelete, r.Method)
		require.True(t, strings.HasPrefix(r.URL.Path, "/v3/apps/"), "unexpected path %s", r.URL.Path)
		guid := strings.TrimPrefix(r.URL.Path, "/v3/apps/")
		mu.Lock()
		deleted[guid]++
		mu.Unlock()
		w.Header().Set("Location", "/v3/jobs/job-"+guid)
		w.WriteHeader(http.StatusAccepted)
	}))
	defer capiServer.Close()

	plugin := newBulkTestPlugin(capiServer.URL)
	c, rec := newBulkContext("/cf/apps/:cnsiGuid/bulk/delete",
		`{"guids":["app-1","app-2","app-3"]}`,
		[]string{"cnsiGuid"}, []string{"cnsi-1"})

	require.NoError(t, plugin.bulkDeleteNativeApps(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, stratosSchemaVersion, rec.Header().Get("X-Stratos-Schema-Version"))

	assert.Equal(t, map[string]int{"app-1": 1, "app-2": 1, "app-3": 1}, deleted)

	var result BulkResult
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &result))
	require.Len(t, result.Results, 3)
	for i, guid := range []string{"app-1", "app-2", "app-3"} {
		assert.Equal(t, guid, result.Results[i].GUID, "input order must be preserved")
		assert.Equal(t, bulkStatePending, result.Results[i].State)
		assert.Nil(t, result.Results[i].Job, "unwired-async fallback carries no handoff job")
		assert.Empty(t, result.Results[i].Errors)
	}
	assert.Equal(t, 0, result.Succeeded)
	assert.Equal(t, 0, result.Failed)
	assert.Equal(t, 3, result.Pending)
}

// TestBulkDeleteNativeApps_PartialFailure verifies a CF 404 on one guid
// marks only that item FAILED — with the CF error envelope's title/detail
// mapped into the per-item errors — while the other items proceed
// unaffected and input order is preserved.
func TestBulkDeleteNativeApps_PartialFailure(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		if r.URL.Path == "/v3/apps/missing" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`{"errors":[{"code":10010,"title":"CF-ResourceNotFound","detail":"App not found"}]}`))
			return
		}
		w.Header().Set("Location", "/v3/jobs/job-1")
		w.WriteHeader(http.StatusAccepted)
	}))
	defer capiServer.Close()

	plugin := newBulkTestPlugin(capiServer.URL)
	c, rec := newBulkContext("/cf/apps/:cnsiGuid/bulk/delete",
		`{"guids":["app-1","missing","app-3"]}`,
		[]string{"cnsiGuid"}, []string{"cnsi-1"})

	require.NoError(t, plugin.bulkDeleteNativeApps(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var result BulkResult
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &result))
	require.Len(t, result.Results, 3)

	assert.Equal(t, "app-1", result.Results[0].GUID)
	assert.Equal(t, bulkStatePending, result.Results[0].State)

	assert.Equal(t, "missing", result.Results[1].GUID)
	assert.Equal(t, bulkStateFailed, result.Results[1].State)
	require.NotEmpty(t, result.Results[1].Errors)
	assert.Equal(t, "CF-ResourceNotFound", result.Results[1].Errors[0].Code)
	assert.Contains(t, result.Results[1].Errors[0].Message, "App not found")

	assert.Equal(t, "app-3", result.Results[2].GUID)
	assert.Equal(t, bulkStatePending, result.Results[2].State)

	assert.Equal(t, 0, result.Succeeded)
	assert.Equal(t, 1, result.Failed)
	assert.Equal(t, 2, result.Pending)
}

// TestBulkDeleteNativeApps_Validation verifies the shared body validation:
// empty guids and oversized (> bulkMaxItems) guids both reject with 400
// before any CF call is made.
func TestBulkDeleteNativeApps_Validation(t *testing.T) {
	capiHits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capiHits++
		http.NotFound(w, r)
	}))
	defer capiServer.Close()

	tooMany := make([]string, bulkMaxItems+1)
	for i := range tooMany {
		tooMany[i] = fmt.Sprintf("app-%d", i)
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

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			plugin := newBulkTestPlugin(capiServer.URL)
			c, _ := newBulkContext("/cf/apps/:cnsiGuid/bulk/delete", tc.body,
				[]string{"cnsiGuid"}, []string{"cnsi-1"})

			err := plugin.bulkDeleteNativeApps(c)
			require.Error(t, err)
			httpErr, ok := err.(*echo.HTTPError)
			require.True(t, ok, "expected *echo.HTTPError, got %T", err)
			assert.Equal(t, http.StatusBadRequest, httpErr.Code)
		})
	}
	assert.Equal(t, 0, capiHits, "validation must reject before any CF call")
}

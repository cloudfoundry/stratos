// src/jetstream/plugins/cloudfoundry/native_apps_stats_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Process list carrying the app relationship the batch handler needs to key
// each web process back to its app GUID (the single-app lookup doesn't).
const stubProcessListWithAppRelJSON = `{
	"pagination":{"total_results":1,"total_pages":1},
	"resources":[{"guid":"proc-1","type":"web","instances":2,"relationships":{"app":{"data":{"guid":"app-1"}}}}]
}`

// 401 body shaped like a CF auth-token rejection.
const stubUnauthorizedJSON = `{"errors":[{"code":1000,"title":"CF-InvalidAuthToken","detail":"Invalid Auth Token"}]}`

const stubProcessListJSON = `{
	"pagination":{"total_results":1,"total_pages":1},
	"resources":[{"guid":"proc-1","type":"web","instances":2}]
}`

const stubProcessStatsJSON = `{
	"resources":[
		{
			"type":"web","index":0,"state":"RUNNING",
			"usage":{"time":"2026-05-03T00:00:00Z","cpu":0.42,"mem":134217728,"disk":536870912,"log_rate":1024},
			"host":"10.0.0.1",
			"uptime":12345,
			"mem_quota":268435456,
			"disk_quota":1073741824,
			"fds_quota":16384
		},
		{
			"type":"web","index":1,"state":"CRASHED"
		}
	]
}`

func TestGetAppStats_FullShapePreservesUsageQuotasUptime(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/processes":
			_, _ = w.Write([]byte(stubProcessListJSON))
		case "/v3/processes/proc-1/stats":
			_, _ = w.Write([]byte(stubProcessStatsJSON))
		default:
			http.NotFound(w, r)
		}
	})
	ts := httptest.NewServer(mux)
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/app-stats/cnsi-1/app-1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "appGuid")
	ctx.SetParamValues("cnsi-1", "app-1")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getAppStats(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StAppStatsResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	require.Len(t, resp.Instances, 2)

	// RUNNING instance carries the full payload — auto-scaler / app-monitor
	// consumers read these fields and would compute zeros if the wire shape
	// silently dropped them.
	r0 := resp.Instances[0]
	assert.Equal(t, 0, r0.Index)
	assert.Equal(t, "RUNNING", r0.State)
	assert.Equal(t, 12345, r0.Uptime)
	assert.Equal(t, int64(268435456), r0.MemQuota)
	assert.Equal(t, int64(1073741824), r0.DiskQuota)
	assert.Equal(t, 16384, r0.FdsQuota)
	assert.Equal(t, "10.0.0.1", r0.Host)
	require.NotNil(t, r0.Usage)
	assert.InDelta(t, 0.42, r0.Usage.CPU, 0.0001)
	assert.Equal(t, int64(134217728), r0.Usage.Mem)
	assert.Equal(t, int64(536870912), r0.Usage.Disk)
	assert.Equal(t, "2026-05-03T00:00:00Z", r0.Usage.Time)

	// CRASHED instance has no usage block — wire shape omits the field
	// (omitempty on the Go struct), JSON unmarshal leaves the pointer nil.
	r1 := resp.Instances[1]
	assert.Equal(t, "CRASHED", r1.State)
	assert.Nil(t, r1.Usage)
}

// A poll that fires just before the ~20-minute CF token expires reaches CF
// after the token has lapsed and is 401'd. getAppStats must rebuild the client
// (refreshing the token) and replay the stats call once, returning 200 instead
// of bubbling the 401 to the app-detail page every token cycle.
func TestGetAppStats_RetriesOnceOn401(t *testing.T) {
	var statsCalls int32
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/processes":
			_, _ = w.Write([]byte(stubProcessListJSON))
		case "/v3/processes/proc-1/stats":
			if atomic.AddInt32(&statsCalls, 1) == 1 {
				w.WriteHeader(http.StatusUnauthorized)
				_, _ = w.Write([]byte(stubUnauthorizedJSON))
				return
			}
			_, _ = w.Write([]byte(stubProcessStatsJSON))
		default:
			http.NotFound(w, r)
		}
	})
	ts := httptest.NewServer(mux)
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/app-stats/cnsi-1/app-1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "appGuid")
	ctx.SetParamValues("cnsi-1", "app-1")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getAppStats(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	// Exactly one replay — the 401 path retries once, no more.
	assert.Equal(t, int32(2), atomic.LoadInt32(&statsCalls))

	var resp StAppStatsResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	require.Len(t, resp.Instances, 2)
}

// The batched endpoint retries on a 401 from its gating web-process lookup —
// the first CAPI call, which catches the expired token before the stats
// fan-out runs — then replays the whole operation with a refreshed client.
func TestGetAppStatsBatch_RetriesOnceOn401(t *testing.T) {
	var listCalls int32
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/processes":
			if atomic.AddInt32(&listCalls, 1) == 1 {
				w.WriteHeader(http.StatusUnauthorized)
				_, _ = w.Write([]byte(stubUnauthorizedJSON))
				return
			}
			_, _ = w.Write([]byte(stubProcessListWithAppRelJSON))
		case "/v3/processes/proc-1/stats":
			_, _ = w.Write([]byte(stubProcessStatsJSON))
		default:
			http.NotFound(w, r)
		}
	})
	ts := httptest.NewServer(mux)
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/app-stats/cnsi-1?app_guids=app-1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getAppStatsBatch(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, int32(2), atomic.LoadInt32(&listCalls))

	var resp StAppStatsBatchResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	require.Contains(t, resp.Apps, "app-1")
	require.Len(t, resp.Apps["app-1"].Instances, 2)
}

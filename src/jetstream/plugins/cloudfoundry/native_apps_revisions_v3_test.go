// src/jetstream/plugins/cloudfoundry/native_apps_revisions_v3_test.go
package cloudfoundry

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/fivetwenty-io/capi/v3/pkg/cfclient"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// newTestRevisionsClient builds a cfclient with retries effectively
// disabled (RetryMax=1 with 1ms waits) so soft-fail tests don't pay
// 7s of exponential-backoff per 5xx response. Used by all
// TestAssembleRevisions_* tests.
func newTestRevisionsClient(t *testing.T, ctx context.Context, url string) capi.Client {
	t.Helper()
	c, err := cfclient.New(ctx, &capi.Config{
		APIEndpoint:  url,
		AccessToken:  "test-token",
		RetryMax:     1,
		RetryWaitMin: time.Millisecond,
		RetryWaitMax: time.Millisecond,
	})
	require.NoError(t, err)
	return c
}

// TestAssembleRevisions_HappyPath verifies the orchestrator hits all
// three CAPI endpoints concurrently, merges the deployed-set into rows,
// and projects the feature flag onto FeatureEnabled with no Partial
// flags raised.
func TestAssembleRevisions_HappyPath(t *testing.T) {
	t.Parallel()
	var listCalls, deployedCalls, featureCalls int32

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/apps/app-1/revisions":
			atomic.AddInt32(&listCalls, 1)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 3,
					"total_pages":   1,
				},
				"resources": []map[string]interface{}{
					{"guid": "rev-1", "version": 1},
					{"guid": "rev-2", "version": 2},
					{"guid": "rev-3", "version": 3},
				},
			})
		case "/v3/apps/app-1/revisions/deployed":
			atomic.AddInt32(&deployedCalls, 1)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 1,
					"total_pages":   1,
				},
				"resources": []map[string]interface{}{
					{"guid": "rev-3", "version": 3},
				},
			})
		case "/v3/apps/app-1/features/revisions":
			atomic.AddInt32(&featureCalls, 1)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"name":        "revisions",
				"description": "Enable revisions for the application",
				"enabled":     true,
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client := newTestRevisionsClient(t, ctx, srv.URL)

	resp, err := assembleRevisions(ctx, client, "app-1")
	require.NoError(t, err)
	require.NotNil(t, resp)

	assert.Equal(t, int32(1), atomic.LoadInt32(&listCalls), "LIST endpoint hit exactly once")
	assert.Equal(t, int32(1), atomic.LoadInt32(&deployedCalls), "DEPLOYED endpoint hit exactly once")
	assert.Equal(t, int32(1), atomic.LoadInt32(&featureCalls), "FEATURE endpoint hit exactly once")

	require.Len(t, resp.Revisions, 3)
	// Order preserved from the LIST response.
	assert.Equal(t, "rev-1", resp.Revisions[0].GUID)
	assert.Equal(t, "rev-2", resp.Revisions[1].GUID)
	assert.Equal(t, "rev-3", resp.Revisions[2].GUID)

	// Deployed flag must merge correctly: only rev-3 is in deployedSet.
	assert.False(t, resp.Revisions[0].Deployed, "rev-1 not deployed")
	assert.False(t, resp.Revisions[1].Deployed, "rev-2 not deployed")
	assert.True(t, resp.Revisions[2].Deployed, "rev-3 is deployed")

	assert.True(t, resp.FeatureEnabled, "feature flag projected onto FeatureEnabled")

	// No Partial flags raised on full success.
	assert.False(t, resp.Partial.DeployedUnknown)
	assert.False(t, resp.Partial.FeatureUnknown)
}

// TestAssembleRevisions_DeployedSoftFail verifies that when the DEPLOYED
// endpoint returns HTTP 500, the response succeeds (soft-fail), Deployed
// flags default to false on all rows, and DeployedUnknown is set.
func TestAssembleRevisions_DeployedSoftFail(t *testing.T) {
	t.Parallel()
	var listCalls, deployedCalls, featureCalls int32

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/apps/app-1/revisions":
			atomic.AddInt32(&listCalls, 1)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 1,
					"total_pages":   1,
				},
				"resources": []map[string]interface{}{
					{"guid": "rev-1", "version": 1},
				},
			})
		case "/v3/apps/app-1/revisions/deployed":
			atomic.AddInt32(&deployedCalls, 1)
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"errors":[{"detail":"Internal Server Error"}]}`))

		case "/v3/apps/app-1/features/revisions":
			atomic.AddInt32(&featureCalls, 1)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"name":        "revisions",
				"description": "Enable revisions for the application",
				"enabled":     true,
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client := newTestRevisionsClient(t, ctx, srv.URL)

	resp, err := assembleRevisions(ctx, client, "app-1")
	require.NoError(t, err, "soft-fail on deployed error should succeed")
	require.NotNil(t, resp)

	// LIST hit exactly once (no retry on 200); DEPLOYED may retry on 500.
	assert.Equal(t, int32(1), atomic.LoadInt32(&listCalls), "LIST endpoint hit exactly once")
	assert.Greater(t, atomic.LoadInt32(&deployedCalls), int32(0), "DEPLOYED endpoint called")
	assert.Equal(t, int32(1), atomic.LoadInt32(&featureCalls), "FEATURE endpoint hit exactly once")

	// One revision from list, deployed flag defaults to false (deployed unknown).
	require.Len(t, resp.Revisions, 1)
	assert.Equal(t, "rev-1", resp.Revisions[0].GUID)
	assert.False(t, resp.Revisions[0].Deployed, "deployed defaults to false when deployed endpoint fails")

	// Feature flag succeeded.
	assert.True(t, resp.FeatureEnabled)

	// DeployedUnknown is set; FeatureUnknown is not.
	assert.True(t, resp.Partial.DeployedUnknown, "deployed endpoint failure raises DeployedUnknown")
	assert.False(t, resp.Partial.FeatureUnknown)
}

// TestAssembleRevisions_FeatureSoftFail verifies that when the FEATURE
// endpoint returns HTTP 500, the response succeeds (soft-fail), FeatureEnabled
// defaults to false, and FeatureUnknown is set.
func TestAssembleRevisions_FeatureSoftFail(t *testing.T) {
	t.Parallel()
	var listCalls, deployedCalls, featureCalls int32

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/apps/app-1/revisions":
			atomic.AddInt32(&listCalls, 1)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 1,
					"total_pages":   1,
				},
				"resources": []map[string]interface{}{
					{"guid": "rev-1", "version": 1},
				},
			})
		case "/v3/apps/app-1/revisions/deployed":
			atomic.AddInt32(&deployedCalls, 1)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 1,
					"total_pages":   1,
				},
				"resources": []map[string]interface{}{
					{"guid": "rev-1"},
				},
			})
		case "/v3/apps/app-1/features/revisions":
			atomic.AddInt32(&featureCalls, 1)
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"errors":[{"detail":"Internal Server Error"}]}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client := newTestRevisionsClient(t, ctx, srv.URL)

	resp, err := assembleRevisions(ctx, client, "app-1")
	require.NoError(t, err, "soft-fail on feature error should succeed")
	require.NotNil(t, resp)

	// LIST and DEPLOYED hit exactly once (no retry on 200); FEATURE may retry on 500.
	assert.Equal(t, int32(1), atomic.LoadInt32(&listCalls), "LIST endpoint hit exactly once")
	assert.Equal(t, int32(1), atomic.LoadInt32(&deployedCalls), "DEPLOYED endpoint hit exactly once")
	assert.Greater(t, atomic.LoadInt32(&featureCalls), int32(0), "FEATURE endpoint called")

	// One revision from list, deployed flag reflects success of deployed endpoint.
	require.Len(t, resp.Revisions, 1)
	assert.Equal(t, "rev-1", resp.Revisions[0].GUID)
	assert.True(t, resp.Revisions[0].Deployed, "rev-1 was in deployed set")

	// FeatureEnabled defaults to false when feature endpoint fails.
	assert.False(t, resp.FeatureEnabled)

	// FeatureUnknown is set; DeployedUnknown is not.
	assert.False(t, resp.Partial.DeployedUnknown)
	assert.True(t, resp.Partial.FeatureUnknown, "feature endpoint failure raises FeatureUnknown")
}

// TestAssembleRevisions_ListMultiPage verifies that the LIST endpoint is
// called once per page (pagination), and all pages are drained and merged
// in order into the final response.
func TestAssembleRevisions_ListMultiPage(t *testing.T) {
	t.Parallel()
	var listCalls int32

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/apps/app-1/revisions":
			atomic.AddInt32(&listCalls, 1)
			page := r.URL.Query().Get("page")
			if page == "2" {
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"pagination": map[string]interface{}{
						"total_results": 2,
						"total_pages":   2,
					},
					"resources": []map[string]interface{}{
						{"guid": "rev-page2", "version": 2},
					},
				})
			} else {
				// page == "" or "1"
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"pagination": map[string]interface{}{
						"total_results": 2,
						"total_pages":   2,
					},
					"resources": []map[string]interface{}{
						{"guid": "rev-page1", "version": 1},
					},
				})
			}
		case "/v3/apps/app-1/revisions/deployed":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 0,
					"total_pages":   1,
				},
				"resources": []map[string]interface{}{},
			})
		case "/v3/apps/app-1/features/revisions":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"name":        "revisions",
				"description": "Enable revisions for the application",
				"enabled":     true,
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client := newTestRevisionsClient(t, ctx, srv.URL)

	resp, err := assembleRevisions(ctx, client, "app-1")
	require.NoError(t, err)
	require.NotNil(t, resp)

	// LIST endpoint called exactly twice: page 1 + page 2.
	assert.Equal(t, int32(2), atomic.LoadInt32(&listCalls), "LIST endpoint hit for both pages")

	// Both revisions present, order preserved.
	require.Len(t, resp.Revisions, 2)
	assert.Equal(t, "rev-page1", resp.Revisions[0].GUID)
	assert.Equal(t, "rev-page2", resp.Revisions[1].GUID)

	// No partial failures.
	assert.False(t, resp.Partial.DeployedUnknown)
	assert.False(t, resp.Partial.FeatureUnknown)
}

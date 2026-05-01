// src/jetstream/plugins/cloudfoundry/native_apps_revisions_v3_test.go
package cloudfoundry

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"

	"github.com/fivetwenty-io/capi/v3/pkg/cfclient"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestAssembleRevisions_HappyPath verifies the orchestrator hits all
// three CAPI endpoints concurrently, merges the deployed-set into rows,
// and projects the feature flag onto FeatureEnabled with no Partial
// flags raised.
func TestAssembleRevisions_HappyPath(t *testing.T) {
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
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

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

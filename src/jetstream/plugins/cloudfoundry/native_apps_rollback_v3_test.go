// src/jetstream/plugins/cloudfoundry/native_apps_rollback_v3_test.go
package cloudfoundry

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/fivetwenty-io/capi/v3/pkg/cfclient"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// newTestRollbackClient builds a cfclient with retries effectively
// disabled so test failures fail fast (no exponential-backoff stalls).
func newTestRollbackClient(t *testing.T, ctx context.Context, url string) capi.Client {
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

// TestAdvanceRollback_HappyPath drives advanceRollback through the full
// happy path via three calls:
//
//  1. CurrentStage=DeploymentCreate → POST /v3/deployments returns 202
//     with a deployment object {guid, status: ACTIVE/DEPLOYING}.
//     Expect: JobStateProcessing, ref.DeploymentGuid populated,
//     CurrentStage advances to DeploymentPoll.
//
//  2. CurrentStage=DeploymentPoll → first GET returns ACTIVE/DEPLOYING.
//     Expect: JobStateProcessing, CurrentStage stays on DeploymentPoll.
//
//  3. CurrentStage=DeploymentPoll → second GET returns FINALIZED/DEPLOYED.
//     Expect: JobStateComplete, CurrentStage cleared.
//
// Mirror of TestAdvanceRestage_* style — drives the orchestrator
// directly with an httptest CAPI fake.
func TestAdvanceRollback_HappyPath(t *testing.T) {
	t.Parallel()

	var createCalls, getCalls int32

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))

		case r.URL.Path == "/v3/deployments" && r.Method == http.MethodPost:
			n := atomic.AddInt32(&createCalls, 1)
			require.Equal(t, int32(1), n, "deployment create called more than once")

			var body map[string]interface{}
			require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
			// Verify the request payload mirrors the documented shape.
			assert.Equal(t, "rolling", body["strategy"])
			rev, _ := body["revision"].(map[string]interface{})
			require.NotNil(t, rev, "revision block missing in deployment create")
			assert.Equal(t, "rev-1", rev["guid"])
			rels, _ := body["relationships"].(map[string]interface{})
			require.NotNil(t, rels, "relationships block missing in deployment create")
			app, _ := rels["app"].(map[string]interface{})
			require.NotNil(t, app)
			data, _ := app["data"].(map[string]interface{})
			require.NotNil(t, data)
			assert.Equal(t, "app-1", data["guid"])

			w.WriteHeader(http.StatusAccepted)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "dep-1",
				"state": "DEPLOYING",
				"status": map[string]interface{}{
					"value":  "ACTIVE",
					"reason": "DEPLOYING",
				},
				"strategy": "rolling",
			})

		case r.URL.Path == "/v3/deployments/dep-1" && r.Method == http.MethodGet:
			n := atomic.AddInt32(&getCalls, 1)
			// First GET: still active. Second GET: finalized/deployed.
			if n == 1 {
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"guid": "dep-1",
					"status": map[string]interface{}{
						"value":  "ACTIVE",
						"reason": "DEPLOYING",
					},
				})
				return
			}
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "dep-1",
				"status": map[string]interface{}{
					"value":  "FINALIZED",
					"reason": "DEPLOYED",
				},
			})

		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client := newTestRollbackClient(t, ctx, srv.URL)

	ref := &RollbackRef{
		CNSIGuid:     "cnsi-1",
		UserGuid:     "user-1",
		AppGuid:      "app-1",
		RevisionGuid: "rev-1",
		Strategy:     "rolling",
		CurrentStage: StageRollbackDeploymentCreate,
	}

	// Call 1: deployment_create.
	state, errs, err := advanceRollback(ctx, client, ref, nil)
	require.NoError(t, err)
	assert.Empty(t, errs)
	assert.Equal(t, stratosjobs.JobStateProcessing, state)
	assert.Equal(t, "dep-1", ref.DeploymentGuid, "deployment GUID captured on ref")
	assert.Equal(t, StageRollbackDeploymentPoll, ref.CurrentStage, "advanced to deployment_poll")
	require.Len(t, ref.Stages, 1)
	assert.Equal(t, StageRollbackDeploymentCreate, ref.Stages[0].Stage)
	assert.Equal(t, StageStateDone, ref.Stages[0].State)

	// Call 2: deployment_poll, ACTIVE — stays on stage.
	state, errs, err = advanceRollback(ctx, client, ref, nil)
	require.NoError(t, err)
	assert.Empty(t, errs)
	assert.Equal(t, stratosjobs.JobStateProcessing, state)
	assert.Equal(t, StageRollbackDeploymentPoll, ref.CurrentStage, "still polling")
	require.Len(t, ref.Stages, 2)
	assert.Equal(t, StageStateInProgress, ref.Stages[1].State)

	// Call 3: deployment_poll, FINALIZED/DEPLOYED — completes.
	state, errs, err = advanceRollback(ctx, client, ref, nil)
	require.NoError(t, err)
	assert.Empty(t, errs)
	assert.Equal(t, stratosjobs.JobStateComplete, state)
	assert.Equal(t, RollbackStage(""), ref.CurrentStage, "terminal — current stage cleared")
	require.Len(t, ref.Stages, 2)
	assert.Equal(t, StageStateDone, ref.Stages[1].State)

	assert.Equal(t, int32(1), atomic.LoadInt32(&createCalls), "POST /v3/deployments called exactly once")
	assert.Equal(t, int32(2), atomic.LoadInt32(&getCalls), "GET /v3/deployments/:guid called twice")
}

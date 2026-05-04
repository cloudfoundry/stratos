// src/jetstream/plugins/cloudfoundry/native_apps_rollback_v3_test.go
package cloudfoundry

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
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

// rollbackPollServer returns a httptest server that POSTs return the
// supplied deployment GUID + ACTIVE/DEPLOYING, and GETs return the
// caller-supplied terminal status payload. Helper to keep error-state
// tests focused on the assertion rather than fixture construction.
func rollbackPollServer(t *testing.T, depGUID string, terminalStatus map[string]interface{}) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/deployments" && r.Method == http.MethodPost:
			w.WriteHeader(http.StatusAccepted)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": depGUID,
				"status": map[string]interface{}{
					"value":  "ACTIVE",
					"reason": "DEPLOYING",
				},
				"strategy": "rolling",
			})
		case r.URL.Path == "/v3/deployments/"+depGUID && r.Method == http.MethodGet:
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":   depGUID,
				"status": terminalStatus,
			})
		default:
			http.NotFound(w, r)
		}
	}))
}

// TestAdvanceRollback_FinalizedCanceledWithDetails verifies the CANCELED
// branch propagates dep.Status.Details.Error verbatim into the stage
// record and StratosError envelope. Mirrors how cf-cli surfaces the
// underlying CF reason ("instances crashed", "exceeded canary timeout",
// etc.) rather than masking it as a generic "deployment canceled".
func TestAdvanceRollback_FinalizedCanceledWithDetails(t *testing.T) {
	t.Parallel()

	srv := rollbackPollServer(t, "dep-cancel", map[string]interface{}{
		"value":  "FINALIZED",
		"reason": "CANCELED",
		"details": map[string]interface{}{
			"error": "instances crashed",
		},
	})
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

	// Drive past create → poll.
	state, _, err := advanceRollback(ctx, client, ref, nil)
	require.NoError(t, err)
	require.Equal(t, stratosjobs.JobStateProcessing, state)
	require.Equal(t, StageRollbackDeploymentPoll, ref.CurrentStage)

	// Poll: CANCELED with details.error.
	state, errs, err := advanceRollback(ctx, client, ref, nil)
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateFailed, state)
	require.NotEmpty(t, errs, "errs should carry the canceled reason")
	assert.Contains(t, errs[0].Message, "instances crashed",
		"CANCELED branch must propagate dep.Status.Details.Error verbatim")
	assert.Equal(t, "stratos.rollback.deployment_poll", errs[0].Code)

	// Stage record should also carry the propagated error string.
	require.Len(t, ref.Stages, 2)
	assert.Equal(t, StageStateFailed, ref.Stages[1].State)
	assert.Contains(t, ref.Stages[1].Error, "instances crashed")
}

// TestAdvanceRollback_FinalizedSuperseded verifies the SUPERSEDED branch
// fails the stage with a static "Superseded by another deployment"
// message — CF abandons the deployment when a newer one starts; there's
// nothing for Stratos to retry.
func TestAdvanceRollback_FinalizedSuperseded(t *testing.T) {
	t.Parallel()

	srv := rollbackPollServer(t, "dep-super", map[string]interface{}{
		"value":  "FINALIZED",
		"reason": "SUPERSEDED",
	})
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

	// Drive past create → poll.
	state, _, err := advanceRollback(ctx, client, ref, nil)
	require.NoError(t, err)
	require.Equal(t, stratosjobs.JobStateProcessing, state)

	// Poll: SUPERSEDED.
	state, errs, err := advanceRollback(ctx, client, ref, nil)
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateFailed, state)
	require.NotEmpty(t, errs)
	assert.Contains(t, errs[0].Message, "Superseded")
	assert.Equal(t, "stratos.rollback.deployment_poll", errs[0].Code)
}

// TestAdvanceRollback_PostRejected422 verifies that a POST /v3/deployments
// failure short-circuits the orchestrator into a terminal failure rather
// than leaving CurrentStage advanced and returning JobStateProcessing.
// No deployment record exists, so retrying would hit the same rejection.
func TestAdvanceRollback_PostRejected422(t *testing.T) {
	t.Parallel()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/deployments" && r.Method == http.MethodPost:
			w.WriteHeader(http.StatusUnprocessableEntity)
			_, _ = w.Write([]byte(`{"errors":[{"code":10008,"title":"CF-UnprocessableEntity","detail":"Revision is not deployable"}]}`))
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
		RevisionGuid: "rev-broken",
		Strategy:     "rolling",
		CurrentStage: StageRollbackDeploymentCreate,
	}

	state, errs, err := advanceRollback(ctx, client, ref, nil)
	require.NoError(t, err, "stage failures surface via errs, not the err return")
	assert.Equal(t, stratosjobs.JobStateFailed, state,
		"POST 422 must be hard-fail; do NOT return JobStateProcessing")
	require.NotEmpty(t, errs, "POST failure must populate errs")
	assert.Equal(t, "stratos.rollback.deployment_create", errs[0].Code)

	// Ref should NOT have advanced to the poll stage — no deployment to poll.
	assert.Empty(t, ref.DeploymentGuid, "no deployment GUID captured on rejected create")
	require.Len(t, ref.Stages, 1)
	assert.Equal(t, StageRollbackDeploymentCreate, ref.Stages[0].Stage)
	assert.Equal(t, StageStateFailed, ref.Stages[0].State)
}

// TestAdvanceRollback_PollingTimeout verifies the wall-clock budget
// branch in advanceRollbackDeploymentPoll. CF can leave a deployment
// ACTIVE/DEPLOYING for an unbounded period; the orchestrator imposes
// RollbackPollTimeout so the Stratos job has a definite end.
//
// Mechanic: drive create with `now` returning T0; the poll stage's
// StartedAt becomes T0. Then call advanceRollback again with `now`
// returning T0 + RollbackPollTimeout + 1s. The poll branch should
// detect the budget overrun and fail the stage even though the GET
// response still indicates ACTIVE/DEPLOYING.
func TestAdvanceRollback_PollingTimeout(t *testing.T) {
	t.Parallel()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/deployments" && r.Method == http.MethodPost:
			w.WriteHeader(http.StatusAccepted)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "dep-slow",
				"status": map[string]interface{}{
					"value":  "ACTIVE",
					"reason": "DEPLOYING",
				},
			})
		case r.URL.Path == "/v3/deployments/dep-slow" && r.Method == http.MethodGet:
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "dep-slow",
				"status": map[string]interface{}{
					"value":  "ACTIVE",
					"reason": "DEPLOYING",
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

	// Anchor T0 — create stage records StartedAt for both the create record
	// AND, on the second call, the poll record (since the poll stage's
	// StartedAt is captured via ensureRollbackStageInProgress on entry).
	t0 := time.Date(2026, 5, 1, 12, 0, 0, 0, time.UTC)
	nowAtT0 := func() time.Time { return t0 }

	// Call 1: deployment_create at T0.
	state, _, err := advanceRollback(ctx, client, ref, nowAtT0)
	require.NoError(t, err)
	require.Equal(t, stratosjobs.JobStateProcessing, state)
	require.Equal(t, StageRollbackDeploymentPoll, ref.CurrentStage)

	// Call 2: deployment_poll at T0 — ensures a poll stage record with
	// StartedAt = T0 exists. Server returns ACTIVE/DEPLOYING so we stay.
	state, _, err = advanceRollback(ctx, client, ref, nowAtT0)
	require.NoError(t, err)
	require.Equal(t, stratosjobs.JobStateProcessing, state)
	require.Len(t, ref.Stages, 2)
	require.Equal(t, t0, ref.Stages[1].StartedAt, "poll stage StartedAt anchored at T0")

	// Call 3: poll again with `now` past the budget. Server still says
	// ACTIVE/DEPLOYING; the budget branch must trip first.
	beyondBudget := func() time.Time { return t0.Add(RollbackPollTimeout + time.Second) }
	state, errs, err := advanceRollback(ctx, client, ref, beyondBudget)
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateFailed, state)
	require.NotEmpty(t, errs)
	msg := errs[0].Message
	assert.True(t,
		strings.Contains(msg, "timed out") || strings.Contains(msg, "timeout"),
		"timeout branch message should mention timeout, got %q", msg)
	assert.Equal(t, "stratos.rollback.deployment_poll", errs[0].Code)
	assert.Equal(t, StageStateFailed, ref.Stages[1].State)
}

// TestRollbackJobTranslator_Fetch_CompleteResult drives the translator
// through a terminal-success Fetch and asserts the result map shape:
// {appGuid, revisionGuid, strategy, deploymentGuid, stages}. Task 7's
// happy-path test exercised advanceRollback directly and bypassed this
// assembly; this regression test pins the wire contract the frontend
// consumes when the rollback job COMPLETEs.
func TestRollbackJobTranslator_Fetch_CompleteResult(t *testing.T) {
	t.Parallel()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/deployments" && r.Method == http.MethodPost:
			w.WriteHeader(http.StatusAccepted)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "dep-final",
				"status": map[string]interface{}{
					"value":  "ACTIVE",
					"reason": "DEPLOYING",
				},
				"strategy": "rolling",
			})
		case r.URL.Path == "/v3/deployments/dep-final" && r.Method == http.MethodGet:
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "dep-final",
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

	tr, _ := newTestRollbackTranslator(t, srv)
	ref := &RollbackRef{
		CNSIGuid:     "cnsi-1",
		UserGuid:     "user-1",
		AppGuid:      "app-final",
		RevisionGuid: "rev-final",
		Strategy:     "rolling",
		CurrentStage: StageRollbackDeploymentCreate,
	}

	// Call 1: deployment_create → Processing.
	state, _, result, err := tr.Fetch(context.Background(), ref)
	require.NoError(t, err)
	require.Equal(t, stratosjobs.JobStateProcessing, state)
	assert.Nil(t, result)

	// Call 2: deployment_poll, FINALIZED/DEPLOYED → Complete with result map.
	state, _, result, err = tr.Fetch(context.Background(), ref)
	require.NoError(t, err)
	require.Equal(t, stratosjobs.JobStateComplete, state)
	require.NotNil(t, result, "translator must surface a result map on COMPLETE")

	resultMap, ok := result.(map[string]interface{})
	require.True(t, ok, "result should be map[string]interface{}, got %T", result)
	assert.Equal(t, "app-final", resultMap["appGuid"])
	assert.Equal(t, "rev-final", resultMap["revisionGuid"])
	assert.Equal(t, "rolling", resultMap["strategy"])
	assert.Equal(t, "dep-final", resultMap["deploymentGuid"])
	require.Contains(t, resultMap, "stages", "result map must include the stages timeline")
	assert.NotNil(t, resultMap["stages"])
}

// newTestRollbackTranslator wires a translator to a fixed mockNativeCFProxy
// pointed at the supplied test server. Mirror of newTestRestageTranslator.
func newTestRollbackTranslator(t *testing.T, srv *httptest.Server) (*RollbackJobTranslator, *mockNativeCFProxy) {
	t.Helper()
	proxy := &mockNativeCFProxy{
		userID: "user-1",
		cnsiRecord: api.CNSIRecord{
			GUID:        "cnsi-1",
			APIEndpoint: mustParseURL(srv.URL),
		},
		tokenRecord: api.TokenRecord{AuthToken: "test-token"},
	}
	tr := &RollbackJobTranslator{
		proxyProvider: func() nativeCFProxy { return proxy },
	}
	return tr, proxy
}

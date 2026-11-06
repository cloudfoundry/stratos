// src/jetstream/plugins/cloudfoundry/rollback_translator_test.go
package cloudfoundry

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// newRollbackTranslatorWithServer wires a RollbackJobTranslator to a
// fixed mockNativeCFProxy that points capi at the supplied test server.
func newRollbackTranslatorWithServer(t *testing.T, srv *httptest.Server) (*RollbackJobTranslator, *mockNativeCFProxy) {
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

// TestRollbackJobTranslator_KindIsStable ensures the Kind string never
// accidentally drifts — it is used as a wire key in Stratos diagnostics.
func TestRollbackJobTranslator_KindIsStable(t *testing.T) {
	tr := &RollbackJobTranslator{}
	assert.Equal(t, "cf.app.rollback", tr.Kind())
	assert.Equal(t, RollbackJobKind, tr.Kind())
}

// TestRollbackJobTranslator_Fetch_RejectsWrongRefType guards against
// passing the wrong payload type to the tracker at Create time.
func TestRollbackJobTranslator_Fetch_RejectsWrongRefType(t *testing.T) {
	tr := &RollbackJobTranslator{
		proxyProvider: func() nativeCFProxy { return &mockNativeCFProxy{} },
	}
	state, errs, result, err := tr.Fetch(context.Background(), CFJobRef{JobGUID: "wrong"})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "unexpected ref type")
	assert.Equal(t, stratosjobs.JobState(""), state)
	assert.Nil(t, errs)
	assert.Nil(t, result)
}

// TestRollbackJobTranslator_Fetch_RejectsNilProxy covers the startup race
// window where the native proxy hasn't been set yet.
func TestRollbackJobTranslator_Fetch_RejectsNilProxy(t *testing.T) {
	tr := &RollbackJobTranslator{
		proxyProvider: func() nativeCFProxy { return nil },
	}
	ref := &RollbackRef{
		CNSIGuid:     "cnsi-1",
		UserGuid:     "user-1",
		AppGuid:      "app-1",
		RevisionGuid: "rev-1",
		CurrentStage: StageRollbackDeploymentCreate,
	}
	_, _, _, err := tr.Fetch(context.Background(), ref)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "native proxy unavailable")
}

// TestRollbackJobTranslator_Fetch_AdvancesDeploymentCreate verifies the
// translator delegates to advanceRollback and advances the stage pointer
// from deployment_create → deployment_poll on success.
func TestRollbackJobTranslator_Fetch_AdvancesDeploymentCreate(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/deployments":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":   "dep-1",
				"state":  "ACTIVE",
				"status": map[string]interface{}{"value": "ACTIVE", "reason": "DEPLOYING"},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	tr, _ := newRollbackTranslatorWithServer(t, srv)
	ref := &RollbackRef{
		CNSIGuid:     "cnsi-1",
		UserGuid:     "user-1",
		AppGuid:      "app-1",
		RevisionGuid: "rev-1",
		CurrentStage: StageRollbackDeploymentCreate,
	}

	state, errs, result, err := tr.Fetch(context.Background(), ref)
	require.NoError(t, err)
	assert.Empty(t, errs)
	assert.Nil(t, result, "result should be nil while still PROCESSING")
	assert.Equal(t, stratosjobs.JobStateProcessing, state)

	// Ref must be mutated through the pointer — next Fetch resumes from poll.
	assert.Equal(t, StageRollbackDeploymentPoll, ref.CurrentStage)
	assert.Equal(t, "dep-1", ref.DeploymentGuid)
	require.Len(t, ref.Stages, 1)
	assert.Equal(t, StageStateDone, ref.Stages[0].State)
}

// TestRollbackJobTranslator_Fetch_TerminalCompleteSurfacesResult verifies
// the translator emits a structured result payload only on COMPLETE,
// containing appGuid + revisionGuid + strategy + deploymentGuid + stages.
func TestRollbackJobTranslator_Fetch_TerminalCompleteSurfacesResult(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/deployments/dep-1":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":   "dep-1",
				"status": map[string]interface{}{"value": "FINALIZED", "reason": "DEPLOYED"},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	tr, _ := newRollbackTranslatorWithServer(t, srv)
	ref := &RollbackRef{
		CNSIGuid:       "cnsi-1",
		UserGuid:       "user-1",
		AppGuid:        "app-1",
		RevisionGuid:   "rev-1",
		Strategy:       "rolling",
		DeploymentGuid: "dep-1",
		CurrentStage:   StageRollbackDeploymentPoll,
	}

	state, _, result, err := tr.Fetch(context.Background(), ref)
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateComplete, state)
	require.NotNil(t, result)
	resultMap, ok := result.(map[string]interface{})
	require.True(t, ok, "result should be map[string]interface{}, got %T", result)
	assert.Equal(t, "app-1", resultMap["appGuid"])
	assert.Equal(t, "rev-1", resultMap["revisionGuid"])
	assert.Equal(t, "rolling", resultMap["strategy"])
	assert.Equal(t, "dep-1", resultMap["deploymentGuid"])
	assert.NotNil(t, resultMap["stages"])
}

// TestRollbackJobTranslator_Fetch_TerminalFailedSurfacesErrors verifies
// that a FINALIZED+CANCELED deployment surfaces a StratosError and leaves
// result nil.
func TestRollbackJobTranslator_Fetch_TerminalFailedSurfacesErrors(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/deployments/dep-fail":
			cancelMsg := "instances crashed"
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "dep-fail",
				"status": map[string]interface{}{
					"value":   "FINALIZED",
					"reason":  "CANCELED",
					"details": map[string]interface{}{"error": cancelMsg},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	tr, _ := newRollbackTranslatorWithServer(t, srv)
	ref := &RollbackRef{
		CNSIGuid:       "cnsi-1",
		UserGuid:       "user-1",
		AppGuid:        "app-1",
		RevisionGuid:   "rev-1",
		DeploymentGuid: "dep-fail",
		CurrentStage:   StageRollbackDeploymentPoll,
	}

	state, errs, result, err := tr.Fetch(context.Background(), ref)
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateFailed, state)
	require.NotEmpty(t, errs)
	assert.Nil(t, result)
	assert.Equal(t, "stratos.rollback.deployment_poll", errs[0].Code)
}

// TestRollbackJobTranslator_Fetch_TransportFailurePropagates verifies
// that CAPI-client build failures (no token) surface as the Fetch error
// rather than a stage failure.
func TestRollbackJobTranslator_Fetch_TransportFailurePropagates(t *testing.T) {
	tr := &RollbackJobTranslator{
		proxyProvider: func() nativeCFProxy { return &noTokenProxy{} },
	}
	ref := &RollbackRef{
		CNSIGuid:     "cnsi-1",
		UserGuid:     "user-1",
		AppGuid:      "app-1",
		RevisionGuid: "rev-1",
		CurrentStage: StageRollbackDeploymentCreate,
	}
	_, _, _, err := tr.Fetch(context.Background(), ref)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "build capi client")
}

// ---- CurrentStage tests ---------------------------------------------------

// TestRollbackJobTranslator_CurrentStage_EmptyHistoryReturnsFalse verifies
// that a ref with no stages yet (job just created) correctly signals has=false.
func TestRollbackJobTranslator_CurrentStage_EmptyHistoryReturnsFalse(t *testing.T) {
	tr := &RollbackJobTranslator{}
	ref := &RollbackRef{
		AppGuid:      "app-1",
		CurrentStage: StageRollbackDeploymentCreate,
		Stages:       nil,
	}
	_, has := tr.CurrentStage(ref)
	assert.False(t, has, "empty Stages should return has=false")
}

// TestRollbackJobTranslator_CurrentStage_WrongRefTypeReturnsFalse verifies
// the capability interface contract: wrong ref type → (JobStage{}, false).
func TestRollbackJobTranslator_CurrentStage_WrongRefTypeReturnsFalse(t *testing.T) {
	tr := &RollbackJobTranslator{}
	_, has := tr.CurrentStage(CFJobRef{JobGUID: "x"})
	assert.False(t, has)
}

// TestRollbackJobTranslator_CurrentStage_DeploymentCreateStage verifies
// that the first stage record maps to index=1, Of=2, code=DEPLOYMENT_CREATE.
func TestRollbackJobTranslator_CurrentStage_DeploymentCreateStage(t *testing.T) {
	tr := &RollbackJobTranslator{}
	entered := time.Date(2026, 5, 2, 10, 0, 0, 0, time.UTC)
	ref := &RollbackRef{
		AppGuid:      "app-1",
		CurrentStage: StageRollbackDeploymentCreate,
		Stages: []RollbackStageRecord{
			{Stage: StageRollbackDeploymentCreate, State: StageStateInProgress, StartedAt: entered},
		},
	}
	stage, has := tr.CurrentStage(ref)
	require.True(t, has)
	assert.Equal(t, "DEPLOYMENT_CREATE", stage.Code)
	assert.Equal(t, "Creating deployment", stage.Label)
	assert.Equal(t, 1, stage.Index)
	assert.Equal(t, 2, stage.Of)
	assert.Equal(t, entered, stage.EnteredAt)
}

// TestRollbackJobTranslator_CurrentStage_DeploymentPollStage verifies
// that the poll stage maps to index=2, Of=2, code=DEPLOYMENT_POLL.
func TestRollbackJobTranslator_CurrentStage_DeploymentPollStage(t *testing.T) {
	tr := &RollbackJobTranslator{}
	entered := time.Date(2026, 5, 2, 10, 1, 0, 0, time.UTC)
	ref := &RollbackRef{
		AppGuid:      "app-1",
		CurrentStage: StageRollbackDeploymentPoll,
		Stages: []RollbackStageRecord{
			{Stage: StageRollbackDeploymentCreate, State: StageStateDone,
				StartedAt: time.Date(2026, 5, 2, 10, 0, 0, 0, time.UTC)},
			{Stage: StageRollbackDeploymentPoll, State: StageStateInProgress, StartedAt: entered},
		},
	}
	stage, has := tr.CurrentStage(ref)
	require.True(t, has)
	assert.Equal(t, "DEPLOYMENT_POLL", stage.Code)
	assert.Equal(t, "Waiting for rollback to complete", stage.Label)
	assert.Equal(t, 2, stage.Index)
	assert.Equal(t, 2, stage.Of)
	assert.Equal(t, entered, stage.EnteredAt)
}

// TestRollbackJobTranslator_CurrentStage_TerminalJobUsesLastRecord verifies
// that after the state machine completes (CurrentStage=="") the last stage
// record is still surfaced — the tracker may call CurrentStage one more
// time on the Refresh that flips the job to COMPLETE.
func TestRollbackJobTranslator_CurrentStage_TerminalJobUsesLastRecord(t *testing.T) {
	tr := &RollbackJobTranslator{}
	ref := &RollbackRef{
		AppGuid:      "app-1",
		CurrentStage: "", // terminal
		Stages: []RollbackStageRecord{
			{Stage: StageRollbackDeploymentCreate, State: StageStateDone},
			{Stage: StageRollbackDeploymentPoll, State: StageStateDone,
				StartedAt: time.Date(2026, 5, 2, 10, 1, 0, 0, time.UTC)},
		},
	}
	// Still returns the last record — tracker dedup handles repeated emits.
	stage, has := tr.CurrentStage(ref)
	require.True(t, has)
	assert.Equal(t, "DEPLOYMENT_POLL", stage.Code)
	assert.Equal(t, 2, stage.Of)
}

// TestRollbackJobTranslator_ImplementsStageEmittingTranslator is a
// compile-time interface assertion wrapped in a test so any drift produces
// a clear failure rather than a silent build error in a different package.
func TestRollbackJobTranslator_ImplementsStageEmittingTranslator(t *testing.T) {
	var _ stratosjobs.StageEmittingTranslator = (*RollbackJobTranslator)(nil)
}

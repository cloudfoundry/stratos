// src/jetstream/plugins/cloudfoundry/rollback_translator.go
//
// RollbackJobTranslator drives the v3 rollback state machine via the
// Stratos async-job contract. The handler creates a tracked job with a
// *RollbackRef payload; on each frontend poll, Tracker.Refresh calls
// Fetch which advances the state machine by one stage.
//
// Mirror of restage_translator.go — rollback is structurally a
// deployment_create + deployment_poll pair (no package/build/droplet
// stages, since rollback reuses an existing revision's droplet).
package cloudfoundry

import (
	"context"
	"fmt"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
)

// RollbackJobKind is the stable Kind string used for rollback jobs in
// the tracker. The frontend uses this to route diagnostics; not
// load-bearing for state-machine routing (the translator is passed
// explicitly at Create).
const RollbackJobKind = "cf.app.rollback"

// RollbackJobTranslator implements stratosjobs.JobTranslator for the v3
// rollback state machine. Each Fetch builds a capi client for the
// (cnsi,user) pair stored in the ref and calls advanceRollback to
// advance the state machine by one stage.
//
// The translator stores the proxy provider as a closure rather than a
// reference to the CloudFoundrySpecification so tests can supply a fake
// proxy without constructing a full plugin instance.
type RollbackJobTranslator struct {
	proxyProvider func() nativeCFProxy
}

// NewRollbackJobTranslator constructs the translator wired to the
// plugin's portal proxy. The plugin's main.go registers this with the
// Stratos tracker at startup (alongside RestageJobTranslator).
func NewRollbackJobTranslator(cf *CloudFoundrySpecification) *RollbackJobTranslator {
	return &RollbackJobTranslator{proxyProvider: cf.nativeProxy}
}

// Kind returns the stable kind prefix for rollback jobs.
func (t *RollbackJobTranslator) Kind() string { return RollbackJobKind }

// CurrentStage implements stratosjobs.StageEmittingTranslator. It maps
// the last entry in the RollbackRef.Stages slice to a JobStage for the
// tracker's dedup-appending pipeline.
//
// Rollback has exactly two stages (deployment_create, deployment_poll),
// so Index/Of are always 1-based within [1,2]. Returns (JobStage{}, false)
// when the ref is the wrong type or the history is empty (job has not yet
// started executing the state machine).
func (t *RollbackJobTranslator) CurrentStage(ref interface{}) (stratosjobs.JobStage, bool) {
	rRef, ok := ref.(*RollbackRef)
	if !ok || len(rRef.Stages) == 0 {
		return stratosjobs.JobStage{}, false
	}
	last := rRef.Stages[len(rRef.Stages)-1]
	return stratosjobs.JobStage{
		Code:      rollbackStageCode(last.Stage),
		Label:     rollbackStageLabel(last.Stage),
		Index:     rollbackStageIndex(last.Stage),
		Of:        2, // deployment_create + deployment_poll
		EnteredAt: last.StartedAt,
	}, true
}

// rollbackStageCode maps a RollbackStage to a stable wire code that the
// frontend uses for dedup and rendering. Must be stable — treat as wire
// contract.
func rollbackStageCode(s RollbackStage) string {
	switch s {
	case StageRollbackDeploymentCreate:
		return "DEPLOYMENT_CREATE"
	case StageRollbackDeploymentPoll:
		return "DEPLOYMENT_POLL"
	default:
		return string(s)
	}
}

// rollbackStageLabel returns a human-readable label for each rollback stage.
func rollbackStageLabel(s RollbackStage) string {
	switch s {
	case StageRollbackDeploymentCreate:
		return "Creating deployment"
	case StageRollbackDeploymentPoll:
		return "Waiting for rollback to complete"
	default:
		return string(s)
	}
}

// rollbackStageIndex returns the 1-based step index for a rollback stage.
func rollbackStageIndex(s RollbackStage) int {
	switch s {
	case StageRollbackDeploymentCreate:
		return 1
	case StageRollbackDeploymentPoll:
		return 2
	default:
		return 0
	}
}

// Fetch advances the rollback state machine by one stage and translates
// the orchestrator's outcome onto the Stratos job tuple.
//
// Result payload:
//   - COMPLETE: {appGuid, revisionGuid, strategy, deploymentGuid, stages}
//     so the frontend has the final timeline + entity GUIDs without a
//     second roundtrip.
//   - PROCESSING / FAILED: nil — failure context is in `errors`; for
//     in-flight progress the handler exposes ref.Stages via a dedicated
//     status endpoint (decided in the route-registration slice).
func (t *RollbackJobTranslator) Fetch(ctx context.Context, ref interface{}) (
	stratosjobs.JobState,
	[]stratosjobs.StratosError,
	interface{},
	error,
) {
	rRef, ok := ref.(*RollbackRef)
	if !ok {
		return "", nil, nil, fmt.Errorf("rollback translator: unexpected ref type %T", ref)
	}

	proxy := t.proxyProvider()
	if proxy == nil {
		return "", nil, nil, fmt.Errorf("rollback translator: native proxy unavailable")
	}

	client, err := newCapiClient(ctx, proxy, rRef.CNSIGuid, rRef.UserGuid)
	if err != nil {
		return "", nil, nil, fmt.Errorf("rollback translator: build capi client: %w", err)
	}

	state, errs, advanceErr := advanceRollback(ctx, client, rRef, nil)
	if advanceErr != nil {
		return "", nil, nil, advanceErr
	}

	var result interface{}
	if state == stratosjobs.JobStateComplete {
		result = map[string]interface{}{
			"appGuid":        rRef.AppGuid,
			"revisionGuid":   rRef.RevisionGuid,
			"strategy":       rRef.Strategy,
			"deploymentGuid": rRef.DeploymentGuid,
			"stages":         rRef.Stages,
		}
	}
	return state, errs, result, nil
}

// src/jetstream/plugins/cloudfoundry/native_apps_rollback_v3.go
//
// V3 rollback orchestration: state machine.
//
// Rollback is structurally simpler than restage — CF v3 supports
// rolling back to an existing revision by POSTing /v3/deployments with
// a `revision.guid` instead of a `droplet.guid`. The orchestrator
// therefore only needs two stages:
//
//   deployment_create — POST /v3/deployments {revision, app, strategy}
//   deployment_poll   — GET /v3/deployments/:guid until FINALIZED/DEPLOYED
//
// Mirror of native_apps_restage_v3.go (advanceRestage + per-stage
// helpers); see that file for the broader async-job state-machine
// rationale and stage-record conventions.
//
// CAPI reference: cf-cli v8's `actor.CreateDeploymentByApplicationAndRevision`
// composes with `actor.PollStartForRolling`. Our happy path mirrors that.
// Error states (CANCELED, SUPERSEDED, polling timeout) are handled in
// advanceRollbackDeploymentPoll alongside the DEPLOYED success branch.
package cloudfoundry

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
)

// RollbackPollTimeout caps wall-clock time spent on the deployment_poll
// stage. Anything longer is treated as a stuck deployment and surfaced as
// a terminal failure rather than letting the job hang. cf-cli v8 has no
// hard ceiling here — it polls until the user kills the command — but
// Stratos jobs need a definite end so the frontend stops polling.
const RollbackPollTimeout = 30 * time.Minute

// RollbackStage names a single step in the v3 rollback state machine.
// Like RestageStage, these names are surfaced to the frontend through
// the Stratos job's result.stages[]; treat as a wire contract.
type RollbackStage string

const (
	StageRollbackDeploymentCreate RollbackStage = "deployment_create"
	StageRollbackDeploymentPoll   RollbackStage = "deployment_poll"
)

// RollbackStageRecord is one entry in the Stratos job's result.stages[]
// for a rollback. Mirrors RestageStageRecord shape (separate type so the
// JSON tag set is independent — different lifecycles, no shared field
// drift risk).
type RollbackStageRecord struct {
	Stage     RollbackStage     `json:"stage"`
	State     RestageStageState `json:"state"`
	StartedAt time.Time         `json:"startedAt,omitempty"`
	EndedAt   time.Time         `json:"endedAt,omitempty"`
	Detail    string            `json:"detail,omitempty"`
	Error     string            `json:"error,omitempty"`
}

// RollbackRef is the per-job state carried by the Tracker and consumed
// by RollbackJobTranslator on each Refresh poll. NOT on the wire — the
// frontend only sees the projected RollbackStageRecord list via the
// job's result.stages[].
type RollbackRef struct {
	CNSIGuid     string
	UserGuid     string
	AppGuid      string
	RevisionGuid string
	// Strategy is the deployment strategy ("rolling" or "canary").
	// Empty string is treated as "rolling" by the handler before
	// constructing the ref.
	Strategy string

	// DeploymentGuid is created by deployment_create; consumed by
	// deployment_poll.
	DeploymentGuid string

	// CurrentStage names the next stage to execute or the in-flight
	// stage being polled. The empty string means terminal (success).
	CurrentStage RollbackStage

	// Stages is the running history surfaced as result.stages[] on the
	// job.
	Stages []RollbackStageRecord
}

// advanceRollback advances the rollback state machine by one stage.
// Mirror of advanceRestage; same dispatch shape.
func advanceRollback(
	ctx context.Context,
	client capi.Client,
	ref *RollbackRef,
	now func() time.Time,
) (stratosjobs.JobState, []stratosjobs.StratosError, error) {
	if now == nil {
		now = time.Now
	}
	if ref.CurrentStage == "" {
		// Already terminal — caller should not be polling, but tolerate.
		return stratosjobs.JobStateComplete, nil, nil
	}

	rec := ensureRollbackStageInProgress(ref, ref.CurrentStage, now)

	switch ref.CurrentStage {
	case StageRollbackDeploymentCreate:
		return advanceRollbackDeploymentCreate(ctx, client, ref, rec, now)
	case StageRollbackDeploymentPoll:
		return advanceRollbackDeploymentPoll(ctx, client, ref, rec, now)
	default:
		return stratosjobs.JobStateFailed, []stratosjobs.StratosError{{
			Code:    "stratos.rollback.invalid_stage",
			Message: fmt.Sprintf("unknown rollback stage: %q", ref.CurrentStage),
		}}, nil
	}
}

// ensureRollbackStageInProgress returns a pointer to the stage record
// for `stage`, creating it (with state=in_progress) if missing.
// Idempotent. Mirror of ensureStageInProgress.
func ensureRollbackStageInProgress(ref *RollbackRef, stage RollbackStage, now func() time.Time) *RollbackStageRecord {
	for i := range ref.Stages {
		if ref.Stages[i].Stage == stage {
			return &ref.Stages[i]
		}
	}
	ref.Stages = append(ref.Stages, RollbackStageRecord{
		Stage:     stage,
		State:     StageStateInProgress,
		StartedAt: now(),
	})
	return &ref.Stages[len(ref.Stages)-1]
}

// completeRollbackStage marks rec as done with an optional human-facing
// detail. Mirror of completeStage.
func completeRollbackStage(rec *RollbackStageRecord, detail string, now func() time.Time) {
	rec.State = StageStateDone
	rec.EndedAt = now()
	if detail != "" {
		rec.Detail = detail
	}
}

// failRollbackStage marks rec as failed and produces the StratosError
// envelope. Mirror of failStage.
func failRollbackStage(rec *RollbackStageRecord, err error, now func() time.Time) (stratosjobs.JobState, []stratosjobs.StratosError, error) {
	rec.State = StageStateFailed
	rec.EndedAt = now()
	rec.Error = err.Error()
	return stratosjobs.JobStateFailed, []stratosjobs.StratosError{{
		Code:    "stratos.rollback." + string(rec.Stage),
		Message: err.Error(),
	}}, nil
}

// advanceRollbackDeploymentCreate POSTs /v3/deployments with the
// revision GUID and strategy, captures the deployment GUID in the ref,
// and advances to the poll stage.
//
// Maps to: POST /v3/deployments
//
//	{
//	  "strategy": "<strategy>",
//	  "revision": {"guid": "<rev>"},
//	  "relationships": {"app": {"data": {"guid": "<app>"}}}
//	}
func advanceRollbackDeploymentCreate(
	ctx context.Context,
	client capi.Client,
	ref *RollbackRef,
	rec *RollbackStageRecord,
	now func() time.Time,
) (stratosjobs.JobState, []stratosjobs.StratosError, error) {
	strategy := ref.Strategy
	req := &capi.DeploymentCreateRequest{
		Revision: &capi.DeploymentRevisionRef{GUID: ref.RevisionGuid},
		Relationships: capi.DeploymentRelationships{
			App: &capi.Relationship{Data: &capi.RelationshipData{GUID: ref.AppGuid}},
		},
	}
	if strategy != "" {
		req.Strategy = &strategy
	}

	dep, err := client.Deployments().Create(ctx, req)
	if err != nil {
		return failRollbackStage(rec, err, now)
	}
	if dep == nil || dep.GUID == "" {
		return failRollbackStage(rec, fmt.Errorf("deployment create returned empty guid"), now)
	}
	ref.DeploymentGuid = dep.GUID
	completeRollbackStage(rec, "deployment="+dep.GUID, now)
	ref.CurrentStage = StageRollbackDeploymentPoll
	return stratosjobs.JobStateProcessing, nil, nil
}

// advanceRollbackDeploymentPoll performs a single GET on the deployment
// and either advances (FINALIZED+DEPLOYED), terminally fails
// (FINALIZED+CANCELED, FINALIZED+SUPERSEDED, polling-budget exceeded), or
// stays on the poll stage.
//
// Reason codes mirror CF v3's deployment status taxonomy:
//   - DEPLOYED   — terminal success.
//   - CANCELED   — operator (or CF) canceled the deployment; the
//     status.details.error string typically explains why (e.g.
//     "instances crashed").
//   - SUPERSEDED — a newer deployment for the same app started, so this
//     one is abandoned by CF.
//
// The polling timeout is wall-clock from the stage's StartedAt; this is
// the only place the orchestrator imposes its own deadline (CF itself
// keeps the deployment record indefinitely).
func advanceRollbackDeploymentPoll(
	ctx context.Context,
	client capi.Client,
	ref *RollbackRef,
	rec *RollbackStageRecord,
	now func() time.Time,
) (stratosjobs.JobState, []stratosjobs.StratosError, error) {
	dep, err := client.Deployments().Get(ctx, ref.DeploymentGuid)
	if err != nil {
		return failRollbackStage(rec, err, now)
	}

	// Branch 1: FINALIZED + DEPLOYED — terminal success.
	if dep.Status.Value == "FINALIZED" && dep.Status.Reason == "DEPLOYED" {
		completeRollbackStage(rec, "deployed", now)
		ref.CurrentStage = ""
		return stratosjobs.JobStateComplete, nil, nil
	}

	// Branch 2: FINALIZED + CANCELED — terminal failure. Propagate
	// status.details.error if present (mirror of advanceBuildPoll's
	// build.Error handling — CF's user-facing reason).
	if dep.Status.Value == "FINALIZED" && dep.Status.Reason == "CANCELED" {
		msg := "Deployment canceled"
		if dep.Status.Details != nil && dep.Status.Details.Error != nil && *dep.Status.Details.Error != "" {
			msg = *dep.Status.Details.Error
		}
		return failRollbackStage(rec, errors.New(msg), now)
	}

	// Branch 3: FINALIZED + SUPERSEDED — terminal failure. CF has
	// abandoned this deployment because a newer one started.
	if dep.Status.Value == "FINALIZED" && dep.Status.Reason == "SUPERSEDED" {
		return failRollbackStage(rec, errors.New("Superseded by another deployment"), now)
	}

	// Branch 4: polling budget exceeded — terminal failure. Use the
	// stage's StartedAt as the reference point so a single hung poll
	// doesn't bias the budget.
	if !rec.StartedAt.IsZero() && now().Sub(rec.StartedAt) > RollbackPollTimeout {
		return failRollbackStage(rec, errors.New("Rollback polling timed out"), now)
	}

	// Otherwise (ACTIVE/DEPLOYING, etc.) — stay on this stage.
	return stratosjobs.JobStateProcessing, nil, nil
}

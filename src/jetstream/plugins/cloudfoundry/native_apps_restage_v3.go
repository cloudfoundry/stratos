// src/jetstream/plugins/cloudfoundry/native_apps_restage_v3.go
//
// V3 restage orchestration types and primitives. The end-to-end design is
// documented in
//   stratos/docs/2026-04-30-A8-restage-orchestration-design.md
// (knowledge store).
//
// This file is built incrementally. Each slice adds one more step of the
// 9-step v3 restage sequence with tests, and the orchestrator that ties
// them together lands once all primitives are in place.
package cloudfoundry

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
)

// RestageStage names a single step in the v3 restage state machine. The
// stage names are surfaced to the frontend through the Stratos job's
// result.stages[]; treat them as a wire contract.
type RestageStage string

const (
	StageRestagePackageLookup    RestageStage = "package_lookup"
	StageRestageBuildCreate      RestageStage = "build_create"
	StageRestageBuildPoll        RestageStage = "build_poll"
	StageRestageSetDroplet       RestageStage = "set_droplet"
	StageRestageStop             RestageStage = "stop"
	StageRestageStart            RestageStage = "start"
	StageRestageInstancePoll     RestageStage = "instance_poll"
	StageRestageDeploymentCreate RestageStage = "deployment_create"
	StageRestageDeploymentPoll   RestageStage = "deployment_poll"
)

// RestageStageState is the lifecycle of an individual stage. A stage moves
// pending → in_progress → done|failed; the orchestrator never reverses.
type RestageStageState string

const (
	StageStatePending    RestageStageState = "pending"
	StageStateInProgress RestageStageState = "in_progress"
	StageStateDone       RestageStageState = "done"
	StageStateFailed     RestageStageState = "failed"
)

// RestageStageRecord is one entry in the Stratos job's result.stages[].
// The frontend renders a list of these to show progress and outcome.
type RestageStageRecord struct {
	Stage     RestageStage      `json:"stage"`
	State     RestageStageState `json:"state"`
	StartedAt time.Time         `json:"startedAt,omitempty"`
	EndedAt   time.Time         `json:"endedAt,omitempty"`
	Detail    string            `json:"detail,omitempty"`
	Error     string            `json:"error,omitempty"`
}

// RestageStrategy mirrors cf-cli v8's --strategy flag values.
// Empty string means the legacy downtime path (stop → set-droplet → start).
type RestageStrategy string

const (
	RestageStrategyDowntime RestageStrategy = ""
	RestageStrategyRolling  RestageStrategy = "rolling"
	RestageStrategyCanary   RestageStrategy = "canary"
)

// RestageRequest is the caller-supplied body for POST
// /pp/v1/cf/apps/:cnsi/:app/actions/restage. All fields optional.
//
// Constraints (validated server-side, mirroring cf-cli v8):
//   - MaxInFlight: only meaningful when Strategy != Downtime; ignored otherwise.
//   - InstanceSteps: only meaningful when Strategy == Canary; ignored otherwise.
type RestageRequest struct {
	Strategy      RestageStrategy `json:"strategy,omitempty"`
	NoWait        bool            `json:"noWait,omitempty"`
	MaxInFlight   int             `json:"maxInFlight,omitempty"`
	InstanceSteps []int           `json:"instanceSteps,omitempty"`
}

// RestageRef is the per-job state carried by the Tracker and consumed by
// the JobTranslator on each Refresh poll. It is NOT on the wire — the
// frontend only sees the projected RestageStageRecord list via the job's
// result.stages[].
//
// The translator advances the state machine by inspecting CurrentStage
// and the live CF state for the relevant entity (build/deployment/process)
// then transitioning forward.
type RestageRef struct {
	CNSIGuid string
	UserGuid string
	AppGuid  string
	Strategy RestageStrategy
	NoWait   bool

	// PackageGuid resolved by package_lookup; consumed by build_create.
	PackageGuid string
	// BuildGuid created by build_create; consumed by build_poll.
	BuildGuid string
	// DropletGuid surfaced by build_poll; consumed by set_droplet.
	DropletGuid string
	// DeploymentGuid created by deployment_create (rolling/canary path).
	DeploymentGuid string

	// WebProcessGuid is a runtime cache resolved on first instance_poll.
	// Not on the wire — the frontend reads stage records, not ref state.
	WebProcessGuid string

	// CurrentStage names the next stage to execute or the in-flight stage
	// being polled. The empty string means terminal (success).
	CurrentStage RestageStage

	// Stages is the running history surfaced as result.stages[] on the job.
	Stages []RestageStageRecord
}

// errNoReadyPackage is returned when an app has no v3 packages in state
// READY. cf-cli surfaces NoEligiblePackagesError; we keep the contract
// distinguishable so callers can map to a translatable user error.
var errNoReadyPackage = errors.New("no READY package available for app")

// errBuildFailed is returned when a v3 build poll observes the build
// transitioning to FAILED. cf-cli surfaces StagingFailedError /
// StagingFailedNoAppDetectedError variants; we keep one terminal sentinel
// so callers can map to a translatable user error and surface CF's
// build.Error string as the cause.
var errBuildFailed = errors.New("v3 build failed during staging")

// errAllInstancesCrashed is returned when an instance-poll observes
// every running instance in CRASHED state simultaneously. cf-cli's
// AllInstancesCrashedError corresponds; surfaced as a terminal failure
// so the user sees "App failed to start" rather than waiting for the
// startup timeout.
var errAllInstancesCrashed = errors.New("all app instances crashed during start")

// errNoWebProcess is returned when an app has no web process. Shouldn't
// normally happen post-restage (the build creates a web process), but
// kept distinct so the orchestrator can surface a clear failure rather
// than a generic empty-list confusion.
var errNoWebProcess = errors.New("app has no web process")

// getNewestReadyPackage resolves the GUID of the most recently created
// package in state READY for the given app. This is step 1 of the v3
// restage sequence: cf-cli's `actor.GetNewestReadyPackageForApplication`.
//
// Maps to: GET /v3/packages?app_guids=<a>&states=READY&order_by=-created_at&per_page=1
//
// Returns errNoReadyPackage if the app has no eligible package — the
// orchestrator treats this as a terminal failure (can't restage without
// a buildable package).
func getNewestReadyPackage(ctx context.Context, client capi.Client, appGUID string) (string, error) {
	params := capi.NewQueryParams()
	params.PerPage = 1
	params.OrderBy = "-created_at"
	params.Filters["app_guids"] = []string{appGUID}
	params.Filters["states"] = []string{"READY"}

	resp, err := client.Packages().List(ctx, params)
	if err != nil {
		return "", err
	}
	if len(resp.Resources) == 0 {
		return "", errNoReadyPackage
	}
	return resp.Resources[0].GUID, nil
}

// createBuildForPackage kicks a v3 build for the given package, returning
// the new build's GUID. Step 2 of the v3 restage sequence: cf-cli's
// `actor.StagePackage` (the Create-build phase only; polling is step 3).
//
// Maps to: POST /v3/builds {"package":{"guid":"<p>"}}
//
// CF v3 returns the build with state STAGING; the build polls advance it
// to STAGED (success) or FAILED. See pollBuildUntilTerminal.
func createBuildForPackage(ctx context.Context, client capi.Client, packageGUID string) (string, error) {
	build, err := client.Builds().Create(ctx, &capi.BuildCreateRequest{
		Package: &capi.BuildPackageRef{GUID: packageGUID},
	})
	if err != nil {
		return "", err
	}
	return build.GUID, nil
}

// setCurrentDroplet sets the active droplet for an app via v3 relationship
// update. Step 4 of the v3 restage sequence: cf-cli's
// `actor.SetApplicationDroplet`. Also the entry point for v3 rollback —
// callers pass an existing droplet GUID for a previous revision.
//
// Maps to: PATCH /v3/apps/<a>/relationships/current_droplet
//          {"data":{"guid":"<droplet>"}}
//
// CF responds 200 OK with the updated relationship; the returned
// Relationship.Data.GUID matches the requested droplet on success.
func setCurrentDroplet(ctx context.Context, client capi.Client, appGUID, dropletGUID string) error {
	_, err := client.Apps().SetCurrentDroplet(ctx, appGUID, dropletGUID)
	return err
}

// stopApp kicks a v3 stop on an app. Step 5 of the v3 restage sequence
// (downtime path). cf-cli calls this between set-droplet on the running
// path and start; it ensures CF tears down old instances cleanly.
//
// Maps to: POST /v3/apps/<a>/actions/stop
//
// CF v3 returns 202 + Location → /v3/jobs/<jobGuid>; the fork's
// AppLifecycleClient.Stop populates the returned Job.GUID from that
// header. Callers wait for the stop to complete via
// client.Jobs().PollUntilComplete(ctx, job.GUID) before proceeding.
func stopApp(ctx context.Context, client capi.Client, appGUID string) (*capi.Job, error) {
	return client.Apps().Stop(ctx, appGUID)
}

// getWebProcessGUID resolves the GUID of the web-type process for an
// app. Step 7a of the v3 restage sequence: cf-cli polls process stats
// after start; we need the process GUID to query
// /v3/processes/<guid>/stats.
//
// Maps to: GET /v3/processes?app_guids=<a>&types=web&per_page=1
//
// Returns errNoWebProcess if the app has no web process. This shouldn't
// normally occur for a freshly-staged droplet but the orchestrator
// surfaces it as a clear error rather than a generic missing-resource.
func getWebProcessGUID(ctx context.Context, client capi.Client, appGUID string) (string, error) {
	params := capi.NewQueryParams()
	params.PerPage = 1
	params.Filters["app_guids"] = []string{appGUID}
	params.Filters["types"] = []string{"web"}

	resp, err := client.Processes().List(ctx, params)
	if err != nil {
		return "", err
	}
	if len(resp.Resources) == 0 {
		return "", errNoWebProcess
	}
	return resp.Resources[0].GUID, nil
}

// pollInstancesUntilRunning polls a process's instance stats until the
// startup criterion is met. Step 7b of the v3 restage sequence:
// cf-cli's `actor.PollStart`.
//
// Maps to: GET /v3/processes/<process_guid>/stats
//
// Termination criteria:
//   - All instances RUNNING → success.
//   - noWait==true and ≥1 instance RUNNING → success (matches cf-cli's
//     --no-wait short-circuit).
//   - All non-DOWN instances are CRASHED → errAllInstancesCrashed (fail
//     fast rather than waiting for CF_STARTUP_TIMEOUT).
//   - ctx cancellation → ctx.Err() (typically CF_STARTUP_TIMEOUT, default
//     5min, set by the caller).
//
// pollInterval is parameterized so tests run with millisecond cadence
// while production uses cf-cli's 5s default.
func pollInstancesUntilRunning(
	ctx context.Context,
	client capi.Client,
	processGUID string,
	noWait bool,
	pollInterval time.Duration,
) error {
	for {
		stats, err := client.Processes().GetStats(ctx, processGUID)
		if err != nil {
			return err
		}
		state := summarizeInstanceStates(stats.Resources)
		if state.allRunning && len(stats.Resources) > 0 {
			return nil
		}
		if noWait && state.someRunning {
			return nil
		}
		if state.allCrashed {
			return errAllInstancesCrashed
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(pollInterval):
		}
	}
}

// instanceStateSummary captures the aggregated outcomes the
// pollInstancesUntilRunning loop branches on.
type instanceStateSummary struct {
	allRunning  bool
	someRunning bool
	allCrashed  bool // true iff at least one instance exists AND every non-DOWN instance is CRASHED
}

func summarizeInstanceStates(instances []capi.ProcessStatsDetail) instanceStateSummary {
	if len(instances) == 0 {
		return instanceStateSummary{}
	}
	var runningCount, crashedCount, nonDownCount int
	for _, inst := range instances {
		if inst.State != "DOWN" {
			nonDownCount++
		}
		switch inst.State {
		case "RUNNING":
			runningCount++
		case "CRASHED":
			crashedCount++
		}
	}
	return instanceStateSummary{
		allRunning:  runningCount == len(instances),
		someRunning: runningCount > 0,
		allCrashed:  nonDownCount > 0 && crashedCount == nonDownCount,
	}
}

// startApp kicks a v3 start on an app. Step 6 of the v3 restage
// sequence (downtime path) and the "spin up the new droplet" trigger.
//
// Maps to: POST /v3/apps/<a>/actions/start
//
// CF v3 returns 202 + Location → /v3/jobs/<jobGuid>; the fork's
// AppLifecycleClient.Start populates the returned Job.GUID from that
// header. The orchestrator polls instances after start, not the start
// job itself — instance state is the real "is the app running"
// signal.
func startApp(ctx context.Context, client capi.Client, appGUID string) (*capi.Job, error) {
	return client.Apps().Start(ctx, appGUID)
}

// pollBuildUntilTerminal polls a v3 build until it reaches a terminal
// state. Step 3 of the v3 restage sequence: cf-cli's actor build poll
// loop inside `StagePackage`.
//
// Maps to: GET /v3/builds/<build_guid>
//
// State machine:
//   - "STAGED"  → returns the build (Droplet.GUID populated by CF).
//   - "FAILED"  → returns the build + errBuildFailed; build.Error holds CF's reason.
//   - "STAGING" → continues polling.
//
// Honors context cancellation between polls so callers can impose
// CF_STAGING_TIMEOUT (default 15min) via context.WithTimeout.
//
// pollInterval is the duration between polls. cf-cli v8 uses 5s by
// default; tests pass a small value.
func pollBuildUntilTerminal(
	ctx context.Context,
	client capi.Client,
	buildGUID string,
	pollInterval time.Duration,
) (*capi.Build, error) {
	for {
		build, err := client.Builds().Get(ctx, buildGUID)
		if err != nil {
			return nil, err
		}
		switch build.State {
		case "STAGED":
			return build, nil
		case "FAILED":
			return build, errBuildFailed
		}
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(pollInterval):
		}
	}
}

// advanceRestage drives the v3 restage state machine forward by ONE stage
// per call. It is invoked by the JobTranslator on each Tracker.Refresh
// poll, so individual HTTP requests stay short — multi-minute waits
// (build staging, instance startup) are expressed as repeated stays on
// the BUILD_POLL / INSTANCE_POLL stages.
//
// Returns the Stratos job state to surface (PROCESSING during in-flight,
// COMPLETE on terminal success, FAILED on terminal failure) plus any
// StratosError envelope. The transport-error return is reserved for
// internal logic faults (unknown stage); CF transport errors are mapped
// to per-stage failures so the job's stage list shows where it broke.
//
// This is the downtime-strategy path only:
//
//	package_lookup → build_create → build_poll → set_droplet
//	             → stop → start → instance_poll → terminal
//
// Rolling / canary paths add a deployment_create + deployment_poll
// branch and are introduced in a follow-up slice.
func advanceRestage(
	ctx context.Context,
	client capi.Client,
	ref *RestageRef,
	now func() time.Time,
) (stratosjobs.JobState, []stratosjobs.StratosError, error) {
	if now == nil {
		now = time.Now
	}
	if ref.CurrentStage == "" {
		// Already terminal — caller should not be polling, but tolerate.
		return stratosjobs.JobStateComplete, nil, nil
	}

	rec := ensureStageInProgress(ref, ref.CurrentStage, now)

	switch ref.CurrentStage {
	case StageRestagePackageLookup:
		return advancePackageLookup(ctx, client, ref, rec, now)
	case StageRestageBuildCreate:
		return advanceBuildCreate(ctx, client, ref, rec, now)
	case StageRestageBuildPoll:
		return advanceBuildPoll(ctx, client, ref, rec, now)
	case StageRestageSetDroplet:
		return advanceSetDroplet(ctx, client, ref, rec, now)
	case StageRestageStop:
		return advanceStop(ctx, client, ref, rec, now)
	case StageRestageStart:
		return advanceStart(ctx, client, ref, rec, now)
	case StageRestageInstancePoll:
		return advanceInstancePoll(ctx, client, ref, rec, now)
	default:
		return stratosjobs.JobStateFailed, []stratosjobs.StratosError{{
			Code:    "stratos.restage.invalid_stage",
			Message: fmt.Sprintf("unknown restage stage: %q", ref.CurrentStage),
		}}, nil
	}
}

// ensureStageInProgress returns a pointer to the stage record for `stage`,
// creating it (with state=in_progress) if missing. Idempotent — second
// and subsequent calls for the same stage return the existing record.
func ensureStageInProgress(ref *RestageRef, stage RestageStage, now func() time.Time) *RestageStageRecord {
	for i := range ref.Stages {
		if ref.Stages[i].Stage == stage {
			return &ref.Stages[i]
		}
	}
	ref.Stages = append(ref.Stages, RestageStageRecord{
		Stage:     stage,
		State:     StageStateInProgress,
		StartedAt: now(),
	})
	return &ref.Stages[len(ref.Stages)-1]
}

// completeStage marks rec as done with an optional human-facing detail.
func completeStage(rec *RestageStageRecord, detail string, now func() time.Time) {
	rec.State = StageStateDone
	rec.EndedAt = now()
	if detail != "" {
		rec.Detail = detail
	}
}

// failStage marks rec as failed with the error string and produces the
// StratosError envelope for the Stratos job's errors[].
func failStage(rec *RestageStageRecord, err error, now func() time.Time) (stratosjobs.JobState, []stratosjobs.StratosError, error) {
	rec.State = StageStateFailed
	rec.EndedAt = now()
	rec.Error = err.Error()
	return stratosjobs.JobStateFailed, []stratosjobs.StratosError{{
		Code:    "stratos.restage." + string(rec.Stage),
		Message: err.Error(),
	}}, nil
}

func advancePackageLookup(ctx context.Context, client capi.Client, ref *RestageRef, rec *RestageStageRecord, now func() time.Time) (stratosjobs.JobState, []stratosjobs.StratosError, error) {
	guid, err := getNewestReadyPackage(ctx, client, ref.AppGuid)
	if err != nil {
		return failStage(rec, err, now)
	}
	ref.PackageGuid = guid
	completeStage(rec, "package="+guid, now)
	ref.CurrentStage = StageRestageBuildCreate
	return stratosjobs.JobStateProcessing, nil, nil
}

func advanceBuildCreate(ctx context.Context, client capi.Client, ref *RestageRef, rec *RestageStageRecord, now func() time.Time) (stratosjobs.JobState, []stratosjobs.StratosError, error) {
	guid, err := createBuildForPackage(ctx, client, ref.PackageGuid)
	if err != nil {
		return failStage(rec, err, now)
	}
	ref.BuildGuid = guid
	completeStage(rec, "build="+guid, now)
	ref.CurrentStage = StageRestageBuildPoll
	return stratosjobs.JobStateProcessing, nil, nil
}

// advanceBuildPoll performs a single GET on the build and either advances
// or stays on the BUILD_POLL stage. Multi-minute staging waits are
// expressed as repeated stays.
func advanceBuildPoll(ctx context.Context, client capi.Client, ref *RestageRef, rec *RestageStageRecord, now func() time.Time) (stratosjobs.JobState, []stratosjobs.StratosError, error) {
	build, err := client.Builds().Get(ctx, ref.BuildGuid)
	if err != nil {
		return failStage(rec, err, now)
	}
	switch build.State {
	case "STAGED":
		if build.Droplet == nil || build.Droplet.GUID == "" {
			return failStage(rec, errors.New("build STAGED but droplet GUID missing"), now)
		}
		ref.DropletGuid = build.Droplet.GUID
		completeStage(rec, "droplet="+build.Droplet.GUID, now)
		ref.CurrentStage = StageRestageSetDroplet
		return stratosjobs.JobStateProcessing, nil, nil
	case "FAILED":
		msg := errBuildFailed.Error()
		if build.Error != nil && *build.Error != "" {
			msg = *build.Error
		}
		return failStage(rec, errors.New(msg), now)
	}
	// STAGING (or anything non-terminal) — stay on this stage.
	return stratosjobs.JobStateProcessing, nil, nil
}

func advanceSetDroplet(ctx context.Context, client capi.Client, ref *RestageRef, rec *RestageStageRecord, now func() time.Time) (stratosjobs.JobState, []stratosjobs.StratosError, error) {
	if err := setCurrentDroplet(ctx, client, ref.AppGuid, ref.DropletGuid); err != nil {
		return failStage(rec, err, now)
	}
	completeStage(rec, "current droplet set", now)
	ref.CurrentStage = StageRestageStop
	return stratosjobs.JobStateProcessing, nil, nil
}

// advanceStop kicks the v3 stop and immediately advances to start. CF
// queues start-while-stopping (POST /v3/apps/<a>/actions/start during a
// pending stop is accepted), and the subsequent INSTANCE_POLL stage is
// the canonical "is the new droplet alive" signal. We deliberately don't
// poll the stop job here — that would add a stage with no UX value.
func advanceStop(ctx context.Context, client capi.Client, ref *RestageRef, rec *RestageStageRecord, now func() time.Time) (stratosjobs.JobState, []stratosjobs.StratosError, error) {
	if _, err := stopApp(ctx, client, ref.AppGuid); err != nil {
		return failStage(rec, err, now)
	}
	completeStage(rec, "stop kicked", now)
	ref.CurrentStage = StageRestageStart
	return stratosjobs.JobStateProcessing, nil, nil
}

func advanceStart(ctx context.Context, client capi.Client, ref *RestageRef, rec *RestageStageRecord, now func() time.Time) (stratosjobs.JobState, []stratosjobs.StratosError, error) {
	if _, err := startApp(ctx, client, ref.AppGuid); err != nil {
		return failStage(rec, err, now)
	}
	completeStage(rec, "start kicked", now)
	ref.CurrentStage = StageRestageInstancePoll
	return stratosjobs.JobStateProcessing, nil, nil
}

// advanceInstancePoll caches the web-process GUID on first call, then
// performs one stats GET per call. Termination criteria match
// pollInstancesUntilRunning's blocking form: all-running (or some-running
// under noWait) → COMPLETE; all-crashed → FAILED; otherwise stay.
func advanceInstancePoll(ctx context.Context, client capi.Client, ref *RestageRef, rec *RestageStageRecord, now func() time.Time) (stratosjobs.JobState, []stratosjobs.StratosError, error) {
	if ref.WebProcessGuid == "" {
		guid, err := getWebProcessGUID(ctx, client, ref.AppGuid)
		if err != nil {
			return failStage(rec, err, now)
		}
		ref.WebProcessGuid = guid
	}
	stats, err := client.Processes().GetStats(ctx, ref.WebProcessGuid)
	if err != nil {
		return failStage(rec, err, now)
	}
	state := summarizeInstanceStates(stats.Resources)
	if state.allRunning && len(stats.Resources) > 0 {
		completeStage(rec, fmt.Sprintf("%d instances running", len(stats.Resources)), now)
		ref.CurrentStage = ""
		return stratosjobs.JobStateComplete, nil, nil
	}
	if ref.NoWait && state.someRunning {
		completeStage(rec, "no-wait: at least one instance running", now)
		ref.CurrentStage = ""
		return stratosjobs.JobStateComplete, nil, nil
	}
	if state.allCrashed {
		return failStage(rec, errAllInstancesCrashed, now)
	}
	return stratosjobs.JobStateProcessing, nil, nil
}

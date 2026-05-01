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
	"time"

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

	// CurrentStage names the next stage to execute or the in-flight stage
	// being polled.
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

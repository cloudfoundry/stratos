// src/jetstream/plugins/cloudfoundry/native_apps_writes.go
package cloudfoundry

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// allowedAppActions is the set of lifecycle verbs the POST app-action handler
// accepts. Anything outside this set is rejected with 400 before any capi call.
var allowedAppActions = map[string]bool{
	"start":   true,
	"stop":    true,
	"restart": true,
	"restage": true,
}

// deleteNativeApp handles DELETE /pp/v1/cf/apps/{cnsiGuid}/{appGuid} —
// the Stratos-shape write wrapper around CF v3 /v3/apps/{guid}.
//
// CF v3 returns 202 Accepted with a Location header pointing at
// /v3/jobs/{guid}. We hand that job to the stratosjobs fast-path wrapper:
// if the job resolves inside the fast-path window we return 200 with a
// terminal StratosJob body; otherwise we register the job in the tracker
// and return 202 with {id, state, startedAt} so the frontend can poll
// /pp/v1/stratos/jobs/{id}.
func (c *CloudFoundrySpecification) deleteNativeApp(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	appGUID := ctx.Param("appGuid")
	if cnsiGUID == "" || appGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and appGuid are required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	reqCtx := ctx.Request().Context()
	cfClient, err := newCapiClient(reqCtx, c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	job, deleteErr := cfClient.Apps().Delete(reqCtx, appGUID)
	if deleteErr != nil {
		return handleCapiError(ctx, deleteErr)
	}
	if job == nil || job.GUID == "" {
		// Shouldn't happen with the corrected capi.AppsClient.Delete, but
		// guard so a bad capi version can't silently strand the UI.
		return echo.NewHTTPError(http.StatusBadGateway, "app delete: no job id returned from CF")
	}

	// If async-jobs wiring is unavailable (plugin registered out of order,
	// or test-harness missing it) fall back to the pre-contract behavior:
	// return 202 without tracking. Frontend's 404-on-poll rule handles the
	// resulting "unknown" status gracefully.
	if c.asyncTracker == nil || c.asyncTranslator == nil {
		ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		ctx.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, c.asyncTracker, c.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.app.delete",
	})

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	if res.Resolved {
		// Terminal within window. 200 on COMPLETE, 502 on FAILED (the CF job
		// failed server-side — 502 signals "upstream refused"; body carries
		// the CF error envelope).
		if res.State == stratosjobs.JobStateFailed {
			return ctx.JSON(http.StatusBadGateway, map[string]interface{}{
				"state":  res.State,
				"errors": res.Errors,
			})
		}
		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"state":  res.State,
			"result": res.Result,
		})
	}
	// Handoff path — tracker registered; frontend polls.
	return ctx.JSON(http.StatusAccepted, res.HandoffJob)
}

// appAction handles POST /pp/v1/cf/apps/{cnsiGuid}/{appGuid}/actions/{action}
// for action in {start, stop, restart, restage}.
//
// All four CF v3 /v3/apps/{guid}/actions/{action} endpoints are async: CF
// responds 202 Accepted + Location → /v3/jobs/{jobGuid}. The fork's
// AppsClient returns that Job directly. We hand the job GUID to the
// stratosjobs fast-path wrapper — same pattern as deleteNativeApp — so
// the UI sees either 200 with terminal state (fast-path resolve) or
// 202 + {id, state, startedAt} handoff for client polling.
func (c *CloudFoundrySpecification) appAction(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	appGUID := ctx.Param("appGuid")
	action := ctx.Param("action")
	if cnsiGUID == "" || appGUID == "" || !allowedAppActions[action] {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid params (action=%q)", action))
	}

	// Restage has no atomic v3 endpoint — it is composed of ~7 v3 calls
	// (newest READY package → build → poll → set-droplet → stop → start
	// → poll instances). The orchestration runs through the Stratos
	// async-job contract and is dispatched through restageApp.
	if action == "restage" {
		return c.restageApp(ctx, cnsiGUID, appGUID)
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	reqCtx := ctx.Request().Context()
	cfClient, err := newCapiClient(reqCtx, c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	var job *capi.Job
	var actionErr error
	switch action {
	case "start":
		job, actionErr = cfClient.Apps().Start(reqCtx, appGUID)
	case "stop":
		job, actionErr = cfClient.Apps().Stop(reqCtx, appGUID)
	case "restart":
		job, actionErr = cfClient.Apps().Restart(reqCtx, appGUID)
	}
	if actionErr != nil {
		return handleCapiError(ctx, actionErr)
	}
	// Sync-complete path: older CF (< ~3.200) returns 200 + App body
	// with no Location header, so the fork returns (nil, nil). The
	// action is already done — return a terminal COMPLETE envelope.
	if job == nil {
		ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"state": stratosjobs.JobStateComplete,
		})
	}
	if job.GUID == "" {
		return echo.NewHTTPError(http.StatusBadGateway, fmt.Sprintf("app %s: malformed job id from CF", action))
	}

	if c.asyncTracker == nil || c.asyncTranslator == nil {
		ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		ctx.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, c.asyncTracker, c.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.app." + action,
	})

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	if res.Resolved {
		if res.State == stratosjobs.JobStateFailed {
			return ctx.JSON(http.StatusBadGateway, map[string]interface{}{
				"state":  res.State,
				"errors": res.Errors,
			})
		}
		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"state":  res.State,
			"result": res.Result,
		})
	}
	return ctx.JSON(http.StatusAccepted, res.HandoffJob)
}

// restageApp handles POST /pp/v1/cf/apps/{cnsiGuid}/{appGuid}/actions/restage.
//
// CF v3 has no atomic restage endpoint — it is composed of ~7 calls
// (newest READY package → build → poll → set-droplet → stop → start →
// poll instances). cf-cli v8's shared.AppStager implements the same
// composition. We expose this composition behind the Stratos async-job
// contract so the UI sees a uniform handoff/poll shape regardless of
// how many round-trips the orchestrator made.
//
// Optional request body:
//
//	{
//	  "strategy": "" | "rolling" | "canary",   // downtime path = ""
//	  "noWait": false,                          // exit on first RUNNING
//	  "maxInFlight": 1,                         // rolling/canary only
//	  "instanceSteps": [10,25,50]               // canary only
//	}
//
// Empty body is valid and selects the downtime strategy with default
// startup-wait semantics. Slices ≥10 implement rolling/canary; this
// handler accepts the body fields now to keep the wire shape stable
// once those slices land.
//
// Response shape mirrors the other lifecycle handlers (delete, scale):
//   - 200 + {state, result?, errors?} when the orchestrator drained
//     within the fast-path window (rare for restage — package+build kick
//     finish in <3s, but staging takes minutes).
//   - 202 + handoff job when the orchestrator handed off; the frontend
//     polls /pp/v1/stratosjobs/{id} and renders ref.Stages from the
//     terminal result.
func (c *CloudFoundrySpecification) restageApp(ctx echo.Context, cnsiGUID, appGUID string) error {
	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	if c.asyncTracker == nil || c.restageTranslator == nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "restage: stratosjobs not registered")
	}

	req := RestageRequest{}
	if ctx.Request().Body != nil && ctx.Request().ContentLength > 0 {
		if err := json.NewDecoder(ctx.Request().Body).Decode(&req); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("restage: invalid body: %v", err))
		}
	}

	switch req.Strategy {
	case RestageStrategyDowntime, RestageStrategyRolling, RestageStrategyCanary:
		// Downtime: stop → set_droplet → start → instance_poll.
		// Rolling/canary: deployment_create → deployment_poll (CF
		// orchestrates the rolling instance swap; canary parks at
		// ACTIVE/PAUSED awaiting human continue/cancel issued via
		// cf cli — Stratos UI continue/cancel endpoints are a follow-up
		// slice).
	default:
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("restage: unknown strategy %q", req.Strategy))
	}

	ref := &RestageRef{
		CNSIGuid:     cnsiGUID,
		UserGuid:     userGUID,
		AppGuid:      appGUID,
		Strategy:     req.Strategy,
		NoWait:       req.NoWait,
		CurrentStage: StageRestagePackageLookup,
	}

	res := stratosjobs.RunFastPath(ctx.Request().Context(), c.asyncTracker, c.restageTranslator, ref, stratosjobs.FastPathOptions{
		Kind: RestageJobKind,
	})

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	if res.Resolved {
		if res.State == stratosjobs.JobStateFailed {
			return ctx.JSON(http.StatusBadGateway, map[string]interface{}{
				"state":  res.State,
				"errors": res.Errors,
			})
		}
		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"state":  res.State,
			"result": res.Result,
		})
	}
	return ctx.JSON(http.StatusAccepted, res.HandoffJob)
}

// RollbackRequest is the caller-supplied body for POST
// /pp/v1/cf/apps/:cnsi/:app/rollback. RevisionGuid is required;
// Strategy defaults to "rolling".
//
// MaxInFlight and CanarySteps are accepted at the handler boundary so
// the wire shape is stable when slice 8+ wires them through to
// DeploymentCreateRequest.Options.
type RollbackRequest struct {
	RevisionGuid string `json:"revisionGuid"`
	Strategy     string `json:"strategy,omitempty"`
	MaxInFlight  int    `json:"maxInFlight,omitempty"`
	CanarySteps  []int  `json:"canarySteps,omitempty"`
}

// rollbackApp handles POST /pp/v1/cf/apps/{cnsiGuid}/{appGuid}/rollback.
//
// CF v3 rollback is a single POST /v3/deployments with a revision_guid
// (no package/build/droplet sequence — the revision already encodes a
// droplet). The orchestrator therefore only runs deployment_create +
// deployment_poll. We expose this behind the Stratos async-job contract
// so the UI sees the same handoff/poll shape as restage.
//
// Request body:
//
//	{
//	  "revisionGuid": "<guid>",          // required
//	  "strategy": "rolling" | "canary",  // default "rolling"
//	  "maxInFlight": 1,                  // optional, slice 8+
//	  "canarySteps": [10,25,50]          // canary only, slice 8+
//	}
//
// Response shape mirrors restageApp:
//   - 200 + {state, result?, errors?} on fast-path drain.
//   - 202 + handoff job otherwise; frontend polls
//     /pp/v1/stratosjobs/{id}.
func (c *CloudFoundrySpecification) rollbackApp(ctx echo.Context, cnsiGUID, appGUID string) error {
	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	if c.asyncTracker == nil || c.rollbackTranslator == nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "rollback: stratosjobs not registered")
	}

	req := RollbackRequest{}
	if ctx.Request().Body != nil && ctx.Request().ContentLength > 0 {
		if err := json.NewDecoder(ctx.Request().Body).Decode(&req); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("rollback: invalid body: %v", err))
		}
	}

	if req.RevisionGuid == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "rollback: revisionGuid is required")
	}

	strategy := req.Strategy
	if strategy == "" {
		strategy = "rolling"
	}
	switch strategy {
	case "rolling", "canary":
		// Accepted. Canary plumbing lands with slice 8+; the wire
		// contract holds steady so the frontend can be written once.
	default:
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("rollback: unknown strategy %q", strategy))
	}

	ref := &RollbackRef{
		CNSIGuid:     cnsiGUID,
		UserGuid:     userGUID,
		AppGuid:      appGUID,
		RevisionGuid: req.RevisionGuid,
		Strategy:     strategy,
		CurrentStage: StageRollbackDeploymentCreate,
	}

	res := stratosjobs.RunFastPath(ctx.Request().Context(), c.asyncTracker, c.rollbackTranslator, ref, stratosjobs.FastPathOptions{
		Kind: RollbackJobKind,
	})

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	if res.Resolved {
		if res.State == stratosjobs.JobStateFailed {
			return ctx.JSON(http.StatusBadGateway, map[string]interface{}{
				"state":  res.State,
				"errors": res.Errors,
			})
		}
		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"state":  res.State,
			"result": res.Result,
		})
	}
	return ctx.JSON(http.StatusAccepted, res.HandoffJob)
}

// scaleApp handles POST /pp/v1/cf/apps/{cnsiGuid}/{appGuid}/scale — a
// dedicated async-job-contract endpoint for scaling the web process.
// Keeps patchApp focused on name/ssh/env composite updates; scale gets
// the same uniform writeWithJob shape as delete/start/stop/restart.
//
// Request body: {instances?, memory?, disk_quota?}. Any subset is
// accepted and forwarded to CF as a single /v3/processes/{guid}/actions/scale
// call on the resolved web process. CF returns 202 + job; we hand to
// RunFastPath.
func (c *CloudFoundrySpecification) scaleApp(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	appGUID := ctx.Param("appGuid")
	if cnsiGUID == "" || appGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and appGuid are required")
	}

	var body patchAppBody
	if err := ctx.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid body: %v", err))
	}
	if body.Memory == nil && body.DiskQuota == nil && body.Instances == nil {
		return echo.NewHTTPError(http.StatusBadRequest, "at least one of memory, disk_quota, instances is required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	reqCtx := ctx.Request().Context()
	cfClient, err := newCapiClient(reqCtx, c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	procGUID, lookupErr := lookupWebProcessGUID(reqCtx, cfClient, appGUID)
	if lookupErr != nil {
		return handleCapiError(ctx, lookupErr)
	}

	scaleReq := &capi.ProcessScaleRequest{
		Instances:  body.Instances,
		MemoryInMB: body.Memory,
		DiskInMB:   body.DiskQuota,
	}
	job, scaleErr := cfClient.Processes().Scale(reqCtx, procGUID, scaleReq)
	if scaleErr != nil {
		return handleCapiError(ctx, scaleErr)
	}
	// Sync-complete path: older CF returns 200 + Process body with no
	// Location header, so the fork returns (nil, nil).
	if job == nil {
		ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"state": stratosjobs.JobStateComplete,
		})
	}
	if job.GUID == "" {
		return echo.NewHTTPError(http.StatusBadGateway, "scale: malformed job id from CF")
	}

	if c.asyncTracker == nil || c.asyncTranslator == nil {
		ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		ctx.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, c.asyncTracker, c.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.app.scale",
	})

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	if res.Resolved {
		if res.State == stratosjobs.JobStateFailed {
			return ctx.JSON(http.StatusBadGateway, map[string]interface{}{
				"state":  res.State,
				"errors": res.Errors,
			})
		}
		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"state":  res.State,
			"result": res.Result,
		})
	}
	return ctx.JSON(http.StatusAccepted, res.HandoffJob)
}

// deleteAppInstance handles DELETE /pp/v1/cf/apps/{cnsiGuid}/{appGuid}/instances/{index}
// — the Stratos-shape wrapper around CF v3 instance termination.
//
// The capi library exposes termination at the process-scoped path
// (DELETE /v3/processes/{procGuid}/instances/{index}), not the app-scoped
// convenience path. So the handler resolves the web-process GUID first (same
// helper used by patchApp's scale path), then calls Processes().TerminateInstance.
// CF returns 204 No Content on success and the capi wrapper returns nil; we
// mirror that status to the caller. Errors are routed through handleCapiError
// to preserve the CF error envelope classification.
func (cf *CloudFoundrySpecification) deleteAppInstance(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	appGUID := c.Param("appGuid")
	indexRaw := c.Param("index")
	if cnsiGUID == "" || appGUID == "" || indexRaw == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid, appGuid, and index are required")
	}
	index, parseErr := strconv.Atoi(indexRaw)
	if parseErr != nil || index < 0 {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid index %q", indexRaw))
	}

	userGUID, err := cf.getUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(c.Request().Context(), cf.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	ctx := c.Request().Context()
	procGUID, lookupErr := lookupWebProcessGUID(ctx, cfClient, appGUID)
	if lookupErr != nil {
		return handleCapiError(c, lookupErr)
	}

	if termErr := cfClient.Processes().TerminateInstance(ctx, procGUID, index); termErr != nil {
		return handleCapiError(c, termErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	c.Response().WriteHeader(http.StatusNoContent)
	return nil
}

// handleCapiError classifies a capi error into an HTTP status and writes a
// response body preserving the CF error envelope when present. Returns nil
// (writes directly to the response) so callers can `return handleCapiError(…)`.
func handleCapiError(ctx echo.Context, err error) error {
	status := statusFromCapiError(err)
	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	ctx.Response().Header().Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	// Classify for the frontend banner: reason + upstream status headers. This
	// path maps the capi error to a real HTTP status and writes the body
	// directly, so the classifyNativeErrors middleware never sees it — set the
	// headers here instead.
	setNativeCFErrorHeaders(ctx, err)

	var respErr *capi.ResponseError
	if errors.As(err, &respErr) {
		ctx.Response().WriteHeader(status)
		if body, mErr := json.Marshal(respErr); mErr == nil {
			_, _ = ctx.Response().Write(body)
		}
		return nil
	}

	ctx.Response().WriteHeader(status)
	_ = json.NewEncoder(ctx.Response()).Encode(map[string]string{"error": err.Error()})
	return nil
}

// patchAppBody is the accepted JSON payload for PATCH /pp/v1/cf/apps/{cnsi}/{guid}.
// All fields are optional; a field present in the decoded body triggers its
// corresponding CAPI v3 sub-call. Fields not present leave the app unchanged.
type patchAppBody struct {
	Name        *string                `json:"name,omitempty"`
	EnableSSH   *bool                  `json:"enable_ssh,omitempty"`
	Memory      *int                   `json:"memory,omitempty"`
	DiskQuota   *int                   `json:"disk_quota,omitempty"`
	Instances   *int                   `json:"instances,omitempty"`
	Environment map[string]interface{} `json:"environment_json,omitempty"`
}

// metaError describes a single failed sub-call in a composed PATCH response.
// The handler wraps every sub-call failure in this shape and surfaces them
// via the response body's _meta.errors[] array.
type metaError struct {
	Scope    string   `json:"scope"`
	Code     string   `json:"code"`
	Title    string   `json:"title"`
	Detail   string   `json:"detail"`
	Affected []string `json:"affected,omitempty"`
}

// patchApp handles PATCH /pp/v1/cf/apps/{cnsiGuid}/{appGuid} — the
// Stratos-shape write wrapper around CF v3's multi-endpoint app update.
//
// A single Stratos PATCH maps to up to four CAPI v3 sub-calls:
//   - name           → Apps().Update
//   - enable_ssh     → Apps().UpdateFeature("ssh", …)
//   - memory/disk_quota/instances → Processes().Scale on the web process
//     (batched into one scale call for all three fields — affected lists the
//     subset the caller sent)
//   - environment_json → Apps().UpdateEnvVars
//
// Each sub-call succeeds or fails independently. On any sub-call failure, the
// handler still returns HTTP 200 with a JSON body of
// {"guid":"<appGuid>","_meta":{"errors":[...]}}. This keeps the partial-success
// contract (some fields landed, some did not) surfaceable to the UI without
// having to parse an HTTP status that can't express per-field outcome. A fully
// successful PATCH returns {"guid":"<appGuid>"} without _meta.
func (cf *CloudFoundrySpecification) patchApp(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	appGUID := c.Param("appGuid")
	if cnsiGUID == "" || appGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and appGuid are required")
	}

	var body patchAppBody
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid body: %v", err))
	}

	userGUID, err := cf.getUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(c.Request().Context(), cf.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	ctx := c.Request().Context()
	errs := []metaError{}

	record := func(code string, affected []string, cause error) {
		m := metaError{
			Scope:    "envelope",
			Code:     code,
			Title:    "CAPI composition error",
			Detail:   cause.Error(),
			Affected: affected,
		}
		var respErr *capi.ResponseError
		if errors.As(cause, &respErr) && len(respErr.Errors) > 0 {
			first := respErr.Errors[0]
			m.Code = fmt.Sprintf("CF-%d", first.Code)
			m.Title = first.Title
			m.Detail = first.Detail
		}
		errs = append(errs, m)
	}

	// Name update — single PATCH /v3/apps/{guid}
	if body.Name != nil {
		if _, updErr := cfClient.Apps().Update(ctx, appGUID, &capi.AppUpdateRequest{Name: body.Name}); updErr != nil {
			record("CAPI_NAME_UPDATE_FAILED", []string{"name"}, updErr)
		}
	}

	// SSH feature update — PATCH /v3/apps/{guid}/features/ssh
	if body.EnableSSH != nil {
		req := &capi.AppFeatureUpdateRequest{Enabled: *body.EnableSSH}
		if _, updErr := cfClient.Apps().UpdateFeature(ctx, appGUID, "ssh", req); updErr != nil {
			record("CAPI_SSH_UPDATE_FAILED", []string{"enable_ssh"}, updErr)
		}
	}

	// Process scale for the web process — memory/disk/instances are batched
	// into a single Processes().Scale call. We resolve the web-process GUID by
	// listing /v3/processes filtered by app_guid + type=web, then POST to
	// /v3/processes/{guid}/actions/scale with only the fields the caller sent.
	if body.Memory != nil || body.DiskQuota != nil || body.Instances != nil {
		affected := []string{}
		if body.Memory != nil {
			affected = append(affected, "memory")
		}
		if body.DiskQuota != nil {
			affected = append(affected, "disk_quota")
		}
		if body.Instances != nil {
			affected = append(affected, "instances")
		}
		if procGUID, lookupErr := lookupWebProcessGUID(ctx, cfClient, appGUID); lookupErr != nil {
			record("CAPI_SCALE_LOOKUP_FAILED", affected, lookupErr)
		} else {
			scaleReq := &capi.ProcessScaleRequest{
				Instances:  body.Instances,
				MemoryInMB: body.Memory,
				DiskInMB:   body.DiskQuota,
			}
			if _, scaleErr := cfClient.Processes().Scale(ctx, procGUID, scaleReq); scaleErr != nil {
				record("CAPI_SCALE_FAILED", affected, scaleErr)
			}
		}
	}

	// Environment variables — PATCH /v3/apps/{guid}/environment_variables
	if body.Environment != nil {
		if _, envErr := cfClient.Apps().UpdateEnvVars(ctx, appGUID, body.Environment); envErr != nil {
			record("CAPI_ENV_UPDATE_FAILED", []string{"environment_json"}, envErr)
		}
	}

	resp := map[string]interface{}{"guid": appGUID}
	if len(errs) > 0 {
		resp["_meta"] = map[string]interface{}{"errors": errs}
	}
	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return c.JSON(http.StatusOK, resp)
}

// assignRouteToApp handles PUT /pp/v1/cf/apps/{cnsiGuid}/{appGuid}/routes/{routeGuid}
// — the Stratos-shape write wrapper around CF v3's "destinations" semantics.
//
// CAPI v3 models route-to-app assignment as an additive destination on the
// route: POST /v3/routes/{routeGuid}/destinations with
// {"destinations":[{"app":{"guid":"<appGuid>"}}]}. The capi library exposes
// this as Routes().InsertDestinations which returns the updated destinations
// list on 200 OK. We mirror that status to the Stratos caller and route any
// CAPI error envelope through handleCapiError to preserve classification.
func (cf *CloudFoundrySpecification) assignRouteToApp(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	appGUID := c.Param("appGuid")
	routeGUID := c.Param("routeGuid")
	if cnsiGUID == "" || appGUID == "" || routeGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid, appGuid, and routeGuid are required")
	}

	userGUID, err := cf.getUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(c.Request().Context(), cf.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	destinations := []capi.RouteDestination{
		{App: capi.RouteDestinationApp{GUID: appGUID}},
	}
	if _, insertErr := cfClient.Routes().InsertDestinations(c.Request().Context(), routeGUID, destinations); insertErr != nil {
		return handleCapiError(c, insertErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	c.Response().WriteHeader(http.StatusOK)
	return nil
}

// lookupWebProcessGUID resolves the GUID of the web process for an app by
// querying /v3/processes with the app_guids + types filters. Returns the first
// matching process GUID; errors if the app has no web process.
//
// The "no web process" branch wraps capi.ErrNotFound so statusFromCapiError
// classifies it as 404 rather than the default 502. CAPI's response to a
// gone-process can be either 404 CF-ResourceNotFound or 200 with empty
// resources depending on timing — both should surface to the client as 404
// (the resource is gone), not as 502 Bad Gateway (which falsely implies
// upstream connectivity trouble).
func lookupWebProcessGUID(ctx context.Context, cfClient capi.Client, appGUID string) (string, error) {
	params := capi.NewQueryParams()
	params.Filters["app_guids"] = []string{appGUID}
	params.Filters["types"] = []string{"web"}
	params.PerPage = 1

	list, err := cfClient.Processes().List(ctx, params)
	if err != nil {
		return "", err
	}
	if len(list.Resources) == 0 {
		return "", fmt.Errorf("no web process found for app %s: %w", appGUID, capi.ErrNotFound)
	}
	return list.Resources[0].GUID, nil
}

// createNativeApp handles POST /pp/v1/cf/apps/{cnsiGuid} —
// Stratos-shape wrapper around CF V3 POST /v3/apps.
//
// Sync write: V3 returns 201 with the created app. Body shape is
// capi.AppCreateRequest = {name, relationships:{space:{data:{guid}}},
// lifecycle?, environment_variables?, metadata?}.
func (cf *CloudFoundrySpecification) createNativeApp(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	var req capi.AppCreateRequest
	if err := json.NewDecoder(c.Request().Body).Decode(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid body: %v", err))
	}
	if req.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}
	if req.Relationships.Space.Data == nil || req.Relationships.Space.Data.GUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "relationships.space.data.guid is required")
	}

	userGUID, err := cf.getUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(c.Request().Context(), cf.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	app, createErr := cfClient.Apps().Create(c.Request().Context(), &req)
	if createErr != nil {
		return handleCapiError(c, createErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return c.JSON(http.StatusCreated, toStApp(*app, cnsiGUID))
}

// statusFromCapiError maps a capi sentinel error to an HTTP status code.
// CAPI's MapHTTPError always unwraps to one of these sentinels.
func statusFromCapiError(err error) int {
	switch {
	case errors.Is(err, capi.ErrNotFound):
		return http.StatusNotFound
	case errors.Is(err, capi.ErrUnauthorized):
		return http.StatusUnauthorized
	case errors.Is(err, capi.ErrForbidden):
		return http.StatusForbidden
	case errors.Is(err, capi.ErrConflict):
		return http.StatusConflict
	case errors.Is(err, capi.ErrUnprocessable):
		return http.StatusUnprocessableEntity
	case errors.Is(err, capi.ErrRateLimited):
		return http.StatusTooManyRequests
	case errors.Is(err, capi.ErrServerError):
		return http.StatusBadGateway
	case errors.Is(err, capi.ErrBadRequest):
		return http.StatusBadRequest
	}
	return http.StatusBadGateway
}

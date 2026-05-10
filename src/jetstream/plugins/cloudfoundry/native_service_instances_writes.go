// src/jetstream/plugins/cloudfoundry/native_service_instances_writes.go
package cloudfoundry

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
)

// deleteServiceInstance handles DELETE /pp/v1/cf/service_instances/{cnsiGuid}/{siGuid}.
//
// Stratos-shape wrapper around CF v3 /v3/service_instances/{guid}. Both
// managed and user-provided instances flow through the same endpoint —
// the SDK returns *capi.Job for managed (broker call needed) and may
// return nil/empty job for user-provided (handled inline). For a uniform
// downstream contract we treat any returned non-empty job through the
// stratosjobs fast-path; if the SDK returns no job (e.g. user-provided
// instance synchronously removed) we surface 200 immediately.
//
// Same async-job pattern as deleteNativeRoute and deleteNativeOrg:
// 200 with the resolved state if the job finishes inside the fast-path
// window, 202 with {id, state, startedAt} for client-side polling
// otherwise. Falls back to bare 202 if the async-job contract isn't
// wired (plugin ordering / tests).
func (cf *CloudFoundrySpecification) deleteServiceInstance(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	siGUID := c.Param("siGuid")
	if cnsiGUID == "" || siGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and siGuid are required")
	}

	userGUID, err := cf.getUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	reqCtx := c.Request().Context()
	cfClient, err := newCapiClient(reqCtx, cf.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	job, deleteErr := cfClient.ServiceInstances().Delete(reqCtx, siGUID)
	if deleteErr != nil {
		// fw-capi's Delete also blindly json.Unmarshals the 202 body, which
		// CF returns empty (job link in Location header). Recover by
		// confirming via GET: 404 → already deleted; SI present with
		// last_op type=delete → in flight; failed delete → surface broker
		// reason. Remove when upstream fw-capi is fixed.
		if strings.Contains(deleteErr.Error(), "parsing job response") {
			if status, body := recoverFromDeleteParseError(reqCtx, cfClient, siGUID); body != nil {
				c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
				return c.JSON(status, body)
			}
		}
		return handleCapiError(c, deleteErr)
	}

	// User-provided instances delete synchronously; CF returns no job
	// reference. Treat the absence as immediate success.
	if job == nil || job.GUID == "" {
		c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		return c.JSON(http.StatusOK, map[string]interface{}{
			"state": stratosjobs.JobStateComplete,
		})
	}

	if cf.asyncTracker == nil || cf.asyncTranslator == nil {
		c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		c.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, cf.asyncTracker, cf.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.service_instance.delete",
	})

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	if res.Resolved {
		if res.State == stratosjobs.JobStateFailed {
			return c.JSON(http.StatusBadGateway, map[string]interface{}{
				"state":  res.State,
				"errors": res.Errors,
			})
		}
		return c.JSON(http.StatusOK, map[string]interface{}{
			"state":  res.State,
			"result": res.Result,
		})
	}
	return c.JSON(http.StatusAccepted, res.HandoffJob)
}

// createManagedServiceInstance handles POST /pp/v1/cf/service_instances/{cnsiGuid} —
// the Stratos-shape wrapper around CF V3 POST /v3/service_instances for
// managed (broker-backed) instances.
//
// Body shape: capi.ServiceInstanceCreateRequest with type="managed". The
// upstream call is async — V3 responds 202 + Location → /v3/jobs/{guid}.
// We hand the job to the stratosjobs fast-path wrapper, same pattern as
// deleteServiceInstance: 200 with terminal envelope on fast resolve, 202
// with {id, state, startedAt} for client-side polling.
//
// User-provided instances should go through createUserProvidedServiceInstance —
// this handler rejects type="user-provided" with 400.
func (cf *CloudFoundrySpecification) createManagedServiceInstance(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	var req capi.ServiceInstanceCreateRequest
	if err := json.NewDecoder(c.Request().Body).Decode(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid body: %v", err))
	}
	if req.Type == "" {
		req.Type = "managed"
	}
	if req.Type != "managed" {
		return echo.NewHTTPError(http.StatusBadRequest,
			"this endpoint creates managed instances only; for user-provided use /pp/v1/cf/user_provided_service_instances/{cnsiGuid}")
	}
	if req.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}
	if req.Relationships.Space.Data == nil || req.Relationships.Space.Data.GUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "relationships.space.data.guid is required")
	}
	if req.Relationships.ServicePlan == nil || req.Relationships.ServicePlan.Data == nil || req.Relationships.ServicePlan.Data.GUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "relationships.service_plan.data.guid is required for managed instances")
	}

	userGUID, err := cf.getUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	reqCtx := c.Request().Context()
	cfClient, err := newCapiClient(reqCtx, cf.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	out, createErr := cfClient.ServiceInstances().Create(reqCtx, &req)
	if createErr != nil {
		// fw-capi's Create expects CF to return 202 with a JSON Job body but
		// CF actually returns 202 with an empty body and the job link in the
		// Location header. fw-capi then errors with "parsing job response:
		// unexpected end of JSON input". The create itself almost certainly
		// happened — find the new instance by name+space, then either
		// surface a synchronous COMPLETE envelope (succeeded / in progress)
		// or a 502 with the broker's reason (failed). Remove when upstream
		// fw-capi reads the Location header on empty 202 bodies.
		if strings.Contains(createErr.Error(), "parsing job response") {
			if status, body := recoverFromCreateParseError(reqCtx, cfClient, &req); body != nil {
				c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
				return c.JSON(status, body)
			}
		}
		return handleCapiError(c, createErr)
	}
	job, isJob := out.(*capi.Job)
	if !isJob || job == nil || job.GUID == "" {
		// Managed create should always be async per CF spec; if for some
		// reason we got back a synchronous resource (eg. broker bypass),
		// surface it sync-complete.
		c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		return c.JSON(http.StatusCreated, out)
	}

	if cf.asyncTracker == nil || cf.asyncTranslator == nil {
		c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		c.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, cf.asyncTracker, cf.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.service_instance.create",
	})

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	if res.Resolved {
		if res.State == stratosjobs.JobStateFailed {
			return c.JSON(http.StatusBadGateway, map[string]interface{}{
				"state":  res.State,
				"errors": res.Errors,
			})
		}
		// CF's create job completes (state=COMPLETE) regardless of broker
		// outcome — the actual provision result lands on the new
		// service_instance's last_operation. Without this re-check a
		// broker error silently looks like success: the wizard shows a
		// green confirmation while the SI sits with last_operation.state
		// = "failed". Re-fetch the SI from the job links and surface a
		// proper failure envelope when the broker rejected the create.
		if siErr := checkManagedSICreateOutcome(reqCtx, cfClient, res.Result); siErr != nil {
			return c.JSON(http.StatusBadGateway, map[string]interface{}{
				"state":  stratosjobs.JobStateFailed,
				"errors": []stratosjobs.StratosError{*siErr},
			})
		}
		return c.JSON(http.StatusOK, map[string]interface{}{
			"state":  res.State,
			"result": res.Result,
		})
	}
	return c.JSON(http.StatusAccepted, res.HandoffJob)
}

// checkManagedSICreateOutcome walks the job-result links produced by the
// async translator, GETs the new service_instance, and returns a
// StratosError when last_operation.state == "failed". Returns nil when the
// SI provisioned successfully, when the link can't be parsed (we'd rather
// the user see a success they can reconcile than block a healthy create),
// or when the GET itself errors.
func checkManagedSICreateOutcome(ctx context.Context, cfClient capi.Client, result interface{}) *stratosjobs.StratosError {
	resultMap, ok := result.(map[string]interface{})
	if !ok {
		return nil
	}
	links, ok := resultMap["links"].(map[string]string)
	if !ok {
		return nil
	}
	href := links["service_instances"]
	if href == "" {
		return nil
	}
	idx := strings.LastIndex(href, "/")
	if idx < 0 || idx == len(href)-1 {
		return nil
	}
	siGUID := href[idx+1:]
	si, err := cfClient.ServiceInstances().Get(ctx, siGUID)
	if err != nil || si == nil || si.LastOperation == nil {
		return nil
	}
	if si.LastOperation.State != "failed" {
		return nil
	}
	desc := si.LastOperation.Description
	if desc == "" {
		desc = "service broker rejected the create"
	}
	return &stratosjobs.StratosError{
		Code:    "cf.service_instance.last_operation.failed",
		Message: "Service instance create failed",
		Detail:  desc,
	}
}

// recoverFromDeleteParseError handles the same fw-capi empty-body bug for
// SI deletes. CF responds 202 + Location, fw-capi can't parse the empty body.
// We GET the SI to determine real state:
//   - GET 404 → already gone, return COMPLETE
//   - SI present with last_op type=delete state=in progress → 202 (frontend
//     can poll the SI until it disappears)
//   - SI present with last_op type=delete state=failed → 502 + broker desc
//   - Anything else → fall through to the original parse error
func recoverFromDeleteParseError(
	ctx context.Context,
	cfClient capi.Client,
	siGUID string,
) (int, map[string]interface{}) {
	si, err := cfClient.ServiceInstances().Get(ctx, siGUID)
	if err != nil {
		// Most likely 404 — fw-capi wraps that as an error. Treat as deleted.
		return http.StatusOK, map[string]interface{}{
			"state": stratosjobs.JobStateComplete,
		}
	}
	if si == nil {
		return http.StatusOK, map[string]interface{}{
			"state": stratosjobs.JobStateComplete,
		}
	}
	state, desc := readLastOpState(si.LastOperation)
	opType := ""
	if si.LastOperation != nil {
		opType = si.LastOperation.Type
	}
	if opType == "delete" && state == "failed" {
		if desc == "" {
			desc = "service broker rejected the delete"
		}
		return http.StatusBadGateway, map[string]interface{}{
			"state": stratosjobs.JobStateFailed,
			"errors": []stratosjobs.StratosError{{
				Code:    "cf.service_instance.last_operation.failed",
				Message: "Service instance delete failed",
				Detail:  desc,
			}},
		}
	}
	// Either delete is in progress or the SI exists in another state. Return
	// 202 so the frontend treats it as a long-running job; the services list
	// will refresh and reflect terminal state once CF settles.
	return http.StatusAccepted, map[string]interface{}{
		"id":        siGUID,
		"state":     "RUNNING",
		"startedAt": "",
	}
}

func readLastOpState(op *capi.ServiceInstanceLastOperation) (string, string) {
	if op == nil {
		return "", ""
	}
	return op.State, op.Description
}

// recoverFromCreateParseError finds a service instance just submitted by name
// + space when fw-capi's Create errored on an empty 202 body. CF accepted the
// request (the POST returned 202) — the SI may already exist with state
// "create succeeded", "create in progress", or "create failed".
//
// Returns:
//   - 200 + fast-path COMPLETE envelope when last_op is "succeeded" or
//     "in progress" (frontend extracts the new SI guid via links and
//     navigates; user sees actual progress in the services list)
//   - 502 + Stratos error envelope when last_op is "failed" (frontend
//     surfaces the broker's description in the snackbar)
//   - (0, nil) when nothing matched, so the caller falls through to the
//     original fw-capi parse error.
func recoverFromCreateParseError(
	ctx context.Context,
	cfClient capi.Client,
	req *capi.ServiceInstanceCreateRequest,
) (int, map[string]interface{}) {
	if req == nil || req.Name == "" || req.Relationships.Space.Data == nil {
		return 0, nil
	}
	spaceGUID := req.Relationships.Space.Data.GUID
	params := capi.NewQueryParams().
		WithFilter("names", req.Name).
		WithFilter("space_guids", spaceGUID).
		WithPerPage(1)
	list, err := cfClient.ServiceInstances().List(ctx, params)
	if err != nil || list == nil || len(list.Resources) == 0 {
		return 0, nil
	}
	// Safety: only treat the SI as the one we just submitted if it was
	// created within the last few seconds. An older match almost certainly
	// belongs to a previous failed attempt with the same name, and locking
	// onto it would surface stale state to the wizard.
	if time.Since(list.Resources[0].CreatedAt) > 30*time.Second {
		return 0, nil
	}
	siGUID := list.Resources[0].GUID
	op := list.Resources[0].LastOperation
	// Short-poll for last_operation to settle. The wizard's bind-after-create
	// step issues POST /v3/service_bindings immediately on success — but CF
	// rejects with 422 ("operation in progress") until last_op = "succeeded".
	// Wait up to ~20s for the broker to finish provisioning. If still in
	// progress after that window we return COMPLETE anyway and the user can
	// bind manually from /services once the SI settles.
	state, desc := readLastOpState(op)
	// CF lifecycle: "initial" -> "in progress" -> "succeeded"/"failed".
	// Both pre-terminal states should keep the wizard waiting so the bind
	// step has a chance to succeed without hitting CF's 422 rejection.
	for i := 0; i < 30 && (state == "in progress" || state == "initial"); i++ {
		select {
		case <-ctx.Done():
			return 0, nil
		case <-time.After(2 * time.Second):
		}
		refreshed, refreshErr := cfClient.ServiceInstances().Get(ctx, siGUID)
		if refreshErr != nil || refreshed == nil {
			break
		}
		state, desc = readLastOpState(refreshed.LastOperation)
	}
	if state == "failed" {
		if desc == "" {
			desc = "service broker rejected the create"
		}
		return http.StatusBadGateway, map[string]interface{}{
			"state": stratosjobs.JobStateFailed,
			"errors": []stratosjobs.StratosError{{
				Code:    "cf.service_instance.last_operation.failed",
				Message: "Service instance create failed",
				Detail:  desc,
			}},
		}
	}
	// Fast-path COMPLETE envelope. The result mirrors the v3 link shape that
	// extractCreatedSiGuid expects so the wizard can chain bind-after-create.
	return http.StatusOK, map[string]interface{}{
		"state": stratosjobs.JobStateComplete,
		"result": map[string]interface{}{
			"links": map[string]string{
				"service_instance": "/v3/service_instances/" + siGUID,
			},
			"last_operation": map[string]interface{}{
				"state":       state,
				"description": desc,
			},
		},
	}
}

// updateManagedServiceInstance handles PATCH /pp/v1/cf/service_instances/{cnsiGuid}/{siGuid}
// for managed (broker-backed) instances. V3 PATCH on a managed instance
// returns 202 + job; we hand it off via RunFastPath.
//
// User-provided instances use updateUserProvidedServiceInstance which
// returns the resource directly (sync).
func (cf *CloudFoundrySpecification) updateManagedServiceInstance(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	siGUID := c.Param("siGuid")
	if cnsiGUID == "" || siGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and siGuid are required")
	}

	var req capi.ServiceInstanceUpdateRequest
	if err := json.NewDecoder(c.Request().Body).Decode(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid body: %v", err))
	}

	userGUID, err := cf.getUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	reqCtx := c.Request().Context()
	cfClient, err := newCapiClient(reqCtx, cf.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	out, updErr := cfClient.ServiceInstances().Update(reqCtx, siGUID, &req)
	if updErr != nil {
		return handleCapiError(c, updErr)
	}
	job, isJob := out.(*capi.Job)
	if !isJob || job == nil || job.GUID == "" {
		// Sync return — managed update without a broker round-trip
		// (rare, eg. metadata-only patch). Surface as terminal complete.
		c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		return c.JSON(http.StatusOK, out)
	}

	if cf.asyncTracker == nil || cf.asyncTranslator == nil {
		c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		c.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, cf.asyncTracker, cf.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.service_instance.update",
	})

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	if res.Resolved {
		if res.State == stratosjobs.JobStateFailed {
			return c.JSON(http.StatusBadGateway, map[string]interface{}{
				"state":  res.State,
				"errors": res.Errors,
			})
		}
		return c.JSON(http.StatusOK, map[string]interface{}{
			"state":  res.State,
			"result": res.Result,
		})
	}
	return c.JSON(http.StatusAccepted, res.HandoffJob)
}

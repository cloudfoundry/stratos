// src/jetstream/plugins/cloudfoundry/native_apps_writes.go
package cloudfoundry

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"

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
// The capi client's Apps().Delete returns nil on 2xx (CF returns 202 Accepted
// for async delete; the capi wrapper discards the Location header) and a
// classified sentinel error on non-2xx. We map the success case to 202 and
// classify the error via handleCapiError on failure.
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

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	if deleteErr := cfClient.Apps().Delete(ctx.Request().Context(), appGUID); deleteErr != nil {
		return handleCapiError(ctx, deleteErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	ctx.Response().WriteHeader(http.StatusAccepted)
	return nil
}

// appAction handles POST /pp/v1/cf/apps/{cnsiGuid}/{appGuid}/actions/{action}
// for action in {start, stop, restart, restage}. On success returns 202; on
// capi error delegates to handleCapiError for status + body preservation.
func (c *CloudFoundrySpecification) appAction(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	appGUID := ctx.Param("appGuid")
	action := ctx.Param("action")
	if cnsiGUID == "" || appGUID == "" || !allowedAppActions[action] {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid params (action=%q)", action))
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	reqCtx := ctx.Request().Context()
	switch action {
	case "start":
		_, err = cfClient.Apps().Start(reqCtx, appGUID)
	case "stop":
		_, err = cfClient.Apps().Stop(reqCtx, appGUID)
	case "restart":
		_, err = cfClient.Apps().Restart(reqCtx, appGUID)
	case "restage":
		_, err = cfClient.Apps().Restage(reqCtx, appGUID)
	}
	if err != nil {
		return handleCapiError(ctx, err)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	ctx.Response().WriteHeader(http.StatusAccepted)
	return nil
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

// lookupWebProcessGUID resolves the GUID of the web process for an app by
// querying /v3/processes with the app_guids + types filters. Returns the first
// matching process GUID; errors if the app has no web process.
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
		return "", fmt.Errorf("no web process found for app %s", appGUID)
	}
	return list.Resources[0].GUID, nil
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

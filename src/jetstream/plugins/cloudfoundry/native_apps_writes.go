// src/jetstream/plugins/cloudfoundry/native_apps_writes.go
package cloudfoundry

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

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

// src/jetstream/plugins/cloudfoundry/native_apps_writes.go
package cloudfoundry

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// deleteNativeApp handles DELETE /pp/v1/cf/apps/{cnsiGuid}/{appGuid} —
// the Stratos-shape write wrapper around CF v3 /v3/apps/{guid}.
//
// The capi client's Apps().Delete returns nil on 2xx (CF returns 202 Accepted
// for async delete; the capi wrapper discards the Location header) and a
// classified sentinel error on non-2xx. We map the success case to 202 and
// classify the error into an HTTP status + preserve the CF error body (so
// upstream Stratos clients can inspect CF's error code/title/detail) when
// present.
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

	deleteErr := cfClient.Apps().Delete(ctx.Request().Context(), appGUID)
	if deleteErr == nil {
		ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		ctx.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	// Non-2xx: classify to an HTTP status and, when CAPI parsed a CF error
	// envelope, write it back verbatim so callers retain the original error
	// code / title / detail for diagnostics.
	status := statusFromCapiError(deleteErr)
	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	var respErr *capi.ResponseError
	if errors.As(deleteErr, &respErr) {
		ctx.Response().Header().Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		ctx.Response().WriteHeader(status)
		if body, mErr := json.Marshal(respErr); mErr == nil {
			_, _ = ctx.Response().Write(body)
		}
		return nil
	}

	// No parsed CF envelope — return a generic Stratos error payload.
	ctx.Response().Header().Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.Response().WriteHeader(status)
	_ = json.NewEncoder(ctx.Response()).Encode(map[string]string{"error": deleteErr.Error()})
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

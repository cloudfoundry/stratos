// src/jetstream/plugins/cloudfoundry/native_orgs_writes.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// deleteNativeOrg handles DELETE /pp/v1/cf/orgs/{cnsiGuid}/{orgGuid} —
// Stratos-shape write wrapper around CF V3 /v3/organizations/{guid}.
//
// CF V3 returns 202 Accepted + Location pointing at /v3/jobs/{guid};
// we hand that to the stratosjobs fast-path wrapper, same as
// deleteNativeApp. Callers see either 200 with a terminal StratosJob
// (resolved inside the fast-path window) or 202 with {id, state,
// startedAt} for client-side polling.
func (c *CloudFoundrySpecification) deleteNativeOrg(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	orgGUID := ctx.Param("orgGuid")
	if cnsiGUID == "" || orgGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and orgGuid are required")
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

	job, delErr := cfClient.Organizations().Delete(reqCtx, orgGUID)
	if delErr != nil {
		return handleCapiError(ctx, delErr)
	}
	if job == nil || job.GUID == "" {
		return echo.NewHTTPError(http.StatusBadGateway, "org delete: no job id returned from CF")
	}

	if c.asyncTracker == nil || c.asyncTranslator == nil {
		ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		ctx.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, c.asyncTracker, c.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.org.delete",
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

// updateNativeOrg handles PATCH /pp/v1/cf/orgs/{cnsiGuid}/{orgGuid} —
// Stratos-shape write wrapper around CF V3 PATCH /v3/organizations/{guid}.
//
// Sync write: V3 returns 200 with the updated organization. The handler
// decodes the request body into capi.OrganizationUpdateRequest (which
// matches the V3 wire shape one-for-one), forwards it, and returns the
// mapped Stratos-shape StOrg.
func (c *CloudFoundrySpecification) updateNativeOrg(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	orgGUID := ctx.Param("orgGuid")
	if cnsiGUID == "" || orgGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and orgGuid are required")
	}

	var req capi.OrganizationUpdateRequest
	if err := json.NewDecoder(ctx.Request().Body).Decode(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid body: %v", err))
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	org, updErr := cfClient.Organizations().Update(ctx.Request().Context(), orgGUID, &req)
	if updErr != nil {
		return handleCapiError(ctx, updErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, toStOrg(*org, cnsiGUID))
}

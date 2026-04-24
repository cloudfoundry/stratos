// src/jetstream/plugins/cloudfoundry/native_spaces_writes.go
package cloudfoundry

import (
	"net/http"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/labstack/echo/v4"
)

// deleteNativeSpace handles DELETE /pp/v1/cf/spaces/{cnsiGuid}/{spaceGuid}
// — Stratos-shape write wrapper around CF V3 /v3/spaces/{guid}.
//
// Same async-job-contract shape as deleteNativeApp / deleteNativeOrg: CF
// returns 202 + Location → /v3/jobs/{guid}; Stratos fast-paths for the
// brief window or hands off a {id, state, startedAt} envelope for the
// frontend to poll.
func (c *CloudFoundrySpecification) deleteNativeSpace(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	spaceGUID := ctx.Param("spaceGuid")
	if cnsiGUID == "" || spaceGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and spaceGuid are required")
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

	job, delErr := cfClient.Spaces().Delete(reqCtx, spaceGUID)
	if delErr != nil {
		return handleCapiError(ctx, delErr)
	}
	if job == nil || job.GUID == "" {
		return echo.NewHTTPError(http.StatusBadGateway, "space delete: no job id returned from CF")
	}

	if c.asyncTracker == nil || c.asyncTranslator == nil {
		ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		ctx.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, c.asyncTracker, c.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.space.delete",
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

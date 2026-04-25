// src/jetstream/plugins/cloudfoundry/native_service_instances_writes.go
package cloudfoundry

import (
	"net/http"

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

// src/jetstream/plugins/cloudfoundry/native_service_instances_writes.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"net/http"

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
		return c.JSON(http.StatusOK, map[string]interface{}{
			"state":  res.State,
			"result": res.Result,
		})
	}
	return c.JSON(http.StatusAccepted, res.HandoffJob)
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

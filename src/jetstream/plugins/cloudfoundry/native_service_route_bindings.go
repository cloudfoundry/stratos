// src/jetstream/plugins/cloudfoundry/native_service_route_bindings.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
)

// Service route bindings (GH#4302) — Stratos-shape write/read wrappers around
// CF v3 /v3/service_route_bindings via capi's ServiceRouteBindingsClient.
//
// These handlers are registered but not yet consumed by the frontend; they
// exist so the eventual route-service UI can wire to a stable contract. The
// async create/delete paths follow the same RunFastPath / writeWithJob
// contract as native_service_bindings.go so no consumer changes are needed
// when the UI lands.

// createServiceRouteBinding handles
// POST /pp/v1/cf/service_route_bindings/{cnsiGuid}.
//
// The frontend sends the v3-shaped body directly:
//
//	{"relationships":{
//	   "route":{"data":{"guid":"<routeGuid>"}},
//	   "service_instance":{"data":{"guid":"<siGuid>"}}},
//	 "parameters":{...optional...}}
//
// which matches capi.ServiceRouteBindingCreateRequest one-for-one, so we decode
// the client body into that request struct and forward it unmodified.
//
// capi's Create returns interface{} — *ServiceRouteBinding for synchronous
// responses (201 Created, e.g. a non-route-service binding) or *Job for
// asynchronous ones (202 Accepted). We surface 201 on the sync path and drive
// the async path through RunFastPath so the handoff body is a StratosJob
// matching the frontend writeWithJob contract.
//
// Graceful fallback: if the stratosjobs plugin isn't wired, async creates
// return bare 202 (frontend 404-on-poll treats that as UNKNOWN).
func (cf *CloudFoundrySpecification) createServiceRouteBinding(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	var req capi.ServiceRouteBindingCreateRequest
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

	result, createErr := cfClient.ServiceRouteBindings().Create(reqCtx, &req)
	if createErr != nil {
		return handleCapiError(c, createErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	// Sync path: binding returned directly. Surface 201 Created with the body.
	job, isJob := result.(*capi.Job)
	if !isJob {
		return c.JSON(http.StatusCreated, result)
	}

	// Async path: managed route binding returned 202 + Location; drive RunFastPath.
	if cf.asyncTracker == nil || cf.asyncTranslator == nil {
		c.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, cf.asyncTracker, cf.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.service_route_binding.create",
	})

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

// deleteServiceRouteBinding handles
// DELETE /pp/v1/cf/service_route_bindings/{cnsiGuid}/{bindingGuid}.
//
// capi's Delete returns (*Job, error). Route-service unbinds are broker-mediated
// and async (202 + Location → *Job) — we hand the job to RunFastPath for the
// fast-path/handoff contract. The nil-job branch mirrors deleteServiceBinding:
// a synchronous 204 would surface a synthetic COMPLETE so writeWithJob resolves
// without polling.
//
// Graceful fallback: if the stratosjobs plugin isn't wired, async deletes
// return bare 202 (frontend 404-on-poll treats that as UNKNOWN).
func (cf *CloudFoundrySpecification) deleteServiceRouteBinding(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	bindingGUID := c.Param("bindingGuid")
	if cnsiGUID == "" || bindingGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and bindingGuid are required")
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

	job, deleteErr := cfClient.ServiceRouteBindings().Delete(reqCtx, bindingGUID)
	if deleteErr != nil {
		return handleCapiError(c, deleteErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	// Sync path: nil job → synthesize a COMPLETE terminal state.
	if job == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"state":  stratosjobs.JobStateComplete,
			"result": map[string]string{"operation": "service_route_binding.delete"},
		})
	}

	// Async path: managed route binding returned 202 + Location; drive RunFastPath.
	if cf.asyncTracker == nil || cf.asyncTranslator == nil {
		c.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, cf.asyncTracker, cf.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.service_route_binding.delete",
	})

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

// getNativeServiceRouteBindings handles
// GET /pp/v1/cf/service_route_bindings/{cnsiGuid}.
//
// Optional query filters (passed straight to v3): service_instance_guids,
// route_guids. Returns a StratosPagedResponse of the raw v3 route bindings;
// the frontend adapter shapes them when the UI is wired.
func (cf *CloudFoundrySpecification) getNativeServiceRouteBindings(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
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

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	perPage, page, present := parsePerPageAndPage(c)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present)
	if si := c.QueryParam("service_instance_guids"); si != "" {
		params = params.WithFilter("service_instance_guids", si)
	}
	if rg := c.QueryParam("route_guids"); rg != "" {
		params = params.WithFilter("route_guids", rg)
	}

	raw, listErr := cfClient.ServiceRouteBindings().List(reqCtx, params)
	if listErr != nil {
		return handleCapiError(c, listErr)
	}

	return c.JSON(http.StatusOK, StratosPagedResponse[capi.ServiceRouteBinding]{
		Resources:  raw.Resources,
		Pagination: BuildPaginationMeta(c, page, perPage, raw.Pagination.TotalResults),
	})
}

// getNativeServiceRouteBindingParameters handles
// GET /pp/v1/cf/service_route_bindings/{cnsiGuid}/{bindingGuid}/parameters.
//
// Surfaces the broker-specific route-binding parameters (v3 GET
// .../parameters). Read-only; no job handoff.
func (cf *CloudFoundrySpecification) getNativeServiceRouteBindingParameters(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	bindingGUID := c.Param("bindingGuid")
	if cnsiGUID == "" || bindingGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and bindingGuid are required")
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

	params, paramErr := cfClient.ServiceRouteBindings().GetParameters(reqCtx, bindingGUID)
	if paramErr != nil {
		return handleCapiError(c, paramErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return c.JSON(http.StatusOK, params)
}

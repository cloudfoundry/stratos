// src/jetstream/plugins/cloudfoundry/native_service_bindings.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
)

// createServiceBinding handles POST /pp/v1/cf/service_bindings/{cnsiGuid} —
// the Stratos-shape write wrapper around CF v3
// /v3/service_credential_bindings.
//
// The frontend sends the v3-shaped body directly:
//
//	{"type":"app","relationships":{
//	   "app":{"data":{"guid":"<appGuid>"}},
//	   "service_instance":{"data":{"guid":"<siGuid>"}}},
//	 "parameters":{...optional...}}
//
// which matches capi.ServiceCredentialBindingCreateRequest one-for-one, so we
// decode the client body into that request struct and forward it unmodified.
//
// The capi client's Create returns interface{} (either *ServiceCredentialBinding
// for synchronous broker responses, 201 Created, or *Job for asynchronous ones,
// 202 Accepted). We surface 201 Created on the sync path (binding body) and
// drive the async path through RunFastPath so the handoff body is a StratosJob
// matching the frontend writeWithJob contract — same shape as
// deleteServiceBinding.
//
// Graceful fallback: if the stratosjobs plugin isn't wired, async creates
// return bare 202 (frontend 404-on-poll treats that as UNKNOWN).
func (cf *CloudFoundrySpecification) createServiceBinding(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	var req capi.ServiceCredentialBindingCreateRequest
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

	result, createErr := cfClient.ServiceCredentialBindings().Create(reqCtx, &req)
	if createErr != nil {
		return handleCapiError(c, createErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	// Sync path: managed-broker-without-async or user-provided returned the
	// binding body directly. Surface 201 Created with the binding payload.
	job, isJob := result.(*capi.Job)
	if !isJob {
		return c.JSON(http.StatusCreated, result)
	}

	// Async path: managed binding returned 202 + Location; drive RunFastPath.
	if cf.asyncTracker == nil || cf.asyncTranslator == nil {
		c.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, cf.asyncTracker, cf.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.service_binding.create",
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

// deleteServiceBinding handles DELETE /pp/v1/cf/service_bindings/{cnsiGuid}/{bindingGuid}
// — the Stratos-shape write wrapper around CF v3
// /v3/service_credential_bindings/{guid}.
//
// The upstream delete is polymorphic depending on the underlying service
// instance type:
//   - User-provided service instance: synchronous 204 No Content; capi
//     client returns (nil, nil) — we surface 200 OK with a synthetic
//     terminal-state body so the frontend's writeWithJob resolves without
//     polling.
//   - Managed service instance: async 202 + Location header; capi client
//     returns (*Job, nil) — we hand the job to RunFastPath for the
//     fast-path/handoff contract, same as deleteNativeApp / deleteNativeRoute.
//
// Graceful fallback: if the stratosjobs plugin isn't wired, async deletes
// return bare 202 (frontend 404-on-poll treats that as UNKNOWN).
func (cf *CloudFoundrySpecification) deleteServiceBinding(c echo.Context) error {
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

	job, deleteErr := cfClient.ServiceCredentialBindings().Delete(reqCtx, bindingGUID)
	if deleteErr != nil {
		return handleCapiError(c, deleteErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	// Sync path: user-provided binding returned 204 No Content, nil job.
	// Synthesize a COMPLETE terminal state so the frontend's writeWithJob
	// resolves immediately without a polling round-trip.
	if job == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"state":  stratosjobs.JobStateComplete,
			"result": map[string]string{"operation": "service_credential_binding.delete"},
		})
	}

	// Async path: managed binding returned 202 + Location; drive RunFastPath.
	if cf.asyncTracker == nil || cf.asyncTranslator == nil {
		c.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, cf.asyncTracker, cf.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.service_binding.delete",
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

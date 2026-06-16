// src/jetstream/plugins/cloudfoundry/native_service_keys.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
)

// Service keys (GH#4301) — Stratos-shape wrappers around CF v3 service keys.
//
// In v3 a "service key" is a service_credential_binding with type="key" (vs
// "app"), so these handlers reuse capi's ServiceCredentialBindingsClient and
// pin type=key. create/delete share the same async RunFastPath / writeWithJob
// contract as native_service_bindings.go; GetDetails surfaces the credentials a
// key exists to expose.
//
// Registered but not yet consumed by the frontend — they give the eventual
// service-keys UI a stable contract to wire to. The generic credential-binding
// create/delete handlers already accept type=key bodies; these key-scoped
// endpoints make the surface explicit (and add list + details + parameters).

// createServiceKey handles POST /pp/v1/cf/service_keys/{cnsiGuid}.
//
// The frontend sends a v3-shaped credential-binding body naming the service
// instance:
//
//	{"name":"my-key","relationships":{
//	   "service_instance":{"data":{"guid":"<siGuid>"}}},
//	 "parameters":{...optional...}}
//
// We decode it into capi.ServiceCredentialBindingCreateRequest and force
// Type="key" (ignoring any client-supplied type) so this endpoint can only ever
// mint keys. capi's Create returns *ServiceCredentialBinding (sync 201) or *Job
// (async); the async path drives RunFastPath like createServiceBinding.
func (cf *CloudFoundrySpecification) createServiceKey(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	var req capi.ServiceCredentialBindingCreateRequest
	if err := json.NewDecoder(c.Request().Body).Decode(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid body: %v", err))
	}
	// This endpoint mints keys only — pin the type regardless of the client body.
	req.Type = "key"

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

	// Sync path: key returned directly. Surface 201 Created with the body.
	job, isJob := result.(*capi.Job)
	if !isJob {
		return c.JSON(http.StatusCreated, result)
	}

	// Async path: broker key returned 202 + Location; drive RunFastPath.
	if cf.asyncTracker == nil || cf.asyncTranslator == nil {
		c.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, cf.asyncTracker, cf.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.service_key.create",
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

// deleteServiceKey handles DELETE /pp/v1/cf/service_keys/{cnsiGuid}/{keyGuid}.
//
// Delegates to ServiceCredentialBindings().Delete (a key is just a credential
// binding). Async 202 + Location → *Job → RunFastPath; nil job → synthetic
// COMPLETE so writeWithJob resolves without polling.
func (cf *CloudFoundrySpecification) deleteServiceKey(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	keyGUID := c.Param("keyGuid")
	if cnsiGUID == "" || keyGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and keyGuid are required")
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

	job, deleteErr := cfClient.ServiceCredentialBindings().Delete(reqCtx, keyGUID)
	if deleteErr != nil {
		return handleCapiError(c, deleteErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	if job == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"state":  stratosjobs.JobStateComplete,
			"result": map[string]string{"operation": "service_key.delete"},
		})
	}

	if cf.asyncTracker == nil || cf.asyncTranslator == nil {
		c.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, cf.asyncTracker, cf.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.service_key.delete",
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

// getNativeServiceKeys handles GET /pp/v1/cf/service_keys/{cnsiGuid}.
//
// Lists credential bindings filtered to type=key. Optional query filter:
// service_instance_guids (scope to one SI). Returns a StratosPagedResponse of
// the raw v3 bindings; the frontend adapter shapes them when the UI is wired.
func (cf *CloudFoundrySpecification) getNativeServiceKeys(c echo.Context) error {
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
	params := applyPagingParams(capi.NewQueryParams().WithFilter("type", "key"), perPage, page, present)
	if si := c.QueryParam("service_instance_guids"); si != "" {
		params = params.WithFilter("service_instance_guids", si)
	}

	raw, listErr := cfClient.ServiceCredentialBindings().List(reqCtx, params)
	if listErr != nil {
		return handleCapiError(c, listErr)
	}

	return c.JSON(http.StatusOK, StratosPagedResponse[capi.ServiceCredentialBinding]{
		Resources:  raw.Resources,
		Pagination: BuildPaginationMeta(c, page, perPage, raw.Pagination.TotalResults),
	})
}

// getNativeServiceKeyDetails handles
// GET /pp/v1/cf/service_keys/{cnsiGuid}/{keyGuid}/details.
//
// Surfaces the key's credentials (v3 GET .../details) — the reason service keys
// exist. Read-only; no job handoff. Sensitive payload: returned verbatim to the
// authenticated caller, never logged.
func (cf *CloudFoundrySpecification) getNativeServiceKeyDetails(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	keyGUID := c.Param("keyGuid")
	if cnsiGUID == "" || keyGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and keyGuid are required")
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

	details, detErr := cfClient.ServiceCredentialBindings().GetDetails(reqCtx, keyGUID)
	if detErr != nil {
		return handleCapiError(c, detErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return c.JSON(http.StatusOK, details)
}

// getNativeServiceKeyParameters handles
// GET /pp/v1/cf/service_keys/{cnsiGuid}/{keyGuid}/parameters.
//
// Surfaces the broker-specific parameters the key was created with (v3 GET
// .../parameters). Read-only; no job handoff.
func (cf *CloudFoundrySpecification) getNativeServiceKeyParameters(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	keyGUID := c.Param("keyGuid")
	if cnsiGUID == "" || keyGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and keyGuid are required")
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

	params, paramErr := cfClient.ServiceCredentialBindings().GetParameters(reqCtx, keyGUID)
	if paramErr != nil {
		return handleCapiError(c, paramErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return c.JSON(http.StatusOK, params)
}

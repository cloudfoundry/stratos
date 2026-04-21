// src/jetstream/plugins/cloudfoundry/native_service_bindings.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
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
// 202 Accepted on the async path (job body). Upstream errors flow through
// handleCapiError to preserve CF's error envelope classification.
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

	cfClient, err := newCapiClient(c.Request().Context(), cf.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	result, createErr := cfClient.ServiceCredentialBindings().Create(c.Request().Context(), &req)
	if createErr != nil {
		return handleCapiError(c, createErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	// Async broker returns a Job; sync returns the binding directly.
	if _, isJob := result.(*capi.Job); isJob {
		return c.JSON(http.StatusAccepted, result)
	}
	return c.JSON(http.StatusCreated, result)
}

// deleteServiceBinding handles DELETE /pp/v1/cf/service_bindings/{cnsiGuid}/{bindingGuid}
// — the Stratos-shape write wrapper around CF v3
// /v3/service_credential_bindings/{guid}.
//
// CF returns 202 Accepted with a Job resource for async broker-backed
// unbinding. The capi client's Delete returns (*Job, error); on success we
// surface 202 Accepted to the Stratos caller. Upstream errors are routed
// through handleCapiError for status + envelope preservation.
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

	cfClient, err := newCapiClient(c.Request().Context(), cf.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	if _, deleteErr := cfClient.ServiceCredentialBindings().Delete(c.Request().Context(), bindingGUID); deleteErr != nil {
		return handleCapiError(c, deleteErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	c.Response().WriteHeader(http.StatusAccepted)
	return nil
}

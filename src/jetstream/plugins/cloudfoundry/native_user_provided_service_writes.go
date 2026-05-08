// src/jetstream/plugins/cloudfoundry/native_user_provided_service_writes.go
package cloudfoundry

import (
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// createUserProvidedServiceInstance handles
//
//	POST /pp/v1/cf/user_provided_service_instances/{cnsiGuid}.
//
// Creates a UPS through the unified v3 /v3/service_instances endpoint
// with `type=user-provided`. Sync only (no broker round-trip), so the
// CAPI call returns the full instance directly — no async-job dance.
//
// Request body shape: StUserProvidedServiceRequest. `name` and
// `spaceGuid` are required. The handler translates the flat
// `spaceGuid` into the v3 relationships envelope CAPI expects.
func (c *CloudFoundrySpecification) createUserProvidedServiceInstance(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	var body StUserProvidedServiceRequest
	if berr := ctx.Bind(&body); berr != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body: "+berr.Error())
	}
	if body.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}
	if body.SpaceGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "spaceGuid is required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	req := &capi.ServiceInstanceCreateRequest{
		Type: "user-provided",
		Name: body.Name,
		Tags: body.Tags,
		Relationships: capi.ServiceInstanceRelationships{
			Space: capi.Relationship{
				Data: &capi.RelationshipData{GUID: body.SpaceGUID},
			},
		},
	}
	if len(body.Credentials) > 0 {
		req.Credentials = body.Credentials
	}
	if body.SyslogDrainURL != "" {
		s := body.SyslogDrainURL
		req.SyslogDrainURL = &s
	}
	if body.RouteServiceURL != "" {
		r := body.RouteServiceURL
		req.RouteServiceURL = &r
	}

	out, cerr := cfClient.ServiceInstances().Create(ctx.Request().Context(), req)
	if cerr != nil {
		return handleCapiError(ctx, cerr)
	}
	si, ok := out.(*capi.ServiceInstance)
	if !ok || si == nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "expected user-provided service instance, got async job — broker call should not occur")
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusCreated, toStServiceInstance(*si, cnsiGUID, instanceIncludes{}, ReturnSummary))
}

// updateUserProvidedServiceInstance handles
//
//	PATCH /pp/v1/cf/user_provided_service_instances/{cnsiGuid}/{siGuid}.
//
// Updates a UPS via v3 /v3/service_instances/{guid}. UPS updates are
// sync — like create, the CAPI client returns the resource directly.
// `type` is intentionally NOT sent on update — v3 forbids changing the
// instance discriminator.
func (c *CloudFoundrySpecification) updateUserProvidedServiceInstance(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	siGUID := ctx.Param("siGuid")
	if cnsiGUID == "" || siGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and siGuid are required")
	}

	var body StUserProvidedServiceRequest
	if berr := ctx.Bind(&body); berr != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body: "+berr.Error())
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	req := &capi.ServiceInstanceUpdateRequest{}
	if body.Name != "" {
		n := body.Name
		req.Name = &n
	}
	if body.Tags != nil {
		req.Tags = body.Tags
	}
	if len(body.Credentials) > 0 {
		req.Credentials = body.Credentials
	}
	if body.SyslogDrainURL != "" {
		s := body.SyslogDrainURL
		req.SyslogDrainURL = &s
	}
	if body.RouteServiceURL != "" {
		r := body.RouteServiceURL
		req.RouteServiceURL = &r
	}

	out, uerr := cfClient.ServiceInstances().Update(ctx.Request().Context(), siGUID, req)
	if uerr != nil {
		return handleCapiError(ctx, uerr)
	}
	si, ok := out.(*capi.ServiceInstance)
	if !ok || si == nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "expected user-provided service instance, got async job — broker call should not occur")
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, toStServiceInstance(*si, cnsiGUID, instanceIncludes{}, ReturnSummary))
}

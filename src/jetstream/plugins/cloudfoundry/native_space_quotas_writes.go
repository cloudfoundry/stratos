// src/jetstream/plugins/cloudfoundry/native_space_quotas_writes.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// createNativeSpaceQuota handles POST /pp/v1/cf/space_quotas/{cnsiGuid} —
// Stratos-shape wrapper around CF V3 POST /v3/space_quotas.
//
// Sync write: V3 returns 201 with the created quota. Body shape is
// capi.SpaceQuotaV3CreateRequest = {name, apps?, services?, routes?,
// relationships:{organization:{data:{guid}}, spaces:{data:[...]}}, metadata?}.
func (c *CloudFoundrySpecification) createNativeSpaceQuota(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	var req capi.SpaceQuotaV3CreateRequest
	if err := json.NewDecoder(ctx.Request().Body).Decode(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid body: %v", err))
	}
	if req.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}
	if req.Relationships.Organization.Data == nil || req.Relationships.Organization.Data.GUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "relationships.organization.data.guid is required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	q, createErr := cfClient.SpaceQuotas().Create(ctx.Request().Context(), &req)
	if createErr != nil {
		return handleCapiError(ctx, createErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusCreated, toStSpaceQuota(*q, cnsiGUID))
}

// updateNativeSpaceQuota handles PATCH /pp/v1/cf/space_quotas/{cnsiGuid}/{quotaGuid} —
// Stratos-shape wrapper around CF V3 PATCH /v3/space_quotas/{guid}.
func (c *CloudFoundrySpecification) updateNativeSpaceQuota(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	quotaGUID := ctx.Param("quotaGuid")
	if cnsiGUID == "" || quotaGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and quotaGuid are required")
	}

	var req capi.SpaceQuotaV3UpdateRequest
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

	q, updErr := cfClient.SpaceQuotas().Update(ctx.Request().Context(), quotaGUID, &req)
	if updErr != nil {
		return handleCapiError(ctx, updErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, toStSpaceQuota(*q, cnsiGUID))
}

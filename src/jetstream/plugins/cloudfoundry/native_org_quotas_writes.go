// src/jetstream/plugins/cloudfoundry/native_org_quotas_writes.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// createNativeOrgQuota handles POST /pp/v1/cf/organization_quotas/{cnsiGuid} —
// Stratos-shape wrapper around CF V3 POST /v3/organization_quotas.
//
// Sync write: V3 returns 201 with the created quota. Body shape is
// capi.OrganizationQuotaCreateRequest = {name, apps?, services?, routes?,
// domains?, metadata?}.
func (c *CloudFoundrySpecification) createNativeOrgQuota(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	var req capi.OrganizationQuotaCreateRequest
	if err := json.NewDecoder(ctx.Request().Body).Decode(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid body: %v", err))
	}
	if req.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	q, createErr := cfClient.OrganizationQuotas().Create(ctx.Request().Context(), &req)
	if createErr != nil {
		return handleCapiError(ctx, createErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusCreated, toStOrgQuota(*q, cnsiGUID))
}

// updateNativeOrgQuota handles PATCH /pp/v1/cf/organization_quotas/{cnsiGuid}/{quotaGuid} —
// Stratos-shape wrapper around CF V3 PATCH /v3/organization_quotas/{guid}.
func (c *CloudFoundrySpecification) updateNativeOrgQuota(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	quotaGUID := ctx.Param("quotaGuid")
	if cnsiGUID == "" || quotaGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and quotaGuid are required")
	}

	var req capi.OrganizationQuotaUpdateRequest
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

	q, updErr := cfClient.OrganizationQuotas().Update(ctx.Request().Context(), quotaGUID, &req)
	if updErr != nil {
		return handleCapiError(ctx, updErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, toStOrgQuota(*q, cnsiGUID))
}

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

// applyOrgQuotaToOrgs handles POST /pp/v1/cf/organization_quotas/{cnsiGuid}/{quotaGuid}/relationships/organizations —
// Stratos-shape wrapper around CF V3 POST
// /v3/organization_quotas/{quota_guid}/relationships/organizations. Used
// when assigning an org quota to a newly-created organization or
// changing the quota on an existing one.
//
// Body shape: { "data": [{ "guid": "<org_guid>" }, ...] }.
func (c *CloudFoundrySpecification) applyOrgQuotaToOrgs(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	quotaGUID := ctx.Param("quotaGuid")
	if cnsiGUID == "" || quotaGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and quotaGuid are required")
	}

	var req struct {
		Data []struct {
			GUID string `json:"guid"`
		} `json:"data"`
	}
	if err := json.NewDecoder(ctx.Request().Body).Decode(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid body: %v", err))
	}
	orgGUIDs := make([]string, 0, len(req.Data))
	for _, d := range req.Data {
		if d.GUID != "" {
			orgGUIDs = append(orgGUIDs, d.GUID)
		}
	}
	if len(orgGUIDs) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "data must contain at least one org guid")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	rel, applyErr := cfClient.OrganizationQuotas().ApplyToOrganizations(ctx.Request().Context(), quotaGUID, orgGUIDs)
	if applyErr != nil {
		return handleCapiError(ctx, applyErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, rel)
}

// deleteNativeOrgQuota handles
//
//	DELETE /pp/v1/cf/organization_quotas/{cnsiGuid}/{quotaGuid}
//
// Stratos-shape wrapper around CF V3 DELETE /v3/organization_quotas/{guid}.
// Per-row Delete on the CF Quotas tab restores the V2-era listActionDelete
// the signal-native migration dropped. CF refuses the delete with 422 if
// any orgs are still assigned the quota, so the consumer side surfaces
// that error to the user via a snackbar without any pre-check here.
func (c *CloudFoundrySpecification) deleteNativeOrgQuota(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	quotaGUID := ctx.Param("quotaGuid")
	if cnsiGUID == "" || quotaGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and quotaGuid are required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	// fw-capi >= v3.217 returns the async job ref; the UI contract here
	// stays 204-on-accepted, so the job is not yet surfaced.
	if _, delErr := cfClient.OrganizationQuotas().Delete(ctx.Request().Context(), quotaGUID); delErr != nil {
		return handleCapiError(ctx, delErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.NoContent(http.StatusNoContent)
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

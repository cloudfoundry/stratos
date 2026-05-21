// src/jetstream/plugins/cloudfoundry/native_space_quotas_reads.go
package cloudfoundry

import (
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeSpaceQuotas handles GET /pp/v1/cf/space_quotas/{cnsiGuid}.
//
// Returns every space quota registered on the foundation as flat
// StSpaceQuota DTOs. Drives the CF-level Space Quotas tab. Each quota
// belongs to exactly one organization and may be applied to any number
// of spaces in that org. Read-only at this tier — create/update/delete
// and apply-to-spaces stay legacy until a use case warrants them.
//
// Mirrors the org-quota handler, with two shape differences: space
// quotas don't gate domains, and each quota stamps an OrganizationGUID
// pointing at its parent org. -1 = "Unlimited" convention is the same.
func (c *CloudFoundrySpecification) getNativeSpaceQuotas(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	if ctx.QueryParam("return") == "counts" {
		params := capi.NewQueryParams().WithPerPage(1)
		raw, lerr := cfClient.SpaceQuotas().List(ctx.Request().Context(), params)
		if lerr != nil {
			return echo.NewHTTPError(http.StatusBadGateway, lerr.Error())
		}
		return ctx.JSON(http.StatusOK, StSpaceQuotasResponse{
			Resources:    []StSpaceQuota{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	// Wire-contract passthrough.
	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present)
	raw, listErr := cfClient.SpaceQuotas().List(ctx.Request().Context(), params)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}

	out := make([]StSpaceQuota, 0, len(raw.Resources))
	for _, q := range raw.Resources {
		out = append(out, toStSpaceQuota(q, cnsiGUID))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StSpaceQuota]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// getNativeSpaceQuotaDetail handles GET /pp/v1/cf/space_quotas/{cnsiGuid}/{quotaGuid}.
//
// Returns a single space quota by GUID as a flat StSpaceQuota. Drives
// the Space Quota detail page (and any single-quota lookup that
// previously hit V2's space_quota_definitions/{guid}).
func (c *CloudFoundrySpecification) getNativeSpaceQuotaDetail(ctx echo.Context) error {
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

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	q, getErr := cfClient.SpaceQuotas().Get(ctx.Request().Context(), quotaGUID)
	if getErr != nil {
		return handleCapiError(ctx, getErr)
	}

	return ctx.JSON(http.StatusOK, toStSpaceQuota(*q, cnsiGUID))
}

// toStSpaceQuota maps a capi.SpaceQuotaV3 onto a Stratos-shape
// StSpaceQuota. Same nil-int → -1 ("Unlimited") coercion as
// toStOrgQuota; the parent OrganizationGUID is read off the
// Relationships.Organization.Data record.
func toStSpaceQuota(q capi.SpaceQuotaV3, cnsiGUID string) StSpaceQuota {
	out := StSpaceQuota{
		GUID:                    q.GUID,
		Name:                    q.Name,
		TotalMemoryInMB:         -1,
		TotalInstanceMemoryInMB: -1,
		TotalInstances:          -1,
		TotalAppTasks:           -1,
		TotalServiceInstances:   -1,
		TotalServiceKeys:        -1,
		TotalRoutes:             -1,
		TotalReservedPorts:      -1,
		CnsiGUID:                cnsiGUID,
		CreatedAt:               q.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:               q.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	if q.Apps != nil {
		out.TotalMemoryInMB = nilIntToUnlimited(q.Apps.TotalMemoryInMB)
		out.TotalInstanceMemoryInMB = nilIntToUnlimited(q.Apps.TotalInstanceMemoryInMB)
		out.TotalInstances = nilIntToUnlimited(q.Apps.TotalInstances)
		out.TotalAppTasks = nilIntToUnlimited(q.Apps.TotalAppTasks)
	}
	if q.Services != nil {
		if q.Services.PaidServicesAllowed != nil {
			out.PaidServicesAllowed = *q.Services.PaidServicesAllowed
		}
		out.TotalServiceInstances = nilIntToUnlimited(q.Services.TotalServiceInstances)
		out.TotalServiceKeys = nilIntToUnlimited(q.Services.TotalServiceKeys)
	}
	if q.Routes != nil {
		out.TotalRoutes = nilIntToUnlimited(q.Routes.TotalRoutes)
		out.TotalReservedPorts = nilIntToUnlimited(q.Routes.TotalReservedPorts)
	}
	if q.Relationships != nil {
		if q.Relationships.Organization.Data != nil {
			out.OrganizationGUID = q.Relationships.Organization.Data.GUID
		}
		out.SpaceCount = len(q.Relationships.Spaces.Data)
	}
	return out
}

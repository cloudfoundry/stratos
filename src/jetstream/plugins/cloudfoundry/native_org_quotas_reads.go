// src/jetstream/plugins/cloudfoundry/native_org_quotas_reads.go
package cloudfoundry

import (
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeOrgQuotas handles GET /pp/v1/cf/organization_quotas/{cnsiGuid}.
//
// Returns every org quota registered on the foundation as flat StOrgQuota
// DTOs. Drives the CF-level Org Quotas tab. Foundations expose a small
// number of named quotas — single page is the common case — but the
// handler still drains pagination defensively.
//
// Implementation: CF v3's org quotas resource is served by GET
// /v3/organization_quotas. We page through results, mapping
// capi.OrganizationQuota → StOrgQuota along the way. The capi limit
// fields are *int (null means "no limit"); we coerce nil → -1 server-
// side so the wire shape stays flat ints and the frontend renders -1
// as "Unlimited" without null-guarding each cell.
func (c *CloudFoundrySpecification) getNativeOrgQuotas(ctx echo.Context) error {
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
		raw, lerr := cfClient.OrganizationQuotas().List(ctx.Request().Context(), params)
		if lerr != nil {
			return lerr
		}
		return ctx.JSON(http.StatusOK, StOrgQuotasResponse{
			Resources:    []StOrgQuota{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	// Wire-contract passthrough.
	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present)
	raw, listErr := cfClient.OrganizationQuotas().List(ctx.Request().Context(), params)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}

	out := make([]StOrgQuota, 0, len(raw.Resources))
	for _, q := range raw.Resources {
		out = append(out, toStOrgQuota(q, cnsiGUID))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StOrgQuota]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// getNativeOrgQuotaDetail handles GET /pp/v1/cf/organization_quotas/{cnsiGuid}/{quotaGuid}.
//
// Returns a single org quota by GUID as a flat StOrgQuota. Drives the
// "Quota Definition" link in the org Summary header and any other
// single-quota lookup that previously hit V2's quota_definitions/{guid}.
func (c *CloudFoundrySpecification) getNativeOrgQuotaDetail(ctx echo.Context) error {
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

	q, getErr := cfClient.OrganizationQuotas().Get(ctx.Request().Context(), quotaGUID)
	if getErr != nil {
		return handleCapiError(ctx, getErr)
	}

	return ctx.JSON(http.StatusOK, toStOrgQuota(*q, cnsiGUID))
}

// nilIntToUnlimited coerces a nullable int limit (capi convention: nil =
// "no limit") to the wire value -1 so the frontend can render "Unlimited"
// uniformly across every limit cell.
func nilIntToUnlimited(p *int) int {
	if p == nil {
		return -1
	}
	return *p
}

// toStOrgQuota maps a capi.OrganizationQuota onto a Stratos-shape
// StOrgQuota. The capi shape is deeply nested (Apps / Services / Routes
// / Domains / Relationships); the Stratos shape flattens it for list-
// row rendering. The full nested view is a future detail-screen concern.
func toStOrgQuota(q capi.OrganizationQuota, cnsiGUID string) StOrgQuota {
	out := StOrgQuota{
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
		TotalDomains:            -1,
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
	if q.Domains != nil {
		out.TotalDomains = nilIntToUnlimited(q.Domains.TotalDomains)
	}
	if q.Relationships != nil {
		out.OrganizationCount = len(q.Relationships.Organizations.Data)
	}
	return out
}

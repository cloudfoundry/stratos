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

	resources := make([]capi.SpaceQuotaV3, 0)
	page := 1
	for {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		raw, listErr := cfClient.SpaceQuotas().List(ctx.Request().Context(), params)
		if listErr != nil {
			return handleCapiError(ctx, listErr)
		}
		resources = append(resources, raw.Resources...)
		if raw.Pagination.Next == nil || raw.Pagination.Next.Href == "" {
			break
		}
		page++
	}

	out := make([]StSpaceQuota, 0, len(resources))
	for _, q := range resources {
		out = append(out, toStSpaceQuota(q, cnsiGUID))
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, StSpaceQuotasResponse{
		Resources:    out,
		TotalResults: len(out),
	})
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

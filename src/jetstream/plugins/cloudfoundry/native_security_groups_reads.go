// src/jetstream/plugins/cloudfoundry/native_security_groups_reads.go
package cloudfoundry

import (
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeSecurityGroups handles GET /pp/v1/cf/security_groups/{cnsiGuid}.
//
// Returns every security group registered on the foundation as flat
// StSecurityGroup DTOs. Drives the CF-level Security Groups tab.
// Foundations may expose dozens of security groups so the handler drains
// pagination defensively.
//
// Implementation: CF v3's security groups resource is served by
// GET /v3/security_groups. We page through results, mapping
// capi.SecurityGroup → StSecurityGroup along the way, and stamp cnsiGuid
// onto each row so multi-CNSI rendering keys by (cnsi, security group)
// consistently with every other St* DTO. Rule arrays and space bind
// arrays are reduced to counts on the list shape; the future detail
// screen will own the full rule table.
func (c *CloudFoundrySpecification) getNativeSecurityGroups(ctx echo.Context) error {
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
		raw, lerr := cfClient.SecurityGroups().List(ctx.Request().Context(), params)
		if lerr != nil {
			return lerr
		}
		return ctx.JSON(http.StatusOK, StSecurityGroupsResponse{
			Resources:    []StSecurityGroup{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	// Wire-contract passthrough.
	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present)
	raw, listErr := cfClient.SecurityGroups().List(ctx.Request().Context(), params)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}

	out := make([]StSecurityGroup, 0, len(raw.Resources))
	for _, sg := range raw.Resources {
		out = append(out, toStSecurityGroup(sg, cnsiGUID))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StSecurityGroup]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// toStSecurityGroup maps a capi.SecurityGroup onto a Stratos-shape
// StSecurityGroup. The list shape doesn't include the rule array —
// aggregate counts (rules, running spaces, staging spaces) suffice for
// row rendering, and a future detail screen will fetch the full payload.
func toStSecurityGroup(sg capi.SecurityGroup, cnsiGUID string) StSecurityGroup {
	return StSecurityGroup{
		GUID:                   sg.GUID,
		Name:                   sg.Name,
		GloballyEnabledRunning: sg.GloballyEnabled.Running,
		GloballyEnabledStaging: sg.GloballyEnabled.Staging,
		RuleCount:              len(sg.Rules),
		RunningSpaceCount:      len(sg.Relationships.RunningSpaces.Data),
		StagingSpaceCount:      len(sg.Relationships.StagingSpaces.Data),
		CnsiGUID:               cnsiGUID,
		CreatedAt:              sg.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:              sg.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

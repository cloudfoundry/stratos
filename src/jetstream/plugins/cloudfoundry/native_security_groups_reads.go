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

	resources := make([]capi.SecurityGroup, 0)
	page := 1
	for {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		raw, listErr := cfClient.SecurityGroups().List(ctx.Request().Context(), params)
		if listErr != nil {
			return handleCapiError(ctx, listErr)
		}
		resources = append(resources, raw.Resources...)
		if raw.Pagination.Next == nil || raw.Pagination.Next.Href == "" {
			break
		}
		page++
	}

	out := make([]StSecurityGroup, 0, len(resources))
	for _, sg := range resources {
		out = append(out, toStSecurityGroup(sg, cnsiGUID))
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, StSecurityGroupsResponse{
		Resources:    out,
		TotalResults: len(out),
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

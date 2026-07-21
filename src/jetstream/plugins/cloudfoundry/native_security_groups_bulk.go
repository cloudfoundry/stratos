// src/jetstream/plugins/cloudfoundry/native_security_groups_bulk.go
package cloudfoundry

import (
	"context"
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// securityGroupSpaceBinder is the capi call shared by the running- and
// staging-space bulk-bind handlers: both take the security group GUID and the
// list of space GUIDs and return the resulting to-many relationship. Passing
// the bind function in keeps the two handlers a one-line dispatch apart —
// running vs staging is purely which CF sub-resource the call targets.
type securityGroupSpaceBinder func(ctx context.Context, sgGUID string, spaceGUIDs []string) (*capi.ToManyRelationship, error)

// bindSecurityGroupRunningSpaces handles
// POST /pp/v1/cf/security_groups/{cnsiGuid}/{sgGuid}/relationships/running_spaces
// — bulk-bind a security group to N spaces for the running lifecycle.
//
// Body: {"guids": [spaceGUID, ...]}. Unlike the route bulk endpoints, CF v3
// exposes a single batch relationship endpoint here, so there is no fan-out:
// one synchronous POST /v3/security_groups/{guid}/relationships/running_spaces
// applies every space at once and returns the full to-many relationship,
// which we pass through as the 200 body (mirrors applyOrgQuotaToOrgs).
func (c *CloudFoundrySpecification) bindSecurityGroupRunningSpaces(ctx echo.Context) error {
	return c.bindSecurityGroupSpaces(ctx, func(reqCtx context.Context, cfClient capi.Client, sgGUID string, spaceGUIDs []string) (*capi.ToManyRelationship, error) {
		return cfClient.SecurityGroups().BindRunningSpaces(reqCtx, sgGUID, spaceGUIDs)
	})
}

// bindSecurityGroupStagingSpaces handles
// POST /pp/v1/cf/security_groups/{cnsiGuid}/{sgGuid}/relationships/staging_spaces
// — bulk-bind a security group to N spaces for the staging lifecycle. The
// staging analogue of bindSecurityGroupRunningSpaces; identical shape, it
// targets CF's staging_spaces relationship instead.
func (c *CloudFoundrySpecification) bindSecurityGroupStagingSpaces(ctx echo.Context) error {
	return c.bindSecurityGroupSpaces(ctx, func(reqCtx context.Context, cfClient capi.Client, sgGUID string, spaceGUIDs []string) (*capi.ToManyRelationship, error) {
		return cfClient.SecurityGroups().BindStagingSpaces(reqCtx, sgGUID, spaceGUIDs)
	})
}

// bindSecurityGroupSpaces is the shared body of the running/staging bulk-bind
// handlers: validate params + {"guids":[...]} body, resolve the capi client,
// invoke the supplied bind function, and pass the resulting relationship
// through. The bind closure receives the resolved client so the two variants
// differ only by which SecurityGroups() bind method they call.
func (c *CloudFoundrySpecification) bindSecurityGroupSpaces(
	ctx echo.Context,
	bind func(reqCtx context.Context, cfClient capi.Client, sgGUID string, spaceGUIDs []string) (*capi.ToManyRelationship, error),
) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	sgGUID := ctx.Param("sgGuid")
	if cnsiGUID == "" || sgGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and sgGuid are required")
	}

	spaceGUIDs, err := decodeBulkGUIDs(ctx)
	if err != nil {
		return err
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	reqCtx := ctx.Request().Context()
	cfClient, err := newCapiClient(reqCtx, c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	rel, bindErr := bind(reqCtx, cfClient, sgGUID, spaceGUIDs)
	if bindErr != nil {
		return handleCapiError(ctx, bindErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, rel)
}

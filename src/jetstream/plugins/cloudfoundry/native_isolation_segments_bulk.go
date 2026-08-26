// src/jetstream/plugins/cloudfoundry/native_isolation_segments_bulk.go
package cloudfoundry

import (
	"net/http"

	"github.com/labstack/echo/v5"
)

// entitleIsolationSegmentOrgs handles POST
// /pp/v1/cf/isolation_segments/{cnsiGuid}/{isoGuid}/relationships/organizations —
// Stratos bulk wrapper around CF V3 POST
// /v3/isolation_segments/{guid}/relationships/organizations. Entitles one
// isolation segment to N target organizations in a single request.
//
// Unlike the fan-out bulk endpoints in native_bulk.go, CF exposes entitlement
// as one to-many relationship write, so a single capi call carries all the
// org GUIDs. The body is the shared {"guids": [...]} shape decoded by
// decodeBulkGUIDs; each GUID becomes an entitled-organization relationship.
//
// Response is the CF relationships envelope (capi.ToManyRelationship =
// {data:[{guid}]}), returned as-is with a schema-version header — matching
// shareServiceInstanceSpaces / applyOrgQuotaToOrgs.
func (cf *CloudFoundrySpecification) entitleIsolationSegmentOrgs(c *echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	isoGUID := c.Param("isoGuid")
	if cnsiGUID == "" || isoGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and isoGuid are required")
	}

	orgGUIDs, err := decodeBulkGUIDs(c)
	if err != nil {
		return err
	}

	userGUID, err := cf.getUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	reqCtx := c.Request().Context()
	cfClient, err := newCapiClient(reqCtx, cf.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	rel, entitleErr := cfClient.IsolationSegments().EntitleOrganizations(reqCtx, isoGUID, orgGUIDs)
	if entitleErr != nil {
		return handleCapiError(c, entitleErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return c.JSON(http.StatusOK, rel)
}

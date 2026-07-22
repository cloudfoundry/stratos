// src/jetstream/plugins/cloudfoundry/native_service_instance_share.go
package cloudfoundry

import (
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// shareServiceInstanceSpaces handles POST
// /pp/v1/cf/service_instances/{cnsiGuid}/{siGuid}/relationships/shared_spaces —
// Stratos bulk wrapper around CF V3 POST
// /v3/service_instances/{guid}/relationships/shared_spaces. Shares one
// service instance with N target spaces in a single request.
//
// Unlike the fan-out bulk endpoints in native_bulk.go, CF exposes sharing
// as one to-many relationship write, so a single capi call carries all the
// space GUIDs. The body is the shared {"guids": [...]} shape decoded by
// decodeBulkGUIDs; each GUID becomes a target-space relationship.
//
// Response is the CF shared-spaces relationships envelope
// (capi.ServiceInstanceSharedSpacesRelationships = {data:[{guid}], links}),
// returned as-is with a schema-version header — matching applyOrgQuotaToOrgs.
func (cf *CloudFoundrySpecification) shareServiceInstanceSpaces(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	siGUID := c.Param("siGuid")
	if cnsiGUID == "" || siGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and siGuid are required")
	}

	spaceGUIDs, err := decodeBulkGUIDs(c)
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

	shareReq := &capi.ServiceInstanceShareRequest{
		Data: make([]capi.Relationship, 0, len(spaceGUIDs)),
	}
	for _, g := range spaceGUIDs {
		shareReq.Data = append(shareReq.Data, capi.Relationship{
			Data: &capi.RelationshipData{GUID: g},
		})
	}

	rel, shareErr := cfClient.ServiceInstances().ShareWithSpaces(reqCtx, siGUID, shareReq)
	if shareErr != nil {
		return handleCapiError(c, shareErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return c.JSON(http.StatusOK, rel)
}

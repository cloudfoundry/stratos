// src/jetstream/plugins/cloudfoundry/native_roles_writes.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// createNativeRole handles POST /pp/v1/cf/roles/{cnsiGuid} —
// Stratos-shape wrapper around CF V3 POST /v3/roles for role assignment.
//
// Body shape (V3 wire-compatible):
//
//	{
//	  "type": "organization_manager" | "space_developer" | ...,
//	  "relationships": {
//	    "user":         { "data": { "guid": "..." } },
//	    "organization": { "data": { "guid": "..." } }   // OR
//	    "space":        { "data": { "guid": "..." } }
//	  }
//	}
//
// V3 returns 201 with the new role resource — sync write.
func (cf *CloudFoundrySpecification) createNativeRole(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	var req capi.RoleCreateRequest
	if err := json.NewDecoder(c.Request().Body).Decode(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid body: %v", err))
	}
	if req.Type == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "type is required")
	}
	if req.Relationships.User.Data == nil || req.Relationships.User.Data.GUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "relationships.user.data.guid is required")
	}
	hasOrg := req.Relationships.Organization != nil && req.Relationships.Organization.Data != nil && req.Relationships.Organization.Data.GUID != ""
	hasSpace := req.Relationships.Space != nil && req.Relationships.Space.Data != nil && req.Relationships.Space.Data.GUID != ""
	if !hasOrg && !hasSpace {
		return echo.NewHTTPError(http.StatusBadRequest, "relationships must include either organization or space")
	}
	if hasOrg && hasSpace {
		return echo.NewHTTPError(http.StatusBadRequest, "relationships must include only one of organization or space")
	}

	userGUID, err := cf.getUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(c.Request().Context(), cf.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	role, createErr := cfClient.Roles().Create(c.Request().Context(), &req)
	if createErr != nil {
		return handleCapiError(c, createErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return c.JSON(http.StatusCreated, role)
}

// deleteNativeRole handles DELETE /pp/v1/cf/roles/{cnsiGuid}/{roleGuid} —
// Stratos-shape write wrapper around CF V3 DELETE /v3/roles/{guid}.
//
// CF v3 returns 202 Accepted with a Location header pointing at
// /v3/jobs/{guid}. We hand that job to the stratosjobs fast-path wrapper:
// if the job resolves inside the fast-path window we return 200 with a
// terminal StratosJob body; otherwise we register the job in the tracker
// and return 202 with {id, state, startedAt} so the frontend can poll
// /pp/v1/stratos/jobs/{id}. Same pattern as deleteNativeOrg /
// deleteNativeApp.
func (cf *CloudFoundrySpecification) deleteNativeRole(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	roleGUID := c.Param("roleGuid")
	if cnsiGUID == "" || roleGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and roleGuid are required")
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

	job, delErr := cfClient.Roles().Delete(reqCtx, roleGUID)
	if delErr != nil {
		return handleCapiError(c, delErr)
	}
	if job == nil || job.GUID == "" {
		return echo.NewHTTPError(http.StatusBadGateway, "role delete: no job id returned from CF")
	}

	if cf.asyncTracker == nil || cf.asyncTranslator == nil {
		c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		c.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, cf.asyncTracker, cf.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.role.delete",
	})

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	if res.Resolved {
		if res.State == stratosjobs.JobStateFailed {
			return c.JSON(http.StatusBadGateway, map[string]interface{}{
				"state":  res.State,
				"errors": res.Errors,
			})
		}
		return c.JSON(http.StatusOK, map[string]interface{}{
			"state":  res.State,
			"result": res.Result,
		})
	}
	return c.JSON(http.StatusAccepted, res.HandoffJob)
}

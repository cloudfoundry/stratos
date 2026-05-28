// src/jetstream/plugins/cloudfoundry/native_spaces_writes.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// deleteNativeSpace handles DELETE /pp/v1/cf/spaces/{cnsiGuid}/{spaceGuid}
// — Stratos-shape write wrapper around CF V3 /v3/spaces/{guid}.
//
// Same async-job-contract shape as deleteNativeApp / deleteNativeOrg: CF
// returns 202 + Location → /v3/jobs/{guid}; Stratos fast-paths for the
// brief window or hands off a {id, state, startedAt} envelope for the
// frontend to poll.
func (c *CloudFoundrySpecification) deleteNativeSpace(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	spaceGUID := ctx.Param("spaceGuid")
	if cnsiGUID == "" || spaceGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and spaceGuid are required")
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

	job, delErr := cfClient.Spaces().Delete(reqCtx, spaceGUID)
	if delErr != nil {
		return handleCapiError(ctx, delErr)
	}
	if job == nil || job.GUID == "" {
		return echo.NewHTTPError(http.StatusBadGateway, "space delete: no job id returned from CF")
	}

	if c.asyncTracker == nil || c.asyncTranslator == nil {
		ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		ctx.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, c.asyncTracker, c.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.space.delete",
	})

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	if res.Resolved {
		if res.State == stratosjobs.JobStateFailed {
			return ctx.JSON(http.StatusBadGateway, map[string]interface{}{
				"state":  res.State,
				"errors": res.Errors,
			})
		}
		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"state":  res.State,
			"result": res.Result,
		})
	}
	return ctx.JSON(http.StatusAccepted, res.HandoffJob)
}

// createNativeSpace handles POST /pp/v1/cf/spaces/{cnsiGuid} —
// Stratos-shape wrapper around CF V3 POST /v3/spaces.
//
// Sync write: V3 returns 201 with the created space. Body is forwarded
// as capi.SpaceCreateRequest (V3 wire shape: {name, relationships:{
// organization:{data:{guid}}}}).
func (c *CloudFoundrySpecification) createNativeSpace(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	var req capi.SpaceCreateRequest
	if err := json.NewDecoder(ctx.Request().Body).Decode(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid body: %v", err))
	}
	if req.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}
	if req.Relationships.Organization.Data == nil || req.Relationships.Organization.Data.GUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "relationships.organization.data.guid is required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	space, createErr := cfClient.Spaces().Create(ctx.Request().Context(), &req)
	if createErr != nil {
		return handleCapiError(ctx, createErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusCreated, toStSpace(*space, cnsiGUID))
}

// updateNativeSpace handles PATCH /pp/v1/cf/spaces/{cnsiGuid}/{spaceGuid} —
// Stratos-shape wrapper around CF V3 PATCH /v3/spaces/{guid}.
//
// Sync write: V3 returns 200 with the updated space. Body shape is
// capi.SpaceUpdateRequest = {name?, metadata?}.
func (c *CloudFoundrySpecification) updateNativeSpace(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	spaceGUID := ctx.Param("spaceGuid")
	if cnsiGUID == "" || spaceGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and spaceGuid are required")
	}

	var req capi.SpaceUpdateRequest
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

	space, updErr := cfClient.Spaces().Update(ctx.Request().Context(), spaceGUID, &req)
	if updErr != nil {
		return handleCapiError(ctx, updErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, toStSpace(*space, cnsiGUID))
}

// setSpaceSshFeature handles
//
//	PUT /pp/v1/cf/spaces/{cnsiGuid}/{spaceGuid}/features/ssh
//
// Body: { "enabled": true|false }.
// Wraps CF V3 PATCH /v3/spaces/{guid}/features/ssh. V3 lifted SSH out
// of the space attributes endpoint into a separate feature toggle, so
// the edit-space-step wizard chains PATCH /v3/spaces (name) + this call
// (ssh) to match the legacy V2 PATCH /v2/spaces/{guid} that handled both
// inline.
func (c *CloudFoundrySpecification) setSpaceSshFeature(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	spaceGUID := ctx.Param("spaceGuid")
	if cnsiGUID == "" || spaceGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and spaceGuid are required")
	}

	var body struct {
		Enabled bool `json:"enabled"`
	}
	if err := json.NewDecoder(ctx.Request().Body).Decode(&body); err != nil {
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

	feat, updErr := cfClient.Spaces().UpdateFeature(ctx.Request().Context(), spaceGUID, "ssh", body.Enabled)
	if updErr != nil {
		return handleCapiError(ctx, updErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, feat)
}

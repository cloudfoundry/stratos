// src/jetstream/plugins/cloudfoundry/native_space_quotas_writes.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// createNativeSpaceQuota handles POST /pp/v1/cf/space_quotas/{cnsiGuid} —
// Stratos-shape wrapper around CF V3 POST /v3/space_quotas.
//
// Sync write: V3 returns 201 with the created quota. Body shape is
// capi.SpaceQuotaV3CreateRequest = {name, apps?, services?, routes?,
// relationships:{organization:{data:{guid}}, spaces:{data:[...]}}, metadata?}.
func (c *CloudFoundrySpecification) createNativeSpaceQuota(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	var req capi.SpaceQuotaV3CreateRequest
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

	q, createErr := cfClient.SpaceQuotas().Create(ctx.Request().Context(), &req)
	if createErr != nil {
		return handleCapiError(ctx, createErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusCreated, toStSpaceQuota(*q, cnsiGUID))
}

// updateNativeSpaceQuota handles PATCH /pp/v1/cf/space_quotas/{cnsiGuid}/{quotaGuid} —
// Stratos-shape wrapper around CF V3 PATCH /v3/space_quotas/{guid}.
func (c *CloudFoundrySpecification) updateNativeSpaceQuota(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	quotaGUID := ctx.Param("quotaGuid")
	if cnsiGUID == "" || quotaGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and quotaGuid are required")
	}

	var req capi.SpaceQuotaV3UpdateRequest
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

	q, updErr := cfClient.SpaceQuotas().Update(ctx.Request().Context(), quotaGUID, &req)
	if updErr != nil {
		return handleCapiError(ctx, updErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, toStSpaceQuota(*q, cnsiGUID))
}

// deleteNativeSpaceQuota handles
//
//	DELETE /pp/v1/cf/space_quotas/{cnsiGuid}/{quotaGuid}
//
// Stratos-shape wrapper around CF V3 DELETE /v3/space_quotas/{guid}.
// Per-row Delete on the Org Space Quotas tab restores the V2-era
// listActionDelete that the signal-native migration dropped. CF
// refuses with 422 if any spaces are still assigned the quota; the
// consumer surfaces that error via snackbar without a pre-check.
func (c *CloudFoundrySpecification) deleteNativeSpaceQuota(ctx echo.Context) error {
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

	// fw-capi >= v3.217 returns the async job ref; the UI contract here
	// stays 204-on-accepted, so the job is not yet surfaced.
	if _, delErr := cfClient.SpaceQuotas().Delete(ctx.Request().Context(), quotaGUID); delErr != nil {
		return handleCapiError(ctx, delErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.NoContent(http.StatusNoContent)
}

// applySpaceQuotaToSpaces handles
//
//	POST /pp/v1/cf/space_quotas/{cnsiGuid}/{quotaGuid}/relationships/spaces
//
// Body: { "space_guids": ["guid1", "guid2", ...] }.
// Wraps CF V3 POST /v3/space_quotas/{guid}/relationships/spaces, which
// attaches the quota to one or more spaces in a single call.
// CF v3 dropped space-quota assignment at space-create time (the V2
// `space_quota_definition_guid` field on spaces); the wizard now
// chains create-space + apply-quota.
func (c *CloudFoundrySpecification) applySpaceQuotaToSpaces(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	quotaGUID := ctx.Param("quotaGuid")
	if cnsiGUID == "" || quotaGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and quotaGuid are required")
	}

	var body struct {
		SpaceGUIDs []string `json:"space_guids"`
	}
	if err := json.NewDecoder(ctx.Request().Body).Decode(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid body: %v", err))
	}
	if len(body.SpaceGUIDs) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "space_guids must not be empty")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	rel, applyErr := cfClient.SpaceQuotas().ApplyToSpaces(ctx.Request().Context(), quotaGUID, body.SpaceGUIDs)
	if applyErr != nil {
		return handleCapiError(ctx, applyErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, rel)
}

// removeSpaceQuotaFromSpace handles
//
//	DELETE /pp/v1/cf/space_quotas/{cnsiGuid}/{quotaGuid}/relationships/spaces/{spaceGuid}
//
// Wraps CF V3 DELETE /v3/space_quotas/{guid}/relationships/spaces/{space_guid}.
// Edit-space-step calls this when the user clears the quota on an existing
// space; v3 has no single endpoint to "switch" quota on a space, so the
// flow becomes remove-old + apply-new.
func (c *CloudFoundrySpecification) removeSpaceQuotaFromSpace(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	quotaGUID := ctx.Param("quotaGuid")
	spaceGUID := ctx.Param("spaceGuid")
	if cnsiGUID == "" || quotaGUID == "" || spaceGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid, quotaGuid, and spaceGuid are required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	if remErr := cfClient.SpaceQuotas().RemoveFromSpace(ctx.Request().Context(), quotaGUID, spaceGUID); remErr != nil {
		return handleCapiError(ctx, remErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.NoContent(http.StatusNoContent)
}

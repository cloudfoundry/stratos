// src/jetstream/plugins/cloudfoundry/native_feature_flags_reads.go
package cloudfoundry

import (
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeFeatureFlags handles GET /pp/v1/cf/feature_flags/{cnsiGuid}.
//
// Returns every feature flag registered on the foundation as flat
// StFeatureFlag DTOs. Drives the CF-level Feature Flags tab. CF
// foundations expose ~15 flags so a single page is the common case,
// but the handler still drains pagination defensively.
//
// Implementation: CF v3's feature flags resource is served by
// GET /v3/feature_flags. We page through results, mapping
// capi.FeatureFlag → StFeatureFlag along the way, and stamp cnsiGuid
// onto each row so multi-CNSI rendering keys by (cnsi, name)
// consistently with every other St* DTO. Unlike most resources, feature
// flags have no GUID — name is the identity — and no created_at.
func (c *CloudFoundrySpecification) getNativeFeatureFlags(ctx echo.Context) error {
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
		raw, lerr := cfClient.FeatureFlags().List(ctx.Request().Context(), params)
		if lerr != nil {
			return lerr
		}
		return ctx.JSON(http.StatusOK, StFeatureFlagsResponse{
			Resources:    []StFeatureFlag{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	// Wire-contract passthrough.
	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present)
	raw, listErr := cfClient.FeatureFlags().List(ctx.Request().Context(), params)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}

	out := make([]StFeatureFlag, 0, len(raw.Resources))
	for _, ff := range raw.Resources {
		out = append(out, toStFeatureFlag(ff, cnsiGUID))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StFeatureFlag]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// toStFeatureFlag maps a capi.FeatureFlag onto a Stratos-shape
// StFeatureFlag. Both UpdatedAt and CustomErrorMessage are *T in the
// v3 model; we coerce nil → "" so the wire shape stays flat strings —
// same as every other St* DTO with optional fields.
func toStFeatureFlag(ff capi.FeatureFlag, cnsiGUID string) StFeatureFlag {
	updatedAt := ""
	if ff.UpdatedAt != nil {
		updatedAt = ff.UpdatedAt.Format("2006-01-02T15:04:05Z07:00")
	}
	customErr := ""
	if ff.CustomErrorMessage != nil {
		customErr = *ff.CustomErrorMessage
	}
	return StFeatureFlag{
		Name:               ff.Name,
		Enabled:            ff.Enabled,
		CustomErrorMessage: customErr,
		CnsiGUID:           cnsiGUID,
		UpdatedAt:          updatedAt,
	}
}

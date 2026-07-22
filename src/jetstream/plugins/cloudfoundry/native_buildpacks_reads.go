// src/jetstream/plugins/cloudfoundry/native_buildpacks_reads.go
package cloudfoundry

import (
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeBuildpacks handles GET /pp/v1/cf/buildpacks/{cnsiGuid}.
//
// Returns every buildpack registered on the foundation as flat
// StBuildpack DTOs. Drives the CF-level Buildpacks tab. Buildpacks
// are read-only at this tier; foundations typically expose 10-30
// buildpacks but the handler still drains pagination defensively.
//
// Implementation: CF v3's buildpacks resource is served by GET
// /v3/buildpacks. We page through results, mapping capi.Buildpack
// → StBuildpack along the way, and stamp cnsiGuid onto each row so
// multi-CNSI rows + favorites can be keyed by (cnsi, buildpack)
// consistently with every other St* DTO.
func (c *CloudFoundrySpecification) getNativeBuildpacks(ctx echo.Context) error {
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
		raw, lerr := cfClient.Buildpacks().List(ctx.Request().Context(), params)
		if lerr != nil {
			return lerr
		}
		return ctx.JSON(http.StatusOK, StBuildpacksResponse{
			Resources:    []StBuildpack{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	// Wire-contract passthrough: forward client per_page+page to upstream V3
	// CAPI verbatim, return one CAPI page wrapped in a Stratos paged envelope.
	// When the caller omits per_page, the upstream call carries no per_page
	// either and V3 applies its server defaults (per_page=50, page=1).
	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present)
	raw, listErr := cfClient.Buildpacks().List(ctx.Request().Context(), params)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}

	out := make([]StBuildpack, 0, len(raw.Resources))
	for _, b := range raw.Resources {
		out = append(out, toStBuildpack(b, cnsiGUID))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StBuildpack]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// toStBuildpack maps a capi.Buildpack onto a Stratos-shape StBuildpack.
// Filename and Stack are *string in the v3 model (null when the buildpack
// is awaiting upload); we coerce nil → "" so the wire shape stays flat
// strings — same as every other St* DTO.
func toStBuildpack(b capi.Buildpack, cnsiGUID string) StBuildpack {
	filename := ""
	if b.Filename != nil {
		filename = *b.Filename
	}
	stack := ""
	if b.Stack != nil {
		stack = *b.Stack
	}
	return StBuildpack{
		GUID:      b.GUID,
		Name:      b.Name,
		State:     b.State,
		Filename:  filename,
		Stack:     stack,
		Position:  b.Position,
		Lifecycle: b.Lifecycle,
		Enabled:   b.Enabled,
		Locked:    b.Locked,
		CnsiGUID:  cnsiGUID,
		CreatedAt: b.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: b.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

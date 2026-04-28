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

	resources := make([]capi.Buildpack, 0)
	page := 1
	for {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		raw, listErr := cfClient.Buildpacks().List(ctx.Request().Context(), params)
		if listErr != nil {
			return handleCapiError(ctx, listErr)
		}
		resources = append(resources, raw.Resources...)
		if raw.Pagination.Next == nil || raw.Pagination.Next.Href == "" {
			break
		}
		page++
	}

	out := make([]StBuildpack, 0, len(resources))
	for _, b := range resources {
		out = append(out, toStBuildpack(b, cnsiGUID))
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, StBuildpacksResponse{
		Resources:    out,
		TotalResults: len(out),
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

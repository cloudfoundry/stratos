// src/jetstream/plugins/cloudfoundry/native_stacks_reads.go
package cloudfoundry

import (
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeStacks handles GET /pp/v1/cf/stacks/{cnsiGuid}.
//
// Returns every stack defined on the foundation as flat StStack DTOs.
// Drives the CF-level Stacks tab. Stacks are read-only at this tier;
// most foundations expose <10 stacks so a single page is the common
// case, but the handler still drains pagination defensively.
//
// Implementation: CF v3's stacks resource is served by GET /v3/stacks.
// We page through results, mapping capi.Stack → StStack along the way,
// and stamp cnsiGuid onto each row so multi-CNSI rows + favorites can
// be keyed by (cnsi, stack) consistently with every other St* DTO.
func (c *CloudFoundrySpecification) getNativeStacks(ctx echo.Context) error {
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
		raw, lerr := cfClient.Stacks().List(ctx.Request().Context(), params)
		if lerr != nil {
			return lerr
		}
		return ctx.JSON(http.StatusOK, StStacksResponse{
			Resources:    []StStack{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	// Wire-contract passthrough: forward client per_page+page to upstream V3
	// CAPI verbatim, return one CAPI page wrapped in a Stratos paged envelope.
	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present)
	raw, listErr := cfClient.Stacks().List(ctx.Request().Context(), params)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}

	out := make([]StStack, 0, len(raw.Resources))
	for _, s := range raw.Resources {
		out = append(out, toStStack(s, cnsiGUID))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StStack]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// toStStack maps a capi.Stack onto a Stratos-shape StStack. cnsiGUID is
// stamped into the row to key cross-CNSI rendering — same convention as
// StApp/StOrg/StRoute.
func toStStack(s capi.Stack, cnsiGUID string) StStack {
	return StStack{
		GUID:             s.GUID,
		Name:             s.Name,
		Description:      s.Description,
		BuildRootfsImage: s.BuildRootfsImage,
		RunRootfsImage:   s.RunRootfsImage,
		Default:          s.Default,
		CnsiGUID:         cnsiGUID,
		CreatedAt:        s.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:        s.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

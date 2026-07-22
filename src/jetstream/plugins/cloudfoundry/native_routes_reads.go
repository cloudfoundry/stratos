// src/jetstream/plugins/cloudfoundry/native_routes_reads.go
package cloudfoundry

import (
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getAppRoutes handles GET /pp/v1/cf/apps/{cnsiGuid}/{appGuid}/routes.
//
// Returns every route currently mapped to the given app, as flat StRoute
// DTOs. Used by the signal-native delete stepper (AppRoutesPickerComponent)
// to let the user opt into deleting route mappings alongside the app.
//
// Implementation: CF v3's "routes for app" is served by
//
//	GET /v3/routes?app_guids={appGuid}
//
// which returns routes that have a destination binding the requested app.
// Paged upstream; we drain every page so the picker shows a complete set
// even for apps with more than one page of routes (unusual but possible
// with path-based routing + multiple domains).
//
// Route.URL is CF-rendered (host + domain + optional port + path) so the
// frontend can display it as-is without re-composing from parts.
func (c *CloudFoundrySpecification) getAppRoutes(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	appGUID := ctx.Param("appGuid")
	if cnsiGUID == "" || appGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and appGuid are required")
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
		params := capi.NewQueryParams().
			WithPerPage(1).
			WithFilter("app_guids", appGUID)
		raw, lerr := cfClient.Routes().List(ctx.Request().Context(), params)
		if lerr != nil {
			return lerr
		}
		return ctx.JSON(http.StatusOK, StAppRoutesResponse{
			Resources:    []StRoute{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	// Wire-contract passthrough: forward client per_page+page to a single
	// upstream /v3/routes?app_guids={appGuid} call. When the caller omits
	// per_page, V3 server defaults apply.
	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(
		capi.NewQueryParams().WithFilter("app_guids", appGUID),
		perPage, page, present,
	)
	raw, listErr := cfClient.Routes().List(ctx.Request().Context(), params)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}

	out := make([]StRoute, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		out = append(out, toStRoute(r, cnsiGUID))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StRoute]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// toStRoute maps a capi.Route onto a Stratos-shape StRoute DTO. cnsiGUID is
// stamped into the row so the frontend can key favorites + delete calls by
// (cnsi, route) without threading the endpoint through every closure — same
// convention as StApp/StOrg/StSpace.
//
// AppGUIDs is populated from CF v3's inline destinations field on the list
// endpoint — verified against /v3/routes (3.180.0) which returns destinations
// embedded in each route resource. The earlier per-route ListDestinations
// fan-out (populateRouteDestinations) was N+1 against CAPI for no reason;
// reading r.Destinations directly drops the fan-out entirely.
func toStRoute(r capi.Route, cnsiGUID string) StRoute {
	var appGUIDs []string
	if len(r.Destinations) > 0 {
		appGUIDs = make([]string, 0, len(r.Destinations))
		for _, d := range r.Destinations {
			if d.App.GUID != "" {
				appGUIDs = append(appGUIDs, d.App.GUID)
			}
		}
	}
	return StRoute{
		GUID:       r.GUID,
		URL:        r.URL,
		Host:       r.Host,
		Path:       r.Path,
		Port:       r.Port,
		DomainGUID: relationshipGUID(r.Relationships.Domain),
		SpaceGUID:  relationshipGUID(r.Relationships.Space),
		CnsiGUID:   cnsiGUID,
		AppGUIDs:   appGUIDs,
		CreatedAt:  r.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:  r.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

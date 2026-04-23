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
//   GET /v3/routes?app_guids={appGuid}
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

	// Drain every page. Apps rarely have many routes, but path-based routing
	// and multiple domains can push the count past one page.
	resources := make([]capi.Route, 0)
	page := 1
	for {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest).WithFilter("app_guids", appGUID)
		params.Page = page
		raw, listErr := cfClient.Routes().List(ctx.Request().Context(), params)
		if listErr != nil {
			return handleCapiError(ctx, listErr)
		}
		resources = append(resources, raw.Resources...)
		if raw.Pagination.Next == nil || raw.Pagination.Next.Href == "" {
			break
		}
		page++
	}

	out := make([]StRoute, 0, len(resources))
	for _, r := range resources {
		out = append(out, toStRoute(r))
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, StAppRoutesResponse{
		Resources:    out,
		TotalResults: len(out),
	})
}

// toStRoute maps a capi.Route onto a Stratos-shape StRoute DTO.
func toStRoute(r capi.Route) StRoute {
	return StRoute{
		GUID:       r.GUID,
		URL:        r.URL,
		Host:       r.Host,
		Path:       r.Path,
		Port:       r.Port,
		DomainGUID: relationshipGUID(r.Relationships.Domain),
		SpaceGUID:  relationshipGUID(r.Relationships.Space),
		CreatedAt:  r.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:  r.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

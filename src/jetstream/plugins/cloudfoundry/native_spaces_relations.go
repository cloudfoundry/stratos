// src/jetstream/plugins/cloudfoundry/native_spaces_relations.go
package cloudfoundry

import (
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// fetchAppCountsForSpaces issues one /v3/apps call filtered to the given
// space GUIDs, draining all pages, and tallies results per space_guid via
// each app's Relationships.Space.Data.GUID. Returns a map space_guid → app
// count. Spaces with zero apps are absent from the map (caller defaults to
// 0); callers should treat missing as zero. Mirrors fetchSpacesByGUIDs /
// fetchWebProcessesForApps in style and pagination shape.
func fetchAppCountsForSpaces(ctx echo.Context, cfClient capi.Client, spaceGUIDs []string) (map[string]int, error) {
	counts := make(map[string]int, len(spaceGUIDs))
	if len(spaceGUIDs) == 0 {
		return counts, nil
	}
	for page := 1; ; page++ {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		params.Filters["space_guids"] = spaceGUIDs

		raw, err := cfClient.Apps().List(ctx.Request().Context(), params)
		if err != nil {
			return nil, err
		}
		for _, a := range raw.Resources {
			sg := relationshipGUID(a.Relationships.Space)
			if sg != "" {
				counts[sg]++
			}
		}
		if raw.Pagination.Next == nil || page >= raw.Pagination.TotalPages {
			break
		}
	}
	return counts, nil
}

// fetchRouteCountsForSpaces issues one /v3/routes call filtered to the
// given space GUIDs, draining all pages, and tallies results per
// space_guid via each route's Relationships.Space. Returns a map
// space_guid → route count. Same lazy-non-fatal pattern as the apps
// counterpart.
func fetchRouteCountsForSpaces(ctx echo.Context, cfClient capi.Client, spaceGUIDs []string) (map[string]int, error) {
	counts := make(map[string]int, len(spaceGUIDs))
	if len(spaceGUIDs) == 0 {
		return counts, nil
	}
	for page := 1; ; page++ {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		params.Filters["space_guids"] = spaceGUIDs

		raw, err := cfClient.Routes().List(ctx.Request().Context(), params)
		if err != nil {
			return nil, err
		}
		for _, r := range raw.Resources {
			sg := relationshipGUID(r.Relationships.Space)
			if sg != "" {
				counts[sg]++
			}
		}
		if raw.Pagination.Next == nil || page >= raw.Pagination.TotalPages {
			break
		}
	}
	return counts, nil
}

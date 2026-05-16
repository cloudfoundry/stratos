// src/jetstream/plugins/cloudfoundry/native_orgs_relations.go
package cloudfoundry

import (
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// fetchSpaceCountsForOrgs issues one /v3/spaces call filtered to the given
// org GUIDs, draining all pages, and tallies results per organization_guid
// via each space's Relationships.Organization.Data.GUID. Returns a map
// org_guid → space count. Orgs with zero spaces are absent from the map
// (caller defaults to 0). Mirrors fetchAppCountsForSpaces in style and
// pagination shape.
func fetchSpaceCountsForOrgs(ctx echo.Context, cfClient capi.Client, orgGUIDs []string) (map[string]int, error) {
	counts := make(map[string]int, len(orgGUIDs))
	if len(orgGUIDs) == 0 {
		return counts, nil
	}
	for page := 1; ; page++ {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		params.Filters["organization_guids"] = orgGUIDs

		raw, err := cfClient.Spaces().List(ctx.Request().Context(), params)
		if err != nil {
			return nil, err
		}
		for _, s := range raw.Resources {
			og := relationshipGUID(s.Relationships.Organization)
			if og != "" {
				counts[og]++
			}
		}
		if raw.Pagination.Next == nil || page >= raw.Pagination.TotalPages {
			break
		}
	}
	return counts, nil
}

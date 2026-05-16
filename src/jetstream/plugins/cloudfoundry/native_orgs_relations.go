// src/jetstream/plugins/cloudfoundry/native_orgs_relations.go
package cloudfoundry

import (
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// fetchSpacesForOrgs drains /v3/spaces?organization_guids=<orgGUIDs> once
// and returns both a per-org space count and a space_guid → org_guid map
// for downstream callers (e.g. fetchAppCountsForOrgs) so the spaces drain
// isn't duplicated when both counts are needed. Mirrors the lazy-non-fatal
// pattern of fetchAppCountsForSpaces.
func fetchSpacesForOrgs(ctx echo.Context, cfClient capi.Client, orgGUIDs []string) (counts map[string]int, spaceToOrg map[string]string, err error) {
	counts = make(map[string]int, len(orgGUIDs))
	spaceToOrg = make(map[string]string)
	if len(orgGUIDs) == 0 {
		return counts, spaceToOrg, nil
	}
	for page := 1; ; page++ {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		params.Filters["organization_guids"] = orgGUIDs

		raw, lerr := cfClient.Spaces().List(ctx.Request().Context(), params)
		if lerr != nil {
			return nil, nil, lerr
		}
		for _, s := range raw.Resources {
			og := relationshipGUID(s.Relationships.Organization)
			if og != "" {
				counts[og]++
				spaceToOrg[s.GUID] = og
			}
		}
		if raw.Pagination.Next == nil || page >= raw.Pagination.TotalPages {
			break
		}
	}
	return counts, spaceToOrg, nil
}

// fetchAppCountsForOrgs drains /v3/apps?organization_guids=<orgGUIDs> and
// attributes each app back to its org via the supplied space → org map
// (V3 /v3/apps only carries the space relationship inline). Pass a
// spaceToOrg from fetchSpacesForOrgs to avoid duplicate /v3/spaces drains.
// Returns map org_guid → app count. Same lazy-non-fatal pattern as the
// spaces counterpart.
func fetchAppCountsForOrgs(ctx echo.Context, cfClient capi.Client, orgGUIDs []string, spaceToOrg map[string]string) (map[string]int, error) {
	counts := make(map[string]int, len(orgGUIDs))
	if len(orgGUIDs) == 0 {
		return counts, nil
	}
	for page := 1; ; page++ {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		params.Filters["organization_guids"] = orgGUIDs

		raw, err := cfClient.Apps().List(ctx.Request().Context(), params)
		if err != nil {
			return nil, err
		}
		for _, a := range raw.Resources {
			sg := relationshipGUID(a.Relationships.Space)
			if og, ok := spaceToOrg[sg]; ok && og != "" {
				counts[og]++
			}
		}
		if raw.Pagination.Next == nil || page >= raw.Pagination.TotalPages {
			break
		}
	}
	return counts, nil
}

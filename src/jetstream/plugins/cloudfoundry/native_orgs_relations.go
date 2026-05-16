// src/jetstream/plugins/cloudfoundry/native_orgs_relations.go
package cloudfoundry

import (
	"context"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
)

// fetchSpacesForOrgs drains /v3/spaces?organization_guids=<orgGUIDs> once
// and returns both a per-org space count and a space_guid → org_guid map
// for downstream callers (e.g. attributeAppsToOrgs) so the spaces drain
// isn't duplicated when both counts are needed. Mirrors the lazy-non-fatal
// pattern of fetchAppCountsForSpaces.
//
// Takes context.Context (not echo.Context) so callers can spawn this
// inside an errgroup goroutine — echo.Context is not safe for concurrent
// use, but the request's context.Context is.
func fetchSpacesForOrgs(ctx context.Context, cfClient capi.Client, orgGUIDs []string) (counts map[string]int, spaceToOrg map[string]string, err error) {
	counts = make(map[string]int, len(orgGUIDs))
	spaceToOrg = make(map[string]string)
	if len(orgGUIDs) == 0 {
		return counts, spaceToOrg, nil
	}
	for page := 1; ; page++ {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		params.Filters["organization_guids"] = orgGUIDs

		raw, lerr := cfClient.Spaces().List(ctx, params)
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

// drainAppsForOrgs drains /v3/apps?organization_guids=<orgGUIDs> and
// returns the raw apps. Attribution to orgs happens separately via
// attributeAppsToOrgs so the drain can run concurrently with the
// spaces drain (the attribution-time dependency on space→org doesn't
// gate the HTTP roundtrips). Takes context.Context for the same
// goroutine-safety reason as fetchSpacesForOrgs.
func drainAppsForOrgs(ctx context.Context, cfClient capi.Client, orgGUIDs []string) ([]capi.App, error) {
	if len(orgGUIDs) == 0 {
		return nil, nil
	}
	apps := make([]capi.App, 0)
	for page := 1; ; page++ {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		params.Filters["organization_guids"] = orgGUIDs

		raw, err := cfClient.Apps().List(ctx, params)
		if err != nil {
			return nil, err
		}
		apps = append(apps, raw.Resources...)
		if raw.Pagination.Next == nil || page >= raw.Pagination.TotalPages {
			break
		}
	}
	return apps, nil
}

// attributeAppsToOrgs walks the drained apps and counts per-org via the
// space→org map (V3 /v3/apps only carries the space relationship inline,
// not the org). Pure function — no I/O.
func attributeAppsToOrgs(apps []capi.App, spaceToOrg map[string]string) map[string]int {
	counts := make(map[string]int)
	for _, a := range apps {
		sg := relationshipGUID(a.Relationships.Space)
		if og, ok := spaceToOrg[sg]; ok && og != "" {
			counts[og]++
		}
	}
	return counts
}

// src/jetstream/plugins/cloudfoundry/native_current_user_roles_reads.go
package cloudfoundry

import (
	"net/http"
	"time"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// CfRelationBucketEntry is the legacy V2-envelope shape the cf-current-
// user-roles reducer reads. Org buckets only need metadata.guid; space
// buckets additionally read entity.organization_guid. Preserving the
// envelope means the reducer needs zero change.
type CfRelationBucketEntry struct {
	Metadata cfRelationMeta   `json:"metadata"`
	Entity   cfRelationEntity `json:"entity"`
}

type cfRelationMeta struct {
	GUID string `json:"guid"`
}

type cfRelationEntity struct {
	OrganizationGUID string `json:"organization_guid,omitempty"`
}

// CfCurrentUserRolesResponse is the wire shape returned by
// getNativeCurrentUserRoles. Buckets are keyed by the frontend
// CfUserRelationTypes string values: organizations, managed_organizations,
// billing_managed_organizations, audited_organizations, spaces,
// managed_spaces, audited_spaces. Every canonical key is always present;
// missing-grant buckets serialize as `[]` (not null) so the frontend
// can dispatch one GetCurrentCfUserRelationsComplete per key without
// nil-guards.
type CfCurrentUserRolesResponse struct {
	Buckets map[string][]CfRelationBucketEntry `json:"buckets"`
}

// roleTypeToBucket maps a CF v3 role .Type to the frontend bucket key.
// space_supporter is intentionally absent — the frontend enum doesn't
// carry it and the legacy 7-fetch flow never queries that relation.
var roleTypeToBucket = map[string]string{
	"organization_user":            "organizations",
	"organization_manager":         "managed_organizations",
	"organization_billing_manager": "billing_managed_organizations",
	"organization_auditor":         "audited_organizations",
	"space_developer":              "spaces",
	"space_manager":                "managed_spaces",
	"space_auditor":                "audited_spaces",
}

var orgBucketKeys = []string{
	"organizations",
	"managed_organizations",
	"billing_managed_organizations",
	"audited_organizations",
}

var spaceBucketKeys = []string{
	"spaces",
	"managed_spaces",
	"audited_spaces",
}

// getNativeCurrentUserRoles handles GET /pp/v1/cf/current-user-roles/:cnsiGuid.
//
// Replaces 7 sequential V2 proxy fetches (one per CfUserRelationTypes
// enum value, each hitting pp/v1/proxy/v2/users/{guid}/{relType}) with
// a single /v3/roles?user_guids={me} call. The frontend dispatches one
// GetCurrentCfUserRelationsComplete per bucket key off the response.
//
// CAPI calls per request:
//   - Common case (typical non-admin): 1 (single /v3/roles page)
//   - Admin (no explicit grants): 1 (returns 0 rows quickly)
//   - Heavy (admin with thousands of explicit grants): 2 wall-clock RTTs
//     (page 1 sequential, pages 2..N fanned out with maxConcurrency=6)
//   - Pathological (space role row missing org relationship): +1 paginated
//     /v3/spaces?guids= to recover space→org. Bounded by the missing-space
//     set; rare in practice since V3 role rows for spaces carry the org.
func (c *CloudFoundrySpecification) getNativeCurrentUserRoles(ctx echo.Context) (err error) {
	cnsiGUID := ctx.Param("cnsiGuid")
	rows := 0
	start := time.Now()
	defer logHandlerTiming("getNativeCurrentUserRoles", cnsiGUID, start, &err, &rows)

	sessionUser, uerr := c.getUserGUID(ctx)
	if uerr != nil {
		err = echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
		return err
	}
	cfUserGUID, gerr := c.getCFUserGUIDForEndpoint(ctx, cnsiGUID)
	if gerr != nil {
		err = gerr
		return err
	}
	cfClient, cerr := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, sessionUser)
	if cerr != nil {
		err = cerr
		return err
	}

	rStart := time.Now()
	roles, rerr := listRolesForUsers(ctx.Request().Context(), cfClient, []string{cfUserGUID})
	rRows := -1
	if rerr == nil {
		rRows = len(roles)
	}
	logCapiTiming("getNativeCurrentUserRoles.roles", -1, -1, -1, rStart, rerr, rRows, -1)
	if rerr != nil {
		err = echo.NewHTTPError(http.StatusBadGateway, rerr.Error())
		return err
	}

	buckets, missingSpaces := projectRolesToBuckets(roles)

	// Backfill space→org for any space role row that arrived without an
	// organization relationship. Bounded by the missing-space set; same
	// pattern as buildUserRoleBuckets. Logged separately so a production
	// trace can attribute slow requests to the fallback vs the main fetch.
	if len(missingSpaces) > 0 {
		sStart := time.Now()
		spaces, sErr := listSpacesByGUIDs(ctx.Request().Context(), cfClient, missingSpaces)
		sRows := -1
		if sErr == nil {
			sRows = len(spaces)
		}
		logCapiTiming("getNativeCurrentUserRoles.spaces_fallback", -1, -1, len(missingSpaces), sStart, sErr, sRows, -1)
		if sErr == nil {
			spaceOrg := make(map[string]string, len(spaces))
			for _, s := range spaces {
				spaceOrg[s.GUID] = relationshipGUID(s.Relationships.Organization)
			}
			for _, key := range spaceBucketKeys {
				for i := range buckets[key] {
					if buckets[key][i].Entity.OrganizationGUID == "" {
						buckets[key][i].Entity.OrganizationGUID = spaceOrg[buckets[key][i].Metadata.GUID]
					}
				}
			}
		}
	}

	for _, k := range bucketKeysAll() {
		rows += len(buckets[k])
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, CfCurrentUserRolesResponse{Buckets: buckets})
}

// bucketKeysAll returns the union of org and space bucket keys for
// rows-count summation in handler timing logs.
func bucketKeysAll() []string {
	all := make([]string, 0, len(orgBucketKeys)+len(spaceBucketKeys))
	all = append(all, orgBucketKeys...)
	all = append(all, spaceBucketKeys...)
	return all
}

// projectRolesToBuckets groups v3 role rows into the 7 per-relation
// buckets the frontend reducer expects. Returns the bucket map (every
// canonical key present, possibly empty) plus the unique space GUIDs
// whose role rows lacked an organization relationship — the caller
// backfills with listSpacesByGUIDs.
//
// Duplicates within a bucket are collapsed: if the same (user, org)
// receives e.g. organization_user twice (shouldn't happen but cheap to
// guard), only one entry lands in the bucket.
func projectRolesToBuckets(roles []capi.Role) (map[string][]CfRelationBucketEntry, []string) {
	buckets := make(map[string][]CfRelationBucketEntry, len(roleTypeToBucket))
	seenOrgs := make(map[string]map[string]struct{}, len(orgBucketKeys))
	seenSpaces := make(map[string]map[string]struct{}, len(spaceBucketKeys))
	for _, k := range orgBucketKeys {
		buckets[k] = []CfRelationBucketEntry{}
		seenOrgs[k] = map[string]struct{}{}
	}
	for _, k := range spaceBucketKeys {
		buckets[k] = []CfRelationBucketEntry{}
		seenSpaces[k] = map[string]struct{}{}
	}

	missingSpaceSet := map[string]struct{}{}

	for _, r := range roles {
		bucket, known := roleTypeToBucket[r.Type]
		if !known {
			continue
		}
		if _, isOrgBucket := seenOrgs[bucket]; isOrgBucket {
			orgGUID := ""
			if r.Relationships.Organization != nil {
				orgGUID = relationshipGUID(*r.Relationships.Organization)
			}
			if orgGUID == "" {
				continue
			}
			if _, dup := seenOrgs[bucket][orgGUID]; dup {
				continue
			}
			seenOrgs[bucket][orgGUID] = struct{}{}
			buckets[bucket] = append(buckets[bucket], CfRelationBucketEntry{
				Metadata: cfRelationMeta{GUID: orgGUID},
			})
			continue
		}
		// space_* bucket
		spaceGUID := ""
		if r.Relationships.Space != nil {
			spaceGUID = relationshipGUID(*r.Relationships.Space)
		}
		if spaceGUID == "" {
			continue
		}
		if _, dup := seenSpaces[bucket][spaceGUID]; dup {
			continue
		}
		seenSpaces[bucket][spaceGUID] = struct{}{}
		orgGUID := ""
		if r.Relationships.Organization != nil {
			orgGUID = relationshipGUID(*r.Relationships.Organization)
		}
		if orgGUID == "" {
			missingSpaceSet[spaceGUID] = struct{}{}
		}
		buckets[bucket] = append(buckets[bucket], CfRelationBucketEntry{
			Metadata: cfRelationMeta{GUID: spaceGUID},
			Entity:   cfRelationEntity{OrganizationGUID: orgGUID},
		})
	}

	missingSpaces := make([]string, 0, len(missingSpaceSet))
	for s := range missingSpaceSet {
		missingSpaces = append(missingSpaces, s)
	}
	return buckets, missingSpaces
}

// src/jetstream/plugins/cloudfoundry/native_users_reads.go
package cloudfoundry

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeUsers handles GET /pp/v1/cf/users/{cnsiGuid}.
//
// Single-page passthrough over /v3/users joined with bounded role
// grants for just the identities on that page. Caller's per_page/page
// forward verbatim to /v3/users; absent, V3 server defaults apply.
//
// CF v3 splits user identity from role grants:
//   - /v3/users — bare identity (guid, username, presentation_name, origin).
//   - /v3/roles — role grants, related to a user and to either an org
//     or a space.
//
// Role-join strategy (bounded, post-retrofit):
//   - Fetch roles only for the user GUIDs on the current /v3/users page
//     via /v3/roles?user_guids=<csv>. Page size ~50 users → ~5 roles
//     per user → ~250 roles, typically a single CAPI page; we paginate
//     defensively if not.
//   - For space roles whose organization relationship arrives unset
//     (rare but defensive), resolve space→org via /v3/spaces?guids=<csv>
//     scoped to just those space GUIDs.
//   - Soft-fail on the role drain: if /v3/roles errors, every user on
//     the page renders with empty role buckets rather than 502'ing the
//     whole page.
//
// V3 role-relationship contract: every space_* role carries both a
// space and an organization relationship (since spaces nest under
// orgs). The bucketing trusts the role's organization relationship
// when present and falls back to the bounded /v3/spaces lookup when
// it isn't.
func (c *CloudFoundrySpecification) getNativeUsers(ctx echo.Context) error {
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

	// ?return=counts fast path: per_page=1, totalResults only. No role
	// join — the count is just /v3/users totalResults.
	if ctx.QueryParam("return") == "counts" {
		params := capi.NewQueryParams().WithPerPage(1)
		raw, lerr := cfClient.Users().List(ctx.Request().Context(), params)
		if lerr != nil {
			return echo.NewHTTPError(http.StatusBadGateway, lerr.Error())
		}
		return ctx.JSON(http.StatusOK, StUsersResponse{
			Resources:    []StUser{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present)
	raw, listErr := cfClient.Users().List(ctx.Request().Context(), params)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}

	pageUserGUIDs := make([]string, 0, len(raw.Resources))
	for _, u := range raw.Resources {
		pageUserGUIDs = append(pageUserGUIDs, u.GUID)
	}

	orgRolesByUser, spaceRolesByUser := buildUserRoleBuckets(ctx.Request().Context(), cfClient, pageUserGUIDs)

	out := make([]StUser, 0, len(raw.Resources))
	for _, u := range raw.Resources {
		out = append(out, toStUser(u, cnsiGUID, orgRolesByUser[u.GUID], spaceRolesByUser[u.GUID]))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StUser]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// buildUserRoleBuckets fetches roles for the supplied user GUIDs and
// returns per-user org/space role buckets. Soft-fails on /v3/roles
// errors — returns empty maps so the caller emits empty role arrays
// rather than failing the page.
func buildUserRoleBuckets(
	ctx context.Context,
	cfClient capi.Client,
	userGUIDs []string,
) (map[string][]StUserOrgRole, map[string][]StUserSpaceRole) {
	orgRolesByUser := make(map[string][]StUserOrgRole)
	spaceRolesByUser := make(map[string][]StUserSpaceRole)

	if len(userGUIDs) == 0 {
		return orgRolesByUser, spaceRolesByUser
	}

	roles, rolesErr := listRolesForUsers(ctx, cfClient, userGUIDs)
	if rolesErr != nil {
		return orgRolesByUser, spaceRolesByUser
	}

	// userGUID → orgGUID → []role-name; collapse multiple grants on the
	// same (user, org) into one bucket entry with role names joined.
	orgScopeAcc := make(map[string]map[string][]string)
	spaceScopeAcc := make(map[string]map[string][]string)
	spaceOrgFromRole := make(map[string]string) // spaceGUID → orgGUID, when role carries it

	for _, r := range roles {
		uGUID := relationshipGUID(r.Relationships.User)
		if uGUID == "" {
			continue
		}
		orgGUID := ""
		if r.Relationships.Organization != nil {
			orgGUID = relationshipGUID(*r.Relationships.Organization)
		}
		spaceGUID := ""
		if r.Relationships.Space != nil {
			spaceGUID = relationshipGUID(*r.Relationships.Space)
		}

		switch {
		case spaceGUID != "":
			if orgGUID != "" {
				spaceOrgFromRole[spaceGUID] = orgGUID
			}
			if spaceScopeAcc[uGUID] == nil {
				spaceScopeAcc[uGUID] = make(map[string][]string)
			}
			spaceScopeAcc[uGUID][spaceGUID] = append(
				spaceScopeAcc[uGUID][spaceGUID],
				stripRolePrefix(r.Type),
			)
		case orgGUID != "":
			if orgScopeAcc[uGUID] == nil {
				orgScopeAcc[uGUID] = make(map[string][]string)
			}
			orgScopeAcc[uGUID][orgGUID] = append(
				orgScopeAcc[uGUID][orgGUID],
				stripRolePrefix(r.Type),
			)
		}
	}

	// Fall back to a bounded /v3/spaces lookup for any space role that
	// arrived without an organization relationship attached. Bounded by
	// the actual unresolved space GUIDs — never a foundation-wide drain.
	missingSpaces := make([]string, 0)
	for _, byUser := range spaceScopeAcc {
		for spaceGUID := range byUser {
			if _, ok := spaceOrgFromRole[spaceGUID]; !ok {
				missingSpaces = append(missingSpaces, spaceGUID)
			}
		}
	}
	spaceOrgFallback := make(map[string]string)
	if len(missingSpaces) > 0 {
		if spaces, sErr := listSpacesByGUIDs(ctx, cfClient, missingSpaces); sErr == nil {
			for _, s := range spaces {
				spaceOrgFallback[s.GUID] = relationshipGUID(s.Relationships.Organization)
			}
		}
	}

	for uGUID, byOrg := range orgScopeAcc {
		for orgGUID, rolesList := range byOrg {
			orgRolesByUser[uGUID] = append(orgRolesByUser[uGUID], StUserOrgRole{
				OrgGuid: orgGUID,
				Roles:   rolesList,
			})
		}
	}
	for uGUID, bySpace := range spaceScopeAcc {
		for spaceGUID, rolesList := range bySpace {
			orgGUID := spaceOrgFromRole[spaceGUID]
			if orgGUID == "" {
				orgGUID = spaceOrgFallback[spaceGUID]
			}
			spaceRolesByUser[uGUID] = append(spaceRolesByUser[uGUID], StUserSpaceRole{
				OrgGuid:   orgGUID,
				SpaceGuid: spaceGUID,
				Roles:     rolesList,
			})
		}
	}

	return orgRolesByUser, spaceRolesByUser
}

// listRolesForUsers fetches /v3/roles?user_guids=<csv> for the given
// user GUIDs. Bounded by the input set: at typical page size (~50 users
// × ~5 roles each = ~250 roles) this is a single CAPI page; admin-class
// users with thousands of grants paginate.
//
// Pagination strategy: fetch page 1 to learn total_pages, then fan out
// pages 2..N concurrently with bounded parallelism. Sequential drain on
// admin (5K+ grants over ~11 pages) dominated wall time at ~8s; parallel
// fan-out collapses that to ~max(page latency).
func listRolesForUsers(ctx context.Context, cfClient capi.Client, userGUIDs []string) ([]capi.Role, error) {
	if len(userGUIDs) == 0 {
		return nil, nil
	}

	const perPage = 500
	const maxConcurrency = 6

	filter := strings.Join(userGUIDs, ",")
	fetchPage := func(page int) ([]capi.Role, capi.Pagination, error) {
		params := capi.NewQueryParams().
			WithFilter("user_guids", filter).
			WithPerPage(perPage)
		params.Page = page
		raw, err := cfClient.Roles().List(ctx, params)
		if err != nil {
			return nil, capi.Pagination{}, err
		}
		return raw.Resources, raw.Pagination, nil
	}

	firstResources, pagination, err := fetchPage(1)
	if err != nil {
		return nil, err
	}
	totalPages := pagination.TotalPages
	if totalPages <= 1 {
		return firstResources, nil
	}

	pageRoles := make([][]capi.Role, totalPages)
	pageRoles[0] = firstResources

	type pageResult struct {
		page  int
		roles []capi.Role
		err   error
	}
	sem := make(chan struct{}, maxConcurrency)
	results := make(chan pageResult, totalPages-1)
	for p := 2; p <= totalPages; p++ {
		sem <- struct{}{}
		go func(pn int) {
			defer func() { <-sem }()
			res, _, perr := fetchPage(pn)
			results <- pageResult{page: pn, roles: res, err: perr}
		}(p)
	}
	for i := 0; i < totalPages-1; i++ {
		r := <-results
		if r.err != nil {
			return nil, r.err
		}
		pageRoles[r.page-1] = r.roles
	}

	totalLen := 0
	for _, p := range pageRoles {
		totalLen += len(p)
	}
	all := make([]capi.Role, 0, totalLen)
	for _, p := range pageRoles {
		all = append(all, p...)
	}
	return all, nil
}

// listSpacesByGUIDs fetches /v3/spaces?guids=<csv>. Bounded fallback for
// resolving space → org when a role's own organization relationship is
// missing — never a foundation-wide drain.
func listSpacesByGUIDs(ctx context.Context, cfClient capi.Client, spaceGUIDs []string) ([]capi.Space, error) {
	all := make([]capi.Space, 0)
	pageNum := 1
	for {
		params := capi.NewQueryParams().
			WithFilter("guids", strings.Join(spaceGUIDs, ",")).
			WithPerPage(500)
		params.Page = pageNum
		raw, err := cfClient.Spaces().List(ctx, params)
		if err != nil {
			return nil, err
		}
		all = append(all, raw.Resources...)
		if raw.Pagination.Next == nil || raw.Pagination.Next.Href == "" {
			break
		}
		pageNum++
	}
	return all, nil
}

// stripRolePrefix converts V3 role types (organization_manager,
// space_developer, etc.) to the short names the StUser DTO emits.
func stripRolePrefix(roleType string) string {
	switch {
	case strings.HasPrefix(roleType, "organization_"):
		return strings.TrimPrefix(roleType, "organization_")
	case strings.HasPrefix(roleType, "space_"):
		return strings.TrimPrefix(roleType, "space_")
	default:
		return roleType
	}
}

// toStUser maps a capi.User onto the Stratos-shape DTO. cnsiGUID is
// stamped onto the row so multi-CNSI rows + favorites/links can be keyed
// by (cnsi, user) without threading the endpoint through every closure.
//
// Role buckets default to non-nil empty slices so the JSON payload always
// emits `[]` rather than `null` and the frontend can `.length` / `.map`
// without a guard.
func toStUser(
	u capi.User,
	cnsiGUID string,
	orgRoles []StUserOrgRole,
	spaceRoles []StUserSpaceRole,
) StUser {
	if orgRoles == nil {
		orgRoles = []StUserOrgRole{}
	}
	if spaceRoles == nil {
		spaceRoles = []StUserSpaceRole{}
	}

	updatedAt := ""
	if !u.UpdatedAt.IsZero() {
		updatedAt = u.UpdatedAt.Format(time.RFC3339)
	}
	createdAt := ""
	if !u.CreatedAt.IsZero() {
		createdAt = u.CreatedAt.Format(time.RFC3339)
	}

	return StUser{
		Guid:             u.GUID,
		Username:         u.Username,
		PresentationName: u.PresentationName,
		Origin:           u.Origin,
		CnsiGuid:         cnsiGUID,
		OrgRoles:         orgRoles,
		SpaceRoles:       spaceRoles,
		CreatedAt:        createdAt,
		UpdatedAt:        updatedAt,
	}
}

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
// Returns every user visible to the caller — joined with their org and
// space role grants — across the foundation. Drives the Stratos CF-level
// users page and the per-space users tab (which filters client-side on
// the user's spaceRoles[].spaceGuid).
//
// CF v3 splits user identity from role grants:
//   - /v3/users — bare user identity (guid, username, presentation_name, origin).
//   - /v3/roles — role grants, each carrying a relationship to the user and
//     to either the organization or the space the role is scoped against.
//
// Strategy: drain both endpoints once, bucket roles by user.guid, and emit
// one StUser per identity with org/space role buckets attached. Two-step
// join — same shape the service-instance handler uses for plan→offering —
// keeps the per-row cost flat.
//
// Two response shapes, dispatched on ?return=
//   - summary: Stratos-shape paged response (StratosPagedResponse[StUser]).
//     Used by CnsiUsersSource via the CnsiEntitySource base class, which
//     pages until pagination.next is nil — we drain CAPI server-side and
//     synthesise a single fully-populated page. Same shape as the
//     service-offerings / service-instances handlers.
//   - (none): flat StUsersResponse with totalResults only. Reserved for
//     direct callers that don't need pagination meta.
//
// Soft-fail policy on the role drain: if /v3/roles errors, the handler
// still returns 200 with users carrying empty org/space role buckets
// rather than 502'ing the whole page. The role list is the larger of the
// two requests at scale; a transient CAPI hiccup shouldn't block the
// users page.
//
// V3 role-relationship contract: every space_* role carries both a space
// and an organization relationship (since spaces nest under orgs). The
// bucketing logic below trusts the role's organization relationship when
// present and falls back to looking up the space's parent org via the
// /v3/spaces drain — for callers that want to render "<org>/<space>:
// roles" without a second join.
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

	users, err := listAllUsers(ctx.Request().Context(), cfClient)
	if err != nil {
		return handleCapiError(ctx, err)
	}

	// Bucket roles by user. Soft-fail: if the role drain errors, every
	// user renders with empty role buckets rather than the page failing.
	orgRolesByUser := make(map[string][]StUserOrgRole)
	spaceRolesByUser := make(map[string][]StUserSpaceRole)
	if roles, rolesErr := listAllRoles(ctx.Request().Context(), cfClient); rolesErr == nil {
		// Pre-bucket per-user/per-scope so multiple grants on the same
		// (user, org) or (user, space) collapse to a single bucket entry
		// with all role names joined into the Roles slice.
		orgScopeAcc := make(map[string]map[string][]string)   // userGUID → orgGUID → []role
		spaceScopeAcc := make(map[string]map[string][]string) // userGUID → spaceGUID → []role
		// Keep the role's space → org mapping when carried directly on
		// the role; only fall back to the space drain if the relationship
		// is missing (shouldn't happen on V3 but treat defensively).
		spaceOrgFromRole := make(map[string]string) // spaceGUID → orgGUID

		for _, r := range roles {
			userGUID := relationshipGUID(r.Relationships.User)
			if userGUID == "" {
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
				if spaceScopeAcc[userGUID] == nil {
					spaceScopeAcc[userGUID] = make(map[string][]string)
				}
				spaceScopeAcc[userGUID][spaceGUID] = append(
					spaceScopeAcc[userGUID][spaceGUID],
					stripRolePrefix(r.Type),
				)
			case orgGUID != "":
				if orgScopeAcc[userGUID] == nil {
					orgScopeAcc[userGUID] = make(map[string][]string)
				}
				orgScopeAcc[userGUID][orgGUID] = append(
					orgScopeAcc[userGUID][orgGUID],
					stripRolePrefix(r.Type),
				)
			}
		}

		// Fall back to a /v3/spaces drain for any space role that didn't
		// come back with an organization relationship attached. Cheap at
		// CF scale and only fires when the role list is missing data.
		spaceOrgFallback := make(map[string]string)
		needFallback := false
		for _, byUser := range spaceScopeAcc {
			for spaceGUID := range byUser {
				if _, ok := spaceOrgFromRole[spaceGUID]; !ok {
					needFallback = true
					break
				}
			}
			if needFallback {
				break
			}
		}
		if needFallback {
			if spaces, sErr := listAllSpacesForUsers(ctx.Request().Context(), cfClient); sErr == nil {
				for _, s := range spaces {
					spaceOrgFallback[s.GUID] = relationshipGUID(s.Relationships.Organization)
				}
			}
		}

		// Materialise the buckets.
		for userGUID, byOrg := range orgScopeAcc {
			for orgGUID, rolesList := range byOrg {
				orgRolesByUser[userGUID] = append(orgRolesByUser[userGUID], StUserOrgRole{
					OrgGuid: orgGUID,
					Roles:   rolesList,
				})
			}
		}
		for userGUID, bySpace := range spaceScopeAcc {
			for spaceGUID, rolesList := range bySpace {
				orgGUID := spaceOrgFromRole[spaceGUID]
				if orgGUID == "" {
					orgGUID = spaceOrgFallback[spaceGUID]
				}
				spaceRolesByUser[userGUID] = append(spaceRolesByUser[userGUID], StUserSpaceRole{
					OrgGuid:   orgGUID,
					SpaceGuid: spaceGUID,
					Roles:     rolesList,
				})
			}
		}
	}

	out := make([]StUser, 0, len(users))
	for _, u := range users {
		out = append(out, toStUser(u, cnsiGUID, orgRolesByUser[u.GUID], spaceRolesByUser[u.GUID]))
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	if ctx.QueryParam("return") == "summary" {
		// Single-page Stratos paged response. CnsiEntitySource pages until
		// pagination.next is nil; emitting one fully-drained page = one
		// frontend iteration = done.
		response := StratosPagedResponse[StUser]{
			Resources:  out,
			Pagination: BuildPaginationMeta(ctx, 1, len(out), len(out)),
		}
		return ctx.JSON(http.StatusOK, response)
	}

	return ctx.JSON(http.StatusOK, StUsersResponse{
		Resources:    out,
		TotalResults: len(out),
	})
}

// listAllUsers drains /v3/users and returns every identity. Sequential
// pagination — user lists are small enough at CF scale that parallel
// fetches aren't worth the complexity. Mirrors the service-offerings drain.
func listAllUsers(ctx context.Context, cfClient capi.Client) ([]capi.User, error) {
	all := make([]capi.User, 0)
	page := 1
	for {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		raw, err := cfClient.Users().List(ctx, params)
		if err != nil {
			return nil, err
		}
		all = append(all, raw.Resources...)
		if raw.Pagination.Next == nil || raw.Pagination.Next.Href == "" {
			break
		}
		page++
	}
	return all, nil
}

// listAllRoles drains /v3/roles and returns every role grant. Larger
// drain than users — typically ~5x the row count since a single user
// holds multiple roles — but still small at typical CF scale. Sequential
// pagination keeps the code simple.
func listAllRoles(ctx context.Context, cfClient capi.Client) ([]capi.Role, error) {
	all := make([]capi.Role, 0)
	page := 1
	for {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		raw, err := cfClient.Roles().List(ctx, params)
		if err != nil {
			return nil, err
		}
		all = append(all, raw.Resources...)
		if raw.Pagination.Next == nil || raw.Pagination.Next.Href == "" {
			break
		}
		page++
	}
	return all, nil
}

// listAllSpacesForUsers is the fallback for resolving space → org when
// the role's own organization relationship is missing. Named distinctly
// so it doesn't collide with the spaces handler's own drain. Sequential.
func listAllSpacesForUsers(ctx context.Context, cfClient capi.Client) ([]capi.Space, error) {
	all := make([]capi.Space, 0)
	page := 1
	for {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		raw, err := cfClient.Spaces().List(ctx, params)
		if err != nil {
			return nil, err
		}
		all = append(all, raw.Resources...)
		if raw.Pagination.Next == nil || raw.Pagination.Next.Href == "" {
			break
		}
		page++
	}
	return all, nil
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

// stripRolePrefix turns CF V3 role enums into compact UI-friendly tokens.
// "organization_manager" → "manager"; "space_developer" → "developer";
// "organization_billing_manager" → "billing_manager"; "space_supporter" →
// "supporter". The bucketing structure already disambiguates org-vs-space
// scope, so the prefix is redundant in cell text — and "manager, auditor"
// reads more naturally than "organization_manager, organization_auditor".
//
// Falls through unchanged for any role enum we haven't seen — defensive
// against new V3 role types showing up in the wild.
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

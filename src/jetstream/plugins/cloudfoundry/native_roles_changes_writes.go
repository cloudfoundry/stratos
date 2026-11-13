// src/jetstream/plugins/cloudfoundry/native_roles_changes_writes.go
package cloudfoundry

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v5"
)

// nativeRoleChange is one role assignment delta for a single (user, scope).
// Scope is exactly one of orgGuid / spaceGuid. add=true creates the role;
// add=false removes it (the handler resolves the role GUID first).
type nativeRoleChange struct {
	UserGUID string `json:"userGuid,omitempty"`
	// Username/Origin identify the user by name instead of GUID — the
	// set-roles-by-username path. On add the user is created (CF auto-creates
	// the record); on remove the GUID is resolved via a username lookup.
	Username  string `json:"username,omitempty"`
	Origin    string `json:"origin,omitempty"`
	OrgGUID   string `json:"orgGuid,omitempty"`
	SpaceGUID string `json:"spaceGuid,omitempty"`
	Type      string `json:"type"`
	Add       bool   `json:"add"`
}

type nativeRoleChangesRequest struct {
	Changes []nativeRoleChange `json:"changes"`
}

type nativeRoleChangeResult struct {
	Index   int        `json:"index"`
	Action  string     `json:"action"`
	Success bool       `json:"success"`
	Role    *capi.Role `json:"role,omitempty"`
	JobID   string     `json:"jobId,omitempty"`
	State   string     `json:"state,omitempty"`
	Error   string     `json:"error,omitempty"`
}

// applyNativeRoleChanges handles POST /pp/v1/cf/roles/{cnsiGuid}/changes —
// the batch role-change endpoint backing the signal-native Manage Roles +
// Remove User wizards. It replaces the legacy ngrx executeUsersRolesChange$
// effect: per change it either creates a role (add) or resolves the role
// GUID via a filtered list then deletes it (remove). Changes may span
// multiple users (the multi-user / bulk path).
func (cf *CloudFoundrySpecification) applyNativeRoleChanges(c *echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	var reqBody nativeRoleChangesRequest
	if err := json.NewDecoder(c.Request().Body).Decode(&reqBody); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid body: %v", err))
	}
	if len(reqBody.Changes) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "changes is required")
	}

	userGUID, err := cf.getUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	reqCtx := c.Request().Context()
	cfClient, err := newCapiClient(reqCtx, cf.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	// CF refuses to delete an org User role while the user still holds a
	// space role in that org, and it deletes roles in background jobs. When
	// the batch removes an org User, the deletes ordered before it wait for
	// their jobs to finish rather than the usual fast-path window.
	deleteWait := stratosjobs.FastPathOptions{Kind: "cf.role.delete"}
	if removesOrgUser(reqBody.Changes) {
		deleteWait.Window = orgUserRemovalWait
	}

	results := make([]nativeRoleChangeResult, 0, len(reqBody.Changes))
	for _, i := range orderRoleChanges(reqBody.Changes) {
		ch := reqBody.Changes[i]

		// Set-roles-by-username. Adds go to CF as {username, origin} and CF
		// resolves the user itself: GET /v3/users only shows an org manager
		// the users already in their orgs, so resolving here first failed
		// with "user not found" for anyone from another origin (#5883).
		// Removes still resolve the GUID, because a role is deleted by GUID
		// and the user is by then a member the caller can list.
		if ch.Username != "" && !ch.Add {
			var resolveErr error
			ch.UserGUID, resolveErr = findUserGUID(reqCtx, cfClient, ch.Username, ch.Origin)
			if resolveErr != nil {
				results = append(results, nativeRoleChangeResult{Index: i, Action: "remove", Error: resolveErr.Error()})
				continue
			}
		}

		if ch.Add {
			role, addErr := cfClient.Roles().Create(reqCtx, roleCreateRequestFor(ch))
			if addErr != nil && roleAlreadyHeld(reqCtx, cfClient, ch, addErr) {
				addErr = nil
			}
			res := nativeRoleChangeResult{Index: i, Action: "add", Success: addErr == nil, Role: role}
			if addErr != nil {
				res.Error = addErr.Error()
			}
			results = append(results, res)
			continue
		}

		res := nativeRoleChangeResult{Index: i, Action: "remove"}
		roleGUID, resolveErr := resolveRoleGUID(reqCtx, cfClient, ch)
		if resolveErr != nil {
			res.Error = resolveErr.Error()
			results = append(results, res)
			continue
		}
		job, delErr := cfClient.Roles().Delete(reqCtx, roleGUID)
		if delErr != nil {
			res.Error = delErr.Error()
			results = append(results, res)
			continue
		}
		res.Success = true
		if job != nil {
			res.JobID = job.GUID
		}
		// Register the delete job with the async tracker (when wired) so the
		// frontend can poll /pp/v1/stratos/jobs/{id}. Mirrors deleteNativeRole.
		if cf.asyncTracker != nil && cf.asyncTranslator != nil && job != nil && job.GUID != "" {
			ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
			fp := stratosjobs.RunFastPath(reqCtx, cf.asyncTracker, cf.asyncTranslator, ref, deleteWait)
			res.State = string(fp.State)
			if fp.State == stratosjobs.JobStateFailed {
				res.Success = false
				res.Error = fmt.Sprintf("%v", fp.Errors)
			}
		}
		results = append(results, res)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return c.JSON(http.StatusOK, map[string]interface{}{"results": results})
}

// orgUserRoleType is the V3 role type granting bare org membership. CF
// requires it to exist before any space role is assigned to the user.
const orgUserRoleType = "organization_user"

// orgUserRemovalWait bounds how long a role delete waits for its CF job when
// an org User removal follows it in the same batch.
const orgUserRemovalWait = 30 * time.Second

func isOrgUserChange(ch nativeRoleChange) bool {
	return ch.OrgGUID != "" && ch.SpaceGUID == "" && ch.Type == orgUserRoleType
}

func removesOrgUser(changes []nativeRoleChange) bool {
	for _, ch := range changes {
		if isOrgUserChange(ch) && !ch.Add {
			return true
		}
	}
	return false
}

// orderRoleChanges returns indices into changes in execution order. The
// org-user (membership) role must be created before other roles and removed
// after them, mirroring the legacy executeUsersRolesChange$ ordering — CF
// rejects a space role for a non-member, and removing membership first would
// orphan the remaining space roles.
func orderRoleChanges(changes []nativeRoleChange) []int {
	orgUser := make([]int, 0, len(changes))
	other := make([]int, 0, len(changes))
	for i, ch := range changes {
		if isOrgUserChange(ch) {
			orgUser = append(orgUser, i)
		} else {
			other = append(other, i)
		}
	}
	if len(orgUser) == 0 {
		return other
	}
	order := make([]int, 0, len(changes))
	if changes[orgUser[0]].Add {
		order = append(order, orgUser...)
		order = append(order, other...)
	} else {
		order = append(order, other...)
		order = append(order, orgUser...)
	}
	return order
}

// roleCreateRequestFor builds a V3 RoleCreateRequest from a change. Space
// scope wins if both are set (callers send exactly one).
func roleCreateRequestFor(ch nativeRoleChange) *capi.RoleCreateRequest {
	user := &capi.RelationshipData{GUID: ch.UserGUID}
	if ch.Username != "" {
		user = &capi.RelationshipData{Username: ch.Username, Origin: ch.Origin}
	}
	req := &capi.RoleCreateRequest{
		Type: ch.Type,
		Relationships: capi.RoleRelationships{
			User: capi.Relationship{Data: user},
		},
	}
	if ch.SpaceGUID != "" {
		req.Relationships.Space = &capi.Relationship{Data: &capi.RelationshipData{GUID: ch.SpaceGUID}}
	} else if ch.OrgGUID != "" {
		req.Relationships.Organization = &capi.Relationship{Data: &capi.RelationshipData{GUID: ch.OrgGUID}}
	}
	return req
}

// findUserGUID resolves an existing user's GUID via a filtered V3 users list.
func findUserGUID(ctx context.Context, cfClient capi.Client, username, origin string) (string, error) {
	params := capi.NewQueryParams().
		WithFilter("usernames", username).
		WithPerPage(1)
	if origin != "" {
		params = params.WithFilter("origins", origin)
	}
	list, err := cfClient.Users().List(ctx, params)
	if err != nil {
		return "", err
	}
	if list == nil || len(list.Resources) == 0 {
		return "", fmt.Errorf("%w: %s", errUserNotFound, username)
	}
	return list.Resources[0].GUID, nil
}

// roleAlreadyHeld reports whether a refused add asked for a role the user
// already holds. CF answers that with the generic unprocessable-entity code,
// so the role is looked up rather than the message read. A space role
// brings the org User role with it, and the Add User dialog cannot tell
// whether the user is already a member, so this case is routine.
func roleAlreadyHeld(ctx context.Context, cfClient capi.Client, ch nativeRoleChange, addErr error) bool {
	var respErr *capi.ResponseError
	if !errors.As(addErr, &respErr) || respErr.FirstError() == nil ||
		respErr.FirstError().Code != capi.ErrorCodeUnprocessableEntity {
		return false
	}
	if ch.Username != "" {
		guid, err := findUserGUID(ctx, cfClient, ch.Username, ch.Origin)
		if err != nil {
			return false
		}
		ch.UserGUID = guid
	}
	_, err := resolveRoleGUID(ctx, cfClient, ch)
	return err == nil
}

// errUserNotFound is findUserGUID's answer when the lookup succeeded but
// listed no user, as opposed to a failed CF call.
var errUserNotFound = errors.New("user not found")

// resolveRoleGUID finds the GUID of an existing role for a (user, scope, type)
// tuple via a filtered V3 roles list. CF v3 deletes roles by GUID, but the
// wizard identifies a role by org/space + type + user, so removal needs this
// resolution step.
func resolveRoleGUID(ctx context.Context, cfClient capi.Client, ch nativeRoleChange) (string, error) {
	params := capi.NewQueryParams().
		WithFilter("user_guids", ch.UserGUID).
		WithFilter("types", ch.Type).
		WithPerPage(1)
	if ch.SpaceGUID != "" {
		params = params.WithFilter("space_guids", ch.SpaceGUID)
	} else if ch.OrgGUID != "" {
		params = params.WithFilter("organization_guids", ch.OrgGUID)
	}
	list, err := cfClient.Roles().List(ctx, params)
	if err != nil {
		return "", err
	}
	if list == nil || len(list.Resources) == 0 {
		return "", fmt.Errorf("role not found for user %s type %s", ch.UserGUID, ch.Type)
	}
	return list.Resources[0].GUID, nil
}

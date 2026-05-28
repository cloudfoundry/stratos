// src/jetstream/plugins/cloudfoundry/native_roles_changes_writes.go
package cloudfoundry

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// nativeRoleChange is one role assignment delta for a single (user, scope).
// Scope is exactly one of orgGuid / spaceGuid. add=true creates the role;
// add=false removes it (the handler resolves the role GUID first).
type nativeRoleChange struct {
	UserGUID  string `json:"userGuid"`
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
func (cf *CloudFoundrySpecification) applyNativeRoleChanges(c echo.Context) error {
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

	results := make([]nativeRoleChangeResult, 0, len(reqBody.Changes))
	for _, i := range orderRoleChanges(reqBody.Changes) {
		ch := reqBody.Changes[i]
		if ch.Add {
			role, addErr := cfClient.Roles().Create(reqCtx, roleCreateRequestFor(ch))
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
			fp := stratosjobs.RunFastPath(reqCtx, cf.asyncTracker, cf.asyncTranslator, ref, stratosjobs.FastPathOptions{
				Kind: "cf.role.delete",
			})
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

// orderRoleChanges returns indices into changes in execution order. The
// org-user (membership) role must be created before other roles and removed
// after them, mirroring the legacy executeUsersRolesChange$ ordering — CF
// rejects a space role for a non-member, and removing membership first would
// orphan the remaining space roles.
func orderRoleChanges(changes []nativeRoleChange) []int {
	orgUser := make([]int, 0, len(changes))
	other := make([]int, 0, len(changes))
	for i, ch := range changes {
		if ch.OrgGUID != "" && ch.SpaceGUID == "" && ch.Type == orgUserRoleType {
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
	req := &capi.RoleCreateRequest{
		Type: ch.Type,
		Relationships: capi.RoleRelationships{
			User: capi.Relationship{Data: &capi.RelationshipData{GUID: ch.UserGUID}},
		},
	}
	if ch.SpaceGUID != "" {
		req.Relationships.Space = &capi.Relationship{Data: &capi.RelationshipData{GUID: ch.SpaceGUID}}
	} else if ch.OrgGUID != "" {
		req.Relationships.Organization = &capi.Relationship{Data: &capi.RelationshipData{GUID: ch.OrgGUID}}
	}
	return req
}

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

// src/jetstream/plugins/cloudfoundry/native_roles_changes_writes_test.go
package cloudfoundry

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// applyNativeRoleChanges is the batch role-change handler backing the
// signal-native Manage Roles + Remove User wizards. It accepts a set of
// role changes spanning one or more users and, per change, either creates
// a role (add) or resolves the role GUID via a filtered list then deletes
// it (remove). This replaces the legacy ngrx executeUsersRolesChange$
// effect's per-change entity-action orchestration.

func TestApplyNativeRoleChanges_AddCreatesRole(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"POST /v3/roles": func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "role-1",
				"type": "organization_manager",
			})
		},
	})
	defer ts.Close()

	body := `{"changes":[{"userGuid":"user-1","orgGuid":"org-1","type":"organization_manager","add":true}]}`
	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPost, "/pp/v1/cf/roles/cnsi-1/changes", body)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).applyNativeRoleChanges(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "/v3/roles", ts.lastPath)
	assert.Equal(t, http.MethodPost, ts.lastMethod)

	var sent map[string]interface{}
	require.NoError(t, json.Unmarshal([]byte(ts.lastBody), &sent))
	assert.Equal(t, "organization_manager", sent["type"])
}

func TestApplyNativeRoleChanges_RemoveResolvesGuidThenDeletes(t *testing.T) {
	var listQuery string
	ts := newCaptureServer(map[string]capiHandler{
		"GET /v3/roles": func(w http.ResponseWriter, r *http.Request) {
			listQuery = r.URL.RawQuery
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_pages": 1},
				"resources": []map[string]interface{}{
					{"guid": "role-9", "type": "organization_manager"},
				},
			})
		},
		"DELETE /v3/roles/role-9": func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Location", "/v3/jobs/job-1")
			w.WriteHeader(http.StatusAccepted)
		},
	})
	defer ts.Close()

	body := `{"changes":[{"userGuid":"user-1","orgGuid":"org-1","type":"organization_manager","add":false}]}`
	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPost, "/pp/v1/cf/roles/cnsi-1/changes", body)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).applyNativeRoleChanges(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "/v3/roles/role-9", ts.lastPath)
	assert.Equal(t, http.MethodDelete, ts.lastMethod)
	assert.Contains(t, listQuery, "user_guids=user-1")
	assert.Contains(t, listQuery, "organization_guids=org-1")
	assert.Contains(t, listQuery, "types=organization_manager")

	var resp struct {
		Results []struct {
			Action  string `json:"action"`
			Success bool   `json:"success"`
			JobID   string `json:"jobId"`
		} `json:"results"`
	}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Results, 1)
	assert.Equal(t, "remove", resp.Results[0].Action)
	assert.True(t, resp.Results[0].Success)
	assert.Equal(t, "job-1", resp.Results[0].JobID)
}

// CF rejects a space-role assignment for a user who is not yet an org member,
// so the org-user role must be created before other roles. The handler must
// reorder regardless of the order the changes arrive in.
func TestApplyNativeRoleChanges_OrgUserAddedBeforeOtherRoles(t *testing.T) {
	var order []string
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/v3" {
			_, _ = w.Write([]byte(`{"links":{}}`))
			return
		}
		if r.Method == http.MethodPost && r.URL.Path == "/v3/roles" {
			b, _ := io.ReadAll(r.Body)
			var sent map[string]interface{}
			_ = json.Unmarshal(b, &sent)
			order = append(order, sent["type"].(string))
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{"guid": "r", "type": sent["type"]})
			return
		}
		http.NotFound(w, r)
	}))
	defer ts.Close()

	body := `{"changes":[` +
		`{"userGuid":"u1","spaceGuid":"sp1","type":"space_developer","add":true},` +
		`{"userGuid":"u1","orgGuid":"o1","type":"organization_user","add":true}` +
		`]}`
	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPost, "/pp/v1/cf/roles/cnsi-1/changes", body)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).applyNativeRoleChanges(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, []string{"organization_user", "space_developer"}, order)
}

func TestOrderRoleChanges(t *testing.T) {
	space := nativeRoleChange{UserGUID: "u", SpaceGUID: "sp", Type: "space_developer"}
	orgUserAdd := nativeRoleChange{UserGUID: "u", OrgGUID: "o", Type: orgUserRoleType, Add: true}
	orgUserRemove := nativeRoleChange{UserGUID: "u", OrgGUID: "o", Type: orgUserRoleType, Add: false}

	t.Run("org-user add runs first", func(t *testing.T) {
		got := orderRoleChanges([]nativeRoleChange{space, orgUserAdd})
		assert.Equal(t, []int{1, 0}, got)
	})
	t.Run("org-user remove runs last", func(t *testing.T) {
		got := orderRoleChanges([]nativeRoleChange{orgUserRemove, space})
		assert.Equal(t, []int{1, 0}, got)
	})
	t.Run("no org-user change keeps input order", func(t *testing.T) {
		got := orderRoleChanges([]nativeRoleChange{space, space})
		assert.Equal(t, []int{0, 1}, got)
	})
}

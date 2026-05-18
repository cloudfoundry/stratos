// src/jetstream/plugins/cloudfoundry/native_current_user_roles_reads_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestGetNativeCurrentUserRoles_HappyPath exercises the contract that
// replaces the legacy 7-fetch flow: a single /v3/roles call filtered by
// user_guids={me} returns rows that fan out into 7 buckets keyed by the
// frontend's CfUserRelationTypes string values. The response always
// carries every canonical bucket; empty ones serialize as [] so the
// frontend doesn't have to nil-guard.
func TestGetNativeCurrentUserRoles_HappyPath(t *testing.T) {
	var rolesCalls int
	var lastUserGuids string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/roles":
			rolesCalls++
			lastUserGuids = r.URL.Query().Get("user_guids")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 5, "total_pages": 1},
				"resources": []map[string]interface{}{
					// org grants
					{
						"guid": "role-1", "type": "organization_user",
						"relationships": map[string]interface{}{
							"user":         map[string]interface{}{"data": map[string]interface{}{"guid": "cf-user-1"}},
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-a"}},
						},
					},
					{
						"guid": "role-2", "type": "organization_manager",
						"relationships": map[string]interface{}{
							"user":         map[string]interface{}{"data": map[string]interface{}{"guid": "cf-user-1"}},
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-a"}},
						},
					},
					// space grants (with org relationship populated)
					{
						"guid": "role-3", "type": "space_developer",
						"relationships": map[string]interface{}{
							"user":         map[string]interface{}{"data": map[string]interface{}{"guid": "cf-user-1"}},
							"space":        map[string]interface{}{"data": map[string]interface{}{"guid": "sp-1"}},
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-a"}},
						},
					},
					{
						"guid": "role-4", "type": "space_auditor",
						"relationships": map[string]interface{}{
							"user":         map[string]interface{}{"data": map[string]interface{}{"guid": "cf-user-1"}},
							"space":        map[string]interface{}{"data": map[string]interface{}{"guid": "sp-2"}},
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-b"}},
						},
					},
					// space_supporter — intentionally unmapped, must be dropped
					{
						"guid": "role-5", "type": "space_supporter",
						"relationships": map[string]interface{}{
							"user":  map[string]interface{}{"data": map[string]interface{}{"guid": "cf-user-1"}},
							"space": map[string]interface{}{"data": map[string]interface{}{"guid": "sp-3"}},
						},
					},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "stratos-user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "token"},
			tokenInfo:   &api.JWTUserTokenInfo{UserGUID: "cf-user-1"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/current-user-roles/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeCurrentUserRoles(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "1", rec.Header().Get("X-Stratos-Schema-Version"))
	assert.Equal(t, 1, rolesCalls, "single /v3/roles call replaces 7 V2 fetches")
	assert.Equal(t, "cf-user-1", lastUserGuids, "filter must use the CF user GUID from the parsed token")

	var resp CfCurrentUserRolesResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))

	// All 7 canonical buckets must be present (empty ones as []).
	for _, key := range []string{
		"organizations", "managed_organizations", "billing_managed_organizations", "audited_organizations",
		"spaces", "managed_spaces", "audited_spaces",
	} {
		_, ok := resp.Buckets[key]
		assert.Truef(t, ok, "missing canonical bucket key %q", key)
		assert.NotNilf(t, resp.Buckets[key], "bucket %q must serialize as [] not nil", key)
	}

	// Populated org buckets
	require.Len(t, resp.Buckets["organizations"], 1)
	assert.Equal(t, "org-a", resp.Buckets["organizations"][0].Metadata.GUID)
	require.Len(t, resp.Buckets["managed_organizations"], 1)
	assert.Equal(t, "org-a", resp.Buckets["managed_organizations"][0].Metadata.GUID)
	assert.Empty(t, resp.Buckets["billing_managed_organizations"])
	assert.Empty(t, resp.Buckets["audited_organizations"])

	// Populated space buckets carry organization_guid
	require.Len(t, resp.Buckets["spaces"], 1)
	assert.Equal(t, "sp-1", resp.Buckets["spaces"][0].Metadata.GUID)
	assert.Equal(t, "org-a", resp.Buckets["spaces"][0].Entity.OrganizationGUID)
	require.Len(t, resp.Buckets["audited_spaces"], 1)
	assert.Equal(t, "sp-2", resp.Buckets["audited_spaces"][0].Metadata.GUID)
	assert.Equal(t, "org-b", resp.Buckets["audited_spaces"][0].Entity.OrganizationGUID)
	assert.Empty(t, resp.Buckets["managed_spaces"])
}

// TestGetNativeCurrentUserRoles_SpaceOrgFallback verifies the back-fill
// path: a space role row that lacks the organization relationship
// triggers a bounded /v3/spaces?guids= lookup to recover space→org.
func TestGetNativeCurrentUserRoles_SpaceOrgFallback(t *testing.T) {
	var spacesCalls int
	var spacesGuids string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/roles":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "role-x", "type": "space_developer",
						"relationships": map[string]interface{}{
							"user":  map[string]interface{}{"data": map[string]interface{}{"guid": "cf-user-1"}},
							"space": map[string]interface{}{"data": map[string]interface{}{"guid": "sp-orphan"}},
							// organization deliberately omitted
						},
					},
				},
			})
		case "/v3/spaces":
			spacesCalls++
			spacesGuids = r.URL.Query().Get("guids")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "sp-orphan", "name": "rescued",
						"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
						"relationships": map[string]interface{}{
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-rescued"}},
						},
					},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "stratos-user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "token"},
			tokenInfo:   &api.JWTUserTokenInfo{UserGUID: "cf-user-1"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/current-user-roles/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeCurrentUserRoles(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, spacesCalls, "fallback /v3/spaces must fire exactly once for the orphan space set")
	assert.Equal(t, "sp-orphan", spacesGuids, "fallback must filter to the unresolved space GUIDs")

	var resp CfCurrentUserRolesResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Buckets["spaces"], 1)
	assert.Equal(t, "sp-orphan", resp.Buckets["spaces"][0].Metadata.GUID)
	assert.Equal(t, "org-rescued", resp.Buckets["spaces"][0].Entity.OrganizationGUID,
		"space→org fallback must populate the missing organization_guid")
}

// TestGetNativeCurrentUserRoles_EmptyForAdmin verifies that a user
// without explicit grants (typical for an admin whose authority comes
// from UAA scopes) gets an empty-but-complete bucket map back. The
// frontend's session-side admin detection is unrelated to this fetch.
func TestGetNativeCurrentUserRoles_EmptyForAdmin(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/roles":
			_, _ = w.Write([]byte(`{"pagination":{"total_results":0,"total_pages":1},"resources":[]}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "stratos-user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "token"},
			tokenInfo:   &api.JWTUserTokenInfo{UserGUID: "cf-admin"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/current-user-roles/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeCurrentUserRoles(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp CfCurrentUserRolesResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	for _, key := range []string{
		"organizations", "managed_organizations", "billing_managed_organizations", "audited_organizations",
		"spaces", "managed_spaces", "audited_spaces",
	} {
		assert.NotNilf(t, resp.Buckets[key], "bucket %q must be present and serialize as [] for admins with no grants", key)
		assert.Emptyf(t, resp.Buckets[key], "bucket %q must be empty when user has no explicit grants", key)
	}
}

// TestProjectRolesToBuckets_Dedup verifies the projector collapses
// duplicate grants on the same (bucket, target-guid). Defensive — V3
// shouldn't issue dupes for one user, but if it does we don't want the
// reducer seeing them.
func TestProjectRolesToBuckets_Dedup(t *testing.T) {
	roles := []capi.Role{
		{Resource: capi.Resource{GUID: "r1"}, Type: "organization_user",
			Relationships: capi.RoleRelationships{
				User:         capi.Relationship{Data: &capi.RelationshipData{GUID: "u"}},
				Organization: &capi.Relationship{Data: &capi.RelationshipData{GUID: "org-dup"}},
			}},
		{Resource: capi.Resource{GUID: "r2"}, Type: "organization_user",
			Relationships: capi.RoleRelationships{
				User:         capi.Relationship{Data: &capi.RelationshipData{GUID: "u"}},
				Organization: &capi.Relationship{Data: &capi.RelationshipData{GUID: "org-dup"}},
			}},
	}
	buckets, missing := projectRolesToBuckets(roles)
	assert.Empty(t, missing)
	require.Len(t, buckets["organizations"], 1, "duplicate (org_user, org-dup) must collapse to a single bucket entry")
	assert.Equal(t, "org-dup", buckets["organizations"][0].Metadata.GUID)
}

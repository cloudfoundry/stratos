// src/jetstream/plugins/cloudfoundry/native_users_reads_test.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestGetNativeUsers_PerPagePassthrough verifies the handler is a
// single-page passthrough over /v3/users: caller's per_page+page
// forward verbatim and the response carries a V3 pagination envelope.
// /v3/roles is also queried (bounded to the page's user GUIDs); this
// test omits the /v3/roles mock so the soft-fail path is exercised and
// role buckets stay empty but non-nil.
func TestGetNativeUsers_PerPagePassthrough(t *testing.T) {
	var hits int
	var lastPerPage, lastPage string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/users":
			hits++
			lastPerPage = r.URL.Query().Get("per_page")
			lastPage = r.URL.Query().Get("page")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 90, "total_pages": 4,
					"first":    map[string]interface{}{"href": "/v3/users?page=1&per_page=25"},
					"last":     map[string]interface{}{"href": "/v3/users?page=4&per_page=25"},
					"next":     map[string]interface{}{"href": "/v3/users?page=3&per_page=25"},
					"previous": map[string]interface{}{"href": "/v3/users?page=1&per_page=25"},
				},
				"resources": []map[string]interface{}{
					{"guid": "user-1", "username": "alice", "presentation_name": "alice", "origin": "uaa"},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/users/cnsi-1?per_page=25&page=2", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeUsers(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, hits, "single-page passthrough must issue exactly one /v3/users call")
	assert.Equal(t, "25", lastPerPage)
	assert.Equal(t, "2", lastPage)

	var resp StratosPagedResponse[StUser]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 1)
	assert.Equal(t, "alice", resp.Resources[0].Username)
	// Role buckets must marshal as [] not null even though no role drain runs.
	assert.NotNil(t, resp.Resources[0].OrgRoles)
	assert.NotNil(t, resp.Resources[0].SpaceRoles)
	assert.Equal(t, 90, resp.Pagination.TotalResults)
}

// TestGetNativeUsers_OmitsPagingWhenAbsent asserts that with no caller-
// supplied per_page/page, the upstream /v3/users URL has neither key.
func TestGetNativeUsers_OmitsPagingWhenAbsent(t *testing.T) {
	var sawPerPage, sawPage bool
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/users":
			_, sawPerPage = r.URL.Query()["per_page"]
			_, sawPage = r.URL.Query()["page"]
			_, _ = w.Write([]byte(`{"pagination": {"total_results": 0, "total_pages": 0, "next": null},"resources":[]}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/users/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeUsers(c))
	assert.False(t, sawPerPage)
	assert.False(t, sawPage)
}

// TestGetNativeUsers_BoundedRoleJoin is the regression-lock for the
// corrective fix that restored the role join after the initial paging-
// only sweep mistakenly deleted it. The handler must:
//  1. Page /v3/users via caller's per_page+page (already covered above).
//  2. Fetch /v3/roles?user_guids=<csv> bounded to JUST the user GUIDs
//     on the current page — never a foundation-wide drain.
//  3. Bucket org/space role grants per user with V3 prefix stripped
//     ("organization_manager" → "manager"; "space_developer" → "developer").
//  4. Trust the role's own organization relationship for space roles
//     (no /v3/spaces lookup needed when role carries it).
//
// Two users, three role grants — one org_manager + one space_developer
// for alice, one org_auditor for bob — verifies bucket assembly and
// prefix stripping in one pass.
func TestGetNativeUsers_BoundedRoleJoin(t *testing.T) {
	var rolesUserGUIDsParam string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/users":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 2, "total_pages": 1, "next": nil},
				"resources": []map[string]interface{}{
					{"guid": "user-alice", "username": "alice", "presentation_name": "alice", "origin": "uaa"},
					{"guid": "user-bob", "username": "bob", "presentation_name": "bob", "origin": "uaa"},
				},
			})
		case "/v3/roles":
			rolesUserGUIDsParam = r.URL.Query().Get("user_guids")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 3, "total_pages": 1, "next": nil},
				"resources": []map[string]interface{}{
					{
						"guid": "role-1", "type": "organization_manager",
						"relationships": map[string]interface{}{
							"user":         map[string]interface{}{"data": map[string]interface{}{"guid": "user-alice"}},
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
							"space":        map[string]interface{}{"data": nil},
						},
					},
					{
						"guid": "role-2", "type": "space_developer",
						"relationships": map[string]interface{}{
							"user":         map[string]interface{}{"data": map[string]interface{}{"guid": "user-alice"}},
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
							"space":        map[string]interface{}{"data": map[string]interface{}{"guid": "space-a"}},
						},
					},
					{
						"guid": "role-3", "type": "organization_auditor",
						"relationships": map[string]interface{}{
							"user":         map[string]interface{}{"data": map[string]interface{}{"guid": "user-bob"}},
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
							"space":        map[string]interface{}{"data": nil},
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
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/users/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")
	require.NoError(t, plugin.getNativeUsers(c))

	// Bounded — the role fetch carries only the page's user GUIDs.
	assert.Contains(t, rolesUserGUIDsParam, "user-alice")
	assert.Contains(t, rolesUserGUIDsParam, "user-bob")

	var resp StratosPagedResponse[StUser]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)

	byUser := map[string]StUser{}
	for _, u := range resp.Resources {
		byUser[u.Guid] = u
	}

	alice := byUser["user-alice"]
	require.Len(t, alice.OrgRoles, 1)
	assert.Equal(t, "org-1", alice.OrgRoles[0].OrgGuid)
	assert.Contains(t, alice.OrgRoles[0].Roles, "manager", "V3 prefix must be stripped")
	require.Len(t, alice.SpaceRoles, 1)
	assert.Equal(t, "space-a", alice.SpaceRoles[0].SpaceGuid)
	assert.Equal(t, "org-1", alice.SpaceRoles[0].OrgGuid, "space role must carry parent org from role's relationship")
	assert.Contains(t, alice.SpaceRoles[0].Roles, "developer")

	bob := byUser["user-bob"]
	require.Len(t, bob.OrgRoles, 1)
	assert.Contains(t, bob.OrgRoles[0].Roles, "auditor")
	assert.Empty(t, bob.SpaceRoles)
}

// TestGetNativeUsers_CountsFastPath verifies ?return=counts: per_page=1
// hit on /v3/users only — no role join. The count is /v3/users
// totalResults; the role join doesn't run on the counts path.
func TestGetNativeUsers_CountsFastPath(t *testing.T) {
	roleHits := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/users":
			perPage := r.URL.Query().Get("per_page")
			body := `{"pagination":{"total_results":42,"total_pages":1,"next":null},"resources":[],"_per_page_seen":"` + perPage + `"}`
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(body))
		case "/v3/roles":
			roleHits++
			http.NotFound(w, r)
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/users/cnsi-1?return=counts", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/users/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeUsers(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 0, roleHits, "counts path must skip the /v3/roles join")

	var resp StUsersResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 42, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}

// TestGetNativeUsers_SpaceOrgFallbackChunks locks the chunked /v3/spaces
// fallback. Real CF space roles carry NO organization relationship (the
// inline-org shape in TestGetNativeUsers_BoundedRoleJoin is the lucky
// path), so every space must resolve through /v3/spaces?guids=. With an
// admin-grade role list (hundreds of spaces) a single guids= join blew
// the CF request-line limit, the lookup failed silently, and every space
// bucket shipped with an empty orgGuid — breaking the Manage Roles
// baseline (GH#5439). The fallback must batch guids ≤ spaceGUIDChunkSize
// per request and still resolve every bucket.
func TestGetNativeUsers_SpaceOrgFallbackChunks(t *testing.T) {
	const spaceCount = 250
	var spacesRequests [][]string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/users":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1, "next": nil},
				"resources": []map[string]interface{}{
					{"guid": "user-admin", "username": "admin", "presentation_name": "admin", "origin": "uaa"},
				},
			})
		case "/v3/roles":
			roles := make([]map[string]interface{}, 0, spaceCount)
			for i := 0; i < spaceCount; i++ {
				roles = append(roles, map[string]interface{}{
					"guid": fmt.Sprintf("role-%d", i), "type": "space_developer",
					"relationships": map[string]interface{}{
						"user":         map[string]interface{}{"data": map[string]interface{}{"guid": "user-admin"}},
						"organization": map[string]interface{}{"data": nil},
						"space":        map[string]interface{}{"data": map[string]interface{}{"guid": fmt.Sprintf("space-%d", i)}},
					},
				})
			}
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": spaceCount, "total_pages": 1, "next": nil},
				"resources":  roles,
			})
		case "/v3/spaces":
			guids := strings.Split(r.URL.Query().Get("guids"), ",")
			spacesRequests = append(spacesRequests, guids)
			spaces := make([]map[string]interface{}, 0, len(guids))
			for _, g := range guids {
				spaces = append(spaces, map[string]interface{}{
					"guid": g, "name": g,
					"relationships": map[string]interface{}{
						"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
					},
				})
			}
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": len(spaces), "total_pages": 1, "next": nil},
				"resources":  spaces,
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/users/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")
	require.NoError(t, plugin.getNativeUsers(c))

	require.NotEmpty(t, spacesRequests, "space-org fallback must run when roles carry no org relationship")
	seen := 0
	for _, guids := range spacesRequests {
		assert.LessOrEqual(t, len(guids), spaceGUIDChunkSize, "each /v3/spaces lookup must stay within the guid chunk size")
		seen += len(guids)
	}
	assert.Equal(t, spaceCount, seen, "every unresolved space must be looked up exactly once (deduped)")

	var resp StratosPagedResponse[StUser]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 1)
	require.Len(t, resp.Resources[0].SpaceRoles, spaceCount)
	for _, sr := range resp.Resources[0].SpaceRoles {
		assert.Equal(t, "org-1", sr.OrgGuid, "space bucket %s must carry the fallback-resolved parent org", sr.SpaceGuid)
	}
}

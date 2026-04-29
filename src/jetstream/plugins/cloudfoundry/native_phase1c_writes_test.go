// src/jetstream/plugins/cloudfoundry/native_phase1c_writes_test.go
package cloudfoundry

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// captureServer is a small upstream-CAPI mock that records the most recent
// request's method, path and body for assertions, and serves a configured
// response per (method, path) pair.
type captureServer struct {
	*httptest.Server
	lastMethod string
	lastPath   string
	lastBody   string
}

type capiHandler func(w http.ResponseWriter, r *http.Request)

func newCaptureServer(handlers map[string]capiHandler) *captureServer {
	cs := &captureServer{}
	cs.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cs.lastMethod = r.Method
		cs.lastPath = r.URL.Path
		if r.Body != nil {
			b, _ := io.ReadAll(r.Body)
			cs.lastBody = string(b)
		}
		w.Header().Set("Content-Type", "application/json")

		// Always serve the API root for cfclient's FetchAPILinksOnInit.
		if r.URL.Path == "/v3" && r.Method == http.MethodGet {
			_, _ = w.Write([]byte(`{"links":{}}`))
			return
		}

		key := r.Method + " " + r.URL.Path
		if h, ok := handlers[key]; ok {
			h(w, r)
			return
		}
		http.NotFound(w, r)
	}))
	return cs
}

func newPhase1CPlugin(serverURL string) *CloudFoundrySpecification {
	return &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID: "user-1",
			cnsiRecord: api.CNSIRecord{
				GUID:        "cnsi-1",
				APIEndpoint: mustParseURL(serverURL),
			},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}
}

func newPhase1CContext(e *echo.Echo, method, target, body string) (echo.Context, *httptest.ResponseRecorder) {
	var br io.Reader
	if body != "" {
		br = strings.NewReader(body)
	}
	req := httptest.NewRequest(method, target, br)
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	rec := httptest.NewRecorder()
	return e.NewContext(req, rec), rec
}

// ---------------------------------------------------------------------------
// updateNativeOrg

func TestUpdateNativeOrg_PatchAndReturnsMappedOrg(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"PATCH /v3/organizations/org-1": func(w http.ResponseWriter, _ *http.Request) {
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":       "org-1",
				"name":       "renamed",
				"created_at": "2024-01-01T00:00:00Z",
				"updated_at": "2024-01-02T00:00:00Z",
				"metadata":   map[string]interface{}{},
			})
		},
	})
	defer ts.Close()

	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPatch, "/pp/v1/cf/orgs/cnsi-1/org-1", `{"name":"renamed"}`)
	ctx.SetParamNames("cnsiGuid", "orgGuid")
	ctx.SetParamValues("cnsi-1", "org-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).updateNativeOrg(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, http.MethodPatch, ts.lastMethod)
	assert.Equal(t, "/v3/organizations/org-1", ts.lastPath)
	assert.Contains(t, ts.lastBody, `"name":"renamed"`)

	var resp StOrg
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "org-1", resp.GUID)
	assert.Equal(t, "renamed", resp.Name)
}

func TestUpdateNativeOrg_RequiresParams(t *testing.T) {
	ts := newCaptureServer(nil)
	defer ts.Close()
	e := echo.New()
	ctx, _ := newPhase1CContext(e, http.MethodPatch, "/pp/v1/cf/orgs//", `{"name":"x"}`)
	ctx.SetParamNames("cnsiGuid", "orgGuid")
	ctx.SetParamValues("", "")
	err := newPhase1CPlugin(ts.URL).updateNativeOrg(ctx)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
}

// ---------------------------------------------------------------------------
// createNativeSpace / updateNativeSpace

func TestCreateNativeSpace_PostAndReturnsMappedSpace(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"POST /v3/spaces": func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "sp-1",
				"name": "my-space",
				"relationships": map[string]interface{}{
					"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
				},
				"created_at": "2024-01-01T00:00:00Z",
				"updated_at": "2024-01-01T00:00:00Z",
			})
		},
	})
	defer ts.Close()

	body := `{"name":"my-space","relationships":{"organization":{"data":{"guid":"org-1"}}}}`
	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPost, "/pp/v1/cf/spaces/cnsi-1", body)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).createNativeSpace(ctx))
	assert.Equal(t, http.StatusCreated, rec.Code)
	assert.Equal(t, "/v3/spaces", ts.lastPath)
	assert.Equal(t, http.MethodPost, ts.lastMethod)

	var resp StSpace
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "sp-1", resp.GUID)
	assert.Equal(t, "my-space", resp.Name)
	assert.Equal(t, "org-1", resp.OrgGUID)
}

func TestCreateNativeSpace_RequiresOrganizationRelationship(t *testing.T) {
	ts := newCaptureServer(nil)
	defer ts.Close()
	e := echo.New()
	ctx, _ := newPhase1CContext(e, http.MethodPost, "/pp/v1/cf/spaces/cnsi-1", `{"name":"sp"}`)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")
	err := newPhase1CPlugin(ts.URL).createNativeSpace(ctx)
	require.Error(t, err)
	httpErr, _ := err.(*echo.HTTPError)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
}

func TestUpdateNativeSpace_PatchAndReturnsMapped(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"PATCH /v3/spaces/sp-1": func(w http.ResponseWriter, _ *http.Request) {
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "sp-1",
				"name": "renamed",
				"relationships": map[string]interface{}{
					"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
				},
				"created_at": "2024-01-01T00:00:00Z",
				"updated_at": "2024-01-02T00:00:00Z",
			})
		},
	})
	defer ts.Close()

	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPatch, "/pp/v1/cf/spaces/cnsi-1/sp-1", `{"name":"renamed"}`)
	ctx.SetParamNames("cnsiGuid", "spaceGuid")
	ctx.SetParamValues("cnsi-1", "sp-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).updateNativeSpace(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, http.MethodPatch, ts.lastMethod)
	assert.Equal(t, "/v3/spaces/sp-1", ts.lastPath)
}

// ---------------------------------------------------------------------------
// createNativeRoute

func TestCreateNativeRoute_PostAndReturnsMapped(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"POST /v3/routes": func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "route-1",
				"host": "myhost",
				"url":  "myhost.example.com",
				"relationships": map[string]interface{}{
					"space":  map[string]interface{}{"data": map[string]interface{}{"guid": "sp-1"}},
					"domain": map[string]interface{}{"data": map[string]interface{}{"guid": "dom-1"}},
				},
				"created_at": "2024-01-01T00:00:00Z",
				"updated_at": "2024-01-01T00:00:00Z",
			})
		},
	})
	defer ts.Close()

	body := `{"host":"myhost","relationships":{"space":{"data":{"guid":"sp-1"}},"domain":{"data":{"guid":"dom-1"}}}}`
	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPost, "/pp/v1/cf/routes/cnsi-1", body)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).createNativeRoute(ctx))
	assert.Equal(t, http.StatusCreated, rec.Code)
	assert.Equal(t, "/v3/routes", ts.lastPath)
	assert.Equal(t, http.MethodPost, ts.lastMethod)

	var resp StRoute
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "route-1", resp.GUID)
	assert.Equal(t, "cnsi-1", resp.CnsiGUID)
}

// ---------------------------------------------------------------------------
// createNativeApp

func TestCreateNativeApp_PostAndReturnsMapped(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"POST /v3/apps": func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":  "app-1",
				"name":  "my-app",
				"state": "STOPPED",
				"relationships": map[string]interface{}{
					"space": map[string]interface{}{"data": map[string]interface{}{"guid": "sp-1"}},
				},
				"created_at": "2024-01-01T00:00:00Z",
				"updated_at": "2024-01-01T00:00:00Z",
			})
		},
	})
	defer ts.Close()

	body := `{"name":"my-app","relationships":{"space":{"data":{"guid":"sp-1"}}}}`
	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPost, "/pp/v1/cf/apps/cnsi-1", body)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).createNativeApp(ctx))
	assert.Equal(t, http.StatusCreated, rec.Code)
	assert.Equal(t, "/v3/apps", ts.lastPath)

	var resp StApp
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "app-1", resp.GUID)
	assert.Equal(t, "my-app", resp.Name)
}

// ---------------------------------------------------------------------------
// org / space quotas

func TestCreateNativeOrgQuota_PostAndReturnsMapped(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"POST /v3/organization_quotas": func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":       "oq-1",
				"name":       "my-quota",
				"created_at": "2024-01-01T00:00:00Z",
				"updated_at": "2024-01-01T00:00:00Z",
			})
		},
	})
	defer ts.Close()

	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPost, "/pp/v1/cf/organization_quotas/cnsi-1", `{"name":"my-quota"}`)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).createNativeOrgQuota(ctx))
	assert.Equal(t, http.StatusCreated, rec.Code)
	assert.Equal(t, "/v3/organization_quotas", ts.lastPath)

	var resp StOrgQuota
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "oq-1", resp.GUID)
}

func TestUpdateNativeOrgQuota_PatchAndReturnsMapped(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"PATCH /v3/organization_quotas/oq-1": func(w http.ResponseWriter, _ *http.Request) {
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":       "oq-1",
				"name":       "renamed",
				"created_at": "2024-01-01T00:00:00Z",
				"updated_at": "2024-01-02T00:00:00Z",
			})
		},
	})
	defer ts.Close()

	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPatch, "/pp/v1/cf/organization_quotas/cnsi-1/oq-1", `{"name":"renamed"}`)
	ctx.SetParamNames("cnsiGuid", "quotaGuid")
	ctx.SetParamValues("cnsi-1", "oq-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).updateNativeOrgQuota(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "/v3/organization_quotas/oq-1", ts.lastPath)
	assert.Equal(t, http.MethodPatch, ts.lastMethod)
}

func TestCreateNativeSpaceQuota_PostAndReturnsMapped(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"POST /v3/space_quotas": func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "sq-1",
				"name": "my-sq",
				"relationships": map[string]interface{}{
					"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
					"spaces":       map[string]interface{}{"data": []interface{}{}},
				},
				"created_at": "2024-01-01T00:00:00Z",
				"updated_at": "2024-01-01T00:00:00Z",
			})
		},
	})
	defer ts.Close()

	body := `{"name":"my-sq","relationships":{"organization":{"data":{"guid":"org-1"}},"spaces":{"data":[]}}}`
	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPost, "/pp/v1/cf/space_quotas/cnsi-1", body)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).createNativeSpaceQuota(ctx))
	assert.Equal(t, http.StatusCreated, rec.Code)
	assert.Equal(t, "/v3/space_quotas", ts.lastPath)

	var resp StSpaceQuota
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "sq-1", resp.GUID)
}

func TestUpdateNativeSpaceQuota_PatchAndReturnsMapped(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"PATCH /v3/space_quotas/sq-1": func(w http.ResponseWriter, _ *http.Request) {
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "sq-1",
				"name": "renamed",
				"relationships": map[string]interface{}{
					"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
					"spaces":       map[string]interface{}{"data": []interface{}{}},
				},
				"created_at": "2024-01-01T00:00:00Z",
				"updated_at": "2024-01-02T00:00:00Z",
			})
		},
	})
	defer ts.Close()

	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPatch, "/pp/v1/cf/space_quotas/cnsi-1/sq-1", `{"name":"renamed"}`)
	ctx.SetParamNames("cnsiGuid", "quotaGuid")
	ctx.SetParamValues("cnsi-1", "sq-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).updateNativeSpaceQuota(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "/v3/space_quotas/sq-1", ts.lastPath)
}

// ---------------------------------------------------------------------------
// Managed service instance create/update — async path returns 202 + Location.

func TestCreateManagedServiceInstance_AsyncBareFallback(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"POST /v3/service_instances": func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Location", "/v3/jobs/job-1")
			w.WriteHeader(http.StatusAccepted)
			// Managed-instance Create unmarshals the body into a Job; serve a
			// minimal Job resource so the capi client can decode it.
			_, _ = w.Write([]byte(`{"guid":"job-1","operation":"service_instance.create","state":"PROCESSING"}`))
		},
	})
	defer ts.Close()

	body := `{"type":"managed","name":"si","relationships":{"space":{"data":{"guid":"sp-1"}},"service_plan":{"data":{"guid":"plan-1"}}}}`
	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPost, "/pp/v1/cf/service_instances/cnsi-1", body)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).createManagedServiceInstance(ctx))
	// Without async-job wiring (asyncTracker/asyncTranslator are nil) handler
	// must surface a bare 202 — same fallback as deleteNativeOrg.
	assert.Equal(t, http.StatusAccepted, rec.Code)
	assert.Equal(t, "/v3/service_instances", ts.lastPath)
	assert.Equal(t, http.MethodPost, ts.lastMethod)
}

func TestCreateManagedServiceInstance_RejectsUserProvided(t *testing.T) {
	ts := newCaptureServer(nil)
	defer ts.Close()
	body := `{"type":"user-provided","name":"x","relationships":{"space":{"data":{"guid":"sp-1"}}}}`
	e := echo.New()
	ctx, _ := newPhase1CContext(e, http.MethodPost, "/pp/v1/cf/service_instances/cnsi-1", body)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")
	err := newPhase1CPlugin(ts.URL).createManagedServiceInstance(ctx)
	require.Error(t, err)
	httpErr, _ := err.(*echo.HTTPError)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
}

func TestUpdateManagedServiceInstance_AsyncBareFallback(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"PATCH /v3/service_instances/si-1": func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Location", "/v3/jobs/job-1")
			w.WriteHeader(http.StatusAccepted)
			_, _ = w.Write([]byte(`{"guid":"job-1","operation":"service_instance.update","state":"PROCESSING"}`))
		},
	})
	defer ts.Close()

	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPatch, "/pp/v1/cf/service_instances/cnsi-1/si-1", `{"name":"renamed"}`)
	ctx.SetParamNames("cnsiGuid", "siGuid")
	ctx.SetParamValues("cnsi-1", "si-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).updateManagedServiceInstance(ctx))
	assert.Equal(t, http.StatusAccepted, rec.Code)
	assert.Equal(t, "/v3/service_instances/si-1", ts.lastPath)
	assert.Equal(t, http.MethodPatch, ts.lastMethod)
}

// ---------------------------------------------------------------------------
// Roles (Slice 2)

func TestCreateNativeRole_OrgScopedSync(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"POST /v3/roles": func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "role-1",
				"type": "organization_manager",
				"relationships": map[string]interface{}{
					"user":         map[string]interface{}{"data": map[string]interface{}{"guid": "user-1"}},
					"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
				},
			})
		},
	})
	defer ts.Close()

	body := `{"type":"organization_manager","relationships":{"user":{"data":{"guid":"user-1"}},"organization":{"data":{"guid":"org-1"}}}}`
	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPost, "/pp/v1/cf/roles/cnsi-1", body)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).createNativeRole(ctx))
	assert.Equal(t, http.StatusCreated, rec.Code)
	assert.Equal(t, "/v3/roles", ts.lastPath)

	var sent map[string]interface{}
	require.NoError(t, json.Unmarshal([]byte(ts.lastBody), &sent))
	assert.Equal(t, "organization_manager", sent["type"])
}

func TestCreateNativeRole_RequiresExactlyOneScope(t *testing.T) {
	ts := newCaptureServer(nil)
	defer ts.Close()

	cases := []struct {
		name string
		body string
	}{
		{
			name: "neither org nor space",
			body: `{"type":"organization_manager","relationships":{"user":{"data":{"guid":"user-1"}}}}`,
		},
		{
			name: "both org and space",
			body: `{"type":"organization_manager","relationships":{"user":{"data":{"guid":"user-1"}},"organization":{"data":{"guid":"org-1"}},"space":{"data":{"guid":"sp-1"}}}}`,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			e := echo.New()
			ctx, _ := newPhase1CContext(e, http.MethodPost, "/pp/v1/cf/roles/cnsi-1", tc.body)
			ctx.SetParamNames("cnsiGuid")
			ctx.SetParamValues("cnsi-1")
			err := newPhase1CPlugin(ts.URL).createNativeRole(ctx)
			require.Error(t, err)
			httpErr, _ := err.(*echo.HTTPError)
			assert.Equal(t, http.StatusBadRequest, httpErr.Code)
		})
	}
}

// TestDeleteNativeRole_AsyncJob verifies the role-delete handler honors
// CF v3's 202 + Location-header async contract. The fork's
// RolesClient.Delete now returns (*Job, error) (mirrors Apps().Delete),
// so the handler extracts the job GUID and — with no asyncTracker
// wired in this test plugin — falls back to bare 202 like deleteNativeApp.
// When a tracker is wired in production, the same path runs the
// stratosjobs fast-path wrapper.
func TestDeleteNativeRole_AsyncJob(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"DELETE /v3/roles/role-1": func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Location", "/v3/jobs/job-1")
			w.WriteHeader(http.StatusAccepted)
		},
	})
	defer ts.Close()

	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodDelete, "/pp/v1/cf/roles/cnsi-1/role-1", "")
	ctx.SetParamNames("cnsiGuid", "roleGuid")
	ctx.SetParamValues("cnsi-1", "role-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).deleteNativeRole(ctx))
	assert.Equal(t, http.StatusAccepted, rec.Code)
	assert.Equal(t, "/v3/roles/role-1", ts.lastPath)
	assert.Equal(t, http.MethodDelete, ts.lastMethod)
}

// ---------------------------------------------------------------------------
// Error path — verifies upstream non-2xx flows through handleCapiError on at
// least one new sync handler. Pinning org update is sufficient to cover the
// shared error path used by every synchronous handler in this set.

func TestUpdateNativeOrg_PropagatesUpstreamError(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"PATCH /v3/organizations/org-1": func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusUnprocessableEntity)
			_, _ = w.Write([]byte(`{"errors":[{"code":10008,"title":"CF-UnprocessableEntity","detail":"name in use"}]}`))
		},
	})
	defer ts.Close()

	e := echo.New()
	ctx, rec := newPhase1CContext(e, http.MethodPatch, "/pp/v1/cf/orgs/cnsi-1/org-1", `{"name":"taken"}`)
	ctx.SetParamNames("cnsiGuid", "orgGuid")
	ctx.SetParamValues("cnsi-1", "org-1")

	require.NoError(t, newPhase1CPlugin(ts.URL).updateNativeOrg(ctx))
	assert.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	assert.Contains(t, rec.Body.String(), "UnprocessableEntity")
}

// src/jetstream/plugins/cloudfoundry/native_handlers_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// ---- minimal stub portal proxy ----

type stubPortalProxy struct {
	cnsiRecord  api.CNSIRecord
	tokenRecord api.TokenRecord
	tokenOK     bool
}

func (s *stubPortalProxy) GetCNSIRecord(guid string) (api.CNSIRecord, error) {
	return s.cnsiRecord, nil
}

func (s *stubPortalProxy) GetCNSITokenRecord(cnsiGUID string, userGUID string) (api.TokenRecord, bool) {
	return s.tokenRecord, s.tokenOK
}

func (s *stubPortalProxy) GetSessionStringValue(ctx echo.Context, key string) (string, error) {
	return "test-user-guid", nil
}

// ---- helpers ----

func newTestEchoCtx(params map[string]string) (*httptest.ResponseRecorder, echo.Context) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	names := make([]string, 0, len(params))
	values := make([]string, 0, len(params))
	for k, v := range params {
		names = append(names, k)
		values = append(values, v)
	}
	ctx.SetParamNames(names...)
	ctx.SetParamValues(values...)
	return rec, ctx
}

// cfAPIServer starts a test HTTP server that serves a fixed response for CF v3 API calls.
// It returns the server and a CloudFoundrySpecification backed by it.
func cfAPIServer(t *testing.T, mux *http.ServeMux) (*httptest.Server, *CloudFoundrySpecification) {
	t.Helper()
	srv := httptest.NewServer(mux)
	t.Cleanup(srv.Close)

	srvURL, _ := url.Parse(srv.URL)

	proxy := &stubPortalProxy{
		cnsiRecord: api.CNSIRecord{
			GUID:        "test-cnsi-guid",
			APIEndpoint: srvURL,
		},
		tokenRecord: api.TokenRecord{
			AuthToken: "fake-access-token",
		},
		tokenOK: true,
	}

	// Use testProxy so we don't need to implement the full api.PortalProxy interface.
	cf := &CloudFoundrySpecification{
		testProxy: proxy,
	}
	return srv, cf
}

// ---- TestGetNativeOrgs ----

func TestGetNativeOrgs(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/v3/organizations", func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got == "" {
			t.Errorf("expected Authorization header, got empty")
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"pagination": map[string]interface{}{
				"total_results": 2,
			},
			"resources": []map[string]interface{}{
				{
					"guid":       "org-guid-1",
					"name":       "org-one",
					"created_at": "2024-01-01T00:00:00Z",
					"updated_at": "2024-06-01T00:00:00Z",
					"metadata": map[string]interface{}{
						"labels":      map[string]string{"env": "prod"},
						"annotations": map[string]string{},
					},
					"relationships": map[string]interface{}{},
				},
				{
					"guid":       "org-guid-2",
					"name":       "org-two",
					"created_at": "2024-02-01T00:00:00Z",
					"updated_at": "2024-07-01T00:00:00Z",
					"metadata": map[string]interface{}{
						"labels":      nil,
						"annotations": nil,
					},
					"relationships": map[string]interface{}{},
				},
			},
		})
	})

	_, cf := cfAPIServer(t, mux)
	rec, ctx := newTestEchoCtx(map[string]string{"cnsiGuid": "test-cnsi-guid"})

	if err := cf.getNativeOrgs(ctx); err != nil {
		t.Fatalf("getNativeOrgs returned error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if got := rec.Header().Get("X-Stratos-Schema-Version"); got != "1" {
		t.Errorf("expected X-Stratos-Schema-Version=1, got %q", got)
	}

	var resp StOrgsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("could not decode response: %v", err)
	}
	if resp.TotalResults != 2 {
		t.Errorf("expected TotalResults=2, got %d", resp.TotalResults)
	}
	if len(resp.Resources) != 2 {
		t.Fatalf("expected 2 resources, got %d", len(resp.Resources))
	}
	if resp.Resources[0].GUID != "org-guid-1" {
		t.Errorf("expected first org GUID org-guid-1, got %q", resp.Resources[0].GUID)
	}
	if resp.Resources[0].Status != "active" {
		t.Errorf("expected status=active, got %q", resp.Resources[0].Status)
	}
	// nil labels/annotations should be normalised to empty map
	if resp.Resources[1].Labels == nil {
		t.Error("expected non-nil Labels on second org")
	}
	if resp.Resources[1].Annotations == nil {
		t.Error("expected non-nil Annotations on second org")
	}
}

// ---- TestGetNativeApps ----

func TestGetNativeApps(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/v3/apps", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"pagination": map[string]interface{}{
				"total_results": 1,
			},
			"resources": []map[string]interface{}{
				{
					"guid":       "app-guid-1",
					"name":       "my-app",
					"state":      "STARTED",
					"created_at": "2024-03-01T00:00:00Z",
					"updated_at": "2024-03-15T00:00:00Z",
					"relationships": map[string]interface{}{
						"space": map[string]interface{}{
							"data": map[string]interface{}{
								"guid": "space-guid-1",
							},
						},
					},
				},
			},
		})
	})

	_, cf := cfAPIServer(t, mux)
	rec, ctx := newTestEchoCtx(map[string]string{"cnsiGuid": "test-cnsi-guid"})

	if err := cf.getNativeApps(ctx); err != nil {
		t.Fatalf("getNativeApps returned error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if got := rec.Header().Get("X-Stratos-Schema-Version"); got != "1" {
		t.Errorf("expected X-Stratos-Schema-Version=1, got %q", got)
	}

	var resp StAppsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("could not decode response: %v", err)
	}
	if resp.TotalResults != 1 {
		t.Errorf("expected TotalResults=1, got %d", resp.TotalResults)
	}
	if len(resp.Resources) != 1 {
		t.Fatalf("expected 1 resource, got %d", len(resp.Resources))
	}
	app := resp.Resources[0]
	if app.GUID != "app-guid-1" {
		t.Errorf("expected GUID app-guid-1, got %q", app.GUID)
	}
	if app.SpaceGUID != "space-guid-1" {
		t.Errorf("expected SpaceGUID space-guid-1, got %q", app.SpaceGUID)
	}
	if app.State != "STARTED" {
		t.Errorf("expected state STARTED, got %q", app.State)
	}
}

// ---- TestGetNativeRouteCount ----

func TestGetNativeRouteCount(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/v3/routes", func(w http.ResponseWriter, r *http.Request) {
		// Should request per_page=1 for efficiency
		if r.URL.Query().Get("per_page") != "1" {
			t.Errorf("expected per_page=1, got %q", r.URL.Query().Get("per_page"))
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"pagination": map[string]interface{}{
				"total_results": 42,
			},
			"resources": []interface{}{},
		})
	})

	_, cf := cfAPIServer(t, mux)
	rec, ctx := newTestEchoCtx(map[string]string{"cnsiGuid": "test-cnsi-guid"})

	if err := cf.getNativeRouteCount(ctx); err != nil {
		t.Fatalf("getNativeRouteCount returned error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if got := rec.Header().Get("X-Stratos-Schema-Version"); got != "1" {
		t.Errorf("expected X-Stratos-Schema-Version=1, got %q", got)
	}

	var resp StRoutesResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("could not decode response: %v", err)
	}
	if resp.TotalResults != 42 {
		t.Errorf("expected TotalResults=42, got %d", resp.TotalResults)
	}
}

// ---- TestGetNativeOrgDetail ----

func TestGetNativeOrgDetail(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/v3/organizations/org-guid-1", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"guid":       "org-guid-1",
			"name":       "my-org",
			"created_at": "2024-01-01T00:00:00Z",
			"updated_at": "2024-06-01T00:00:00Z",
			"metadata": map[string]interface{}{
				"labels":      map[string]string{},
				"annotations": map[string]string{},
			},
			"relationships": map[string]interface{}{},
		})
	})

	_, cf := cfAPIServer(t, mux)
	rec, ctx := newTestEchoCtx(map[string]string{
		"cnsiGuid": "test-cnsi-guid",
		"orgGuid":  "org-guid-1",
	})

	if err := cf.getNativeOrgDetail(ctx); err != nil {
		t.Fatalf("getNativeOrgDetail returned error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if got := rec.Header().Get("X-Stratos-Schema-Version"); got != "1" {
		t.Errorf("expected X-Stratos-Schema-Version=1, got %q", got)
	}

	var resp StOrgDetail
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("could not decode response: %v", err)
	}
	if resp.GUID != "org-guid-1" {
		t.Errorf("expected GUID org-guid-1, got %q", resp.GUID)
	}
	if resp.Name != "my-org" {
		t.Errorf("expected name my-org, got %q", resp.Name)
	}
	// Spaces should be nil/empty (fetched via separate route)
	if len(resp.Spaces) != 0 {
		t.Errorf("expected 0 spaces in detail, got %d", len(resp.Spaces))
	}
}

// ---- TestGetNativeOrgSpaces ----

func TestGetNativeOrgSpaces(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/v3/spaces", func(w http.ResponseWriter, r *http.Request) {
		if got := r.URL.Query().Get("organization_guids"); got != "org-guid-1" {
			t.Errorf("expected organization_guids=org-guid-1, got %q", got)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"pagination": map[string]interface{}{
				"total_results": 2,
			},
			"resources": []map[string]interface{}{
				{
					"guid":       "space-guid-1",
					"name":       "development",
					"created_at": "2024-01-01T00:00:00Z",
					"updated_at": "2024-06-01T00:00:00Z",
					"relationships": map[string]interface{}{
						"organization": map[string]interface{}{
							"data": map[string]interface{}{
								"guid": "org-guid-1",
							},
						},
					},
				},
				{
					"guid":       "space-guid-2",
					"name":       "production",
					"created_at": "2024-01-02T00:00:00Z",
					"updated_at": "2024-06-02T00:00:00Z",
					"relationships": map[string]interface{}{
						"organization": map[string]interface{}{
							"data": map[string]interface{}{
								"guid": "org-guid-1",
							},
						},
					},
				},
			},
		})
	})

	_, cf := cfAPIServer(t, mux)
	rec, ctx := newTestEchoCtx(map[string]string{
		"cnsiGuid": "test-cnsi-guid",
		"orgGuid":  "org-guid-1",
	})

	if err := cf.getNativeOrgSpaces(ctx); err != nil {
		t.Fatalf("getNativeOrgSpaces returned error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if got := rec.Header().Get("X-Stratos-Schema-Version"); got != "1" {
		t.Errorf("expected X-Stratos-Schema-Version=1, got %q", got)
	}

	var resp StSpacesResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("could not decode response: %v", err)
	}
	if resp.TotalResults != 2 {
		t.Errorf("expected TotalResults=2, got %d", resp.TotalResults)
	}
	if len(resp.Resources) != 2 {
		t.Fatalf("expected 2 resources, got %d", len(resp.Resources))
	}
	if resp.Resources[0].OrgGUID != "org-guid-1" {
		t.Errorf("expected OrgGUID org-guid-1, got %q", resp.Resources[0].OrgGUID)
	}
	if resp.Resources[0].Name != "development" {
		t.Errorf("expected name development, got %q", resp.Resources[0].Name)
	}
}

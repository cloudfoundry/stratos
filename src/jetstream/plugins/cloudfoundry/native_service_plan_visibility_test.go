// src/jetstream/plugins/cloudfoundry/native_service_plan_visibility_test.go
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

// visibilityTestServer captures the upstream method/body so the
// backend's POST/PATCH/DELETE shape can be asserted directly.
type visibilityTestServer struct {
	*httptest.Server
	lastMethod string
	lastBody   string
	lastPath   string
}

func newVisibilityTestServer(t *testing.T) *visibilityTestServer {
	t.Helper()
	s := &visibilityTestServer{}
	s.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		s.lastMethod = r.Method
		s.lastPath = r.URL.Path
		if r.Body != nil {
			b, _ := io.ReadAll(r.Body)
			s.lastBody = string(b)
		}
		w.Header().Set("Content-Type", "application/json")

		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case strings.HasSuffix(r.URL.Path, "/visibility") && r.Method == http.MethodGet:
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"type": "organization",
				"organizations": []map[string]interface{}{
					{"guid": "org-1", "name": "First Org"},
					{"guid": "org-2", "name": "Second Org"},
				},
			})
		case strings.HasSuffix(r.URL.Path, "/visibility") && (r.Method == http.MethodPost || r.Method == http.MethodPatch):
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"type": "organization",
				"organizations": []map[string]interface{}{
					{"guid": "org-1", "name": "First Org"},
				},
			})
		case strings.Contains(r.URL.Path, "/visibility/") && r.Method == http.MethodDelete:
			w.WriteHeader(http.StatusNoContent)
		default:
			http.NotFound(w, r)
		}
	}))
	return s
}

func newVisibilityPlugin(serverURL string) *CloudFoundrySpecification {
	return &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID: "user-1",
			cnsiRecord: api.CNSIRecord{
				GUID:        "test-cnsi",
				APIEndpoint: mustParseURL(serverURL),
			},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}
}

func newVisibilityContext(e *echo.Echo, method, target, body string) (echo.Context, *httptest.ResponseRecorder) {
	var bodyReader io.Reader
	if body != "" {
		bodyReader = strings.NewReader(body)
	}
	req := httptest.NewRequest(method, target, bodyReader)
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	return ctx, rec
}

func TestGetNativeServicePlanVisibility(t *testing.T) {
	ts := newVisibilityTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newVisibilityContext(e, http.MethodGet, "/pp/v1/cf/service_plans/test-cnsi/plan-1/visibility", "")
	ctx.SetParamNames("cnsiGuid", "planGuid")
	ctx.SetParamValues("test-cnsi", "plan-1")
	plugin := newVisibilityPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServicePlanVisibility(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "/v3/service_plans/plan-1/visibility", ts.lastPath)
	assert.Equal(t, http.MethodGet, ts.lastMethod)

	var resp StServicePlanVisibility
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "organization", resp.Type)
	assert.Len(t, resp.Organizations, 2)
	assert.Equal(t, "org-1", resp.Organizations[0].GUID)
	assert.Equal(t, "First Org", resp.Organizations[0].Name)
}

func TestApplyNativeServicePlanVisibility_Replace(t *testing.T) {
	ts := newVisibilityTestServer(t)
	defer ts.Close()

	body := `{"type":"organization","organizations":["org-1"]}`

	e := echo.New()
	ctx, rec := newVisibilityContext(e, http.MethodPost, "/pp/v1/cf/service_plans/test-cnsi/plan-1/visibility", body)
	ctx.SetParamNames("cnsiGuid", "planGuid")
	ctx.SetParamValues("test-cnsi", "plan-1")
	plugin := newVisibilityPlugin(ts.URL)

	require.NoError(t, plugin.applyNativeServicePlanVisibility(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, http.MethodPost, ts.lastMethod, "POST surface should map to a CAPI POST (replace)")
}

func TestApplyNativeServicePlanVisibility_Merge(t *testing.T) {
	ts := newVisibilityTestServer(t)
	defer ts.Close()

	body := `{"type":"organization","organizations":["org-1"]}`

	e := echo.New()
	ctx, rec := newVisibilityContext(e, http.MethodPatch, "/pp/v1/cf/service_plans/test-cnsi/plan-1/visibility", body)
	ctx.SetParamNames("cnsiGuid", "planGuid")
	ctx.SetParamValues("test-cnsi", "plan-1")
	plugin := newVisibilityPlugin(ts.URL)

	require.NoError(t, plugin.applyNativeServicePlanVisibility(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, http.MethodPatch, ts.lastMethod, "PATCH surface should map to a CAPI PATCH (apply/merge)")
}

func TestRemoveOrgFromNativeServicePlanVisibility(t *testing.T) {
	ts := newVisibilityTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newVisibilityContext(e, http.MethodDelete, "/pp/v1/cf/service_plans/test-cnsi/plan-1/visibility/org-1", "")
	ctx.SetParamNames("cnsiGuid", "planGuid", "orgGuid")
	ctx.SetParamValues("test-cnsi", "plan-1", "org-1")
	plugin := newVisibilityPlugin(ts.URL)

	require.NoError(t, plugin.removeOrgFromNativeServicePlanVisibility(ctx))
	assert.Equal(t, http.StatusNoContent, rec.Code)
	assert.Equal(t, http.MethodDelete, ts.lastMethod)
	assert.Equal(t, "/v3/service_plans/plan-1/visibility/org-1", ts.lastPath)
}

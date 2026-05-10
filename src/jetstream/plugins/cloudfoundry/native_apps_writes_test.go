// src/jetstream/plugins/cloudfoundry/native_apps_writes_test.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestDeleteNativeApp_Forwards_v3_Apps_Delete verifies the handler issues a
// DELETE to /v3/apps/{guid} against the target CF foundation. Without the
// stratosjobs wiring (asyncTracker/asyncTranslator left nil on the test
// plugin), the handler falls back to bare-202 behavior — the async-job
// contract paths are covered by the fast-path / handoff tests below.
func TestDeleteNativeApp_Forwards_v3_Apps_Delete(t *testing.T) {
	capiCalls := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		capiCalls++
		assert.Equal(t, http.MethodDelete, r.Method)
		assert.Equal(t, "/v3/apps/app-1", r.URL.Path)
		// CF v3 app delete returns 202 Accepted with a Location header for the async job
		w.Header().Set("Location", "/v3/jobs/delete-job-1")
		w.WriteHeader(http.StatusAccepted)
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/apps/cnsi-1/app-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")

	require.NoError(t, plugin.deleteNativeApp(c))
	assert.Equal(t, http.StatusAccepted, rec.Code)
	assert.Equal(t, 1, capiCalls)
}

// TestDeleteNativeApp_PropagatesCapiError verifies that when CF returns a
// non-2xx error envelope the Stratos handler surfaces an appropriate HTTP
// status and preserves the CF error body so upstream callers can diagnose
// the failure (e.g. ResourceNotFound).
func TestDeleteNativeApp_PropagatesCapiError(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(`{"errors":[{"code":10010,"title":"CF-ResourceNotFound","detail":"App not found"}]}`))
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/apps/cnsi-1/missing", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "missing")

	require.NoError(t, plugin.deleteNativeApp(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
	assert.Contains(t, rec.Body.String(), "ResourceNotFound")
}

// TestAppAction_ForwardsLifecycleVerbs parameterizes the three v3 lifecycle
// verbs (start/stop/restart) that map 1:1 to POST /v3/apps/{guid}/actions/{v}.
// Each CF response is 202 + Location → /v3/jobs/{jobGuid}; the fork's
// AppsClient extracts the job GUID and returns it to the handler. With no
// asyncTracker wired, the handler falls back to bare 202 (the pre-contract
// behavior), which is what this test pins.
//
// Restage is NOT in this set — CF v3 has no /actions/restage endpoint. The
// restage verb is dispatched to restageApp (v2 passthrough); see the
// TestRestageApp_* suite for its coverage.
func TestAppAction_ForwardsLifecycleVerbs(t *testing.T) {
	cases := []struct {
		action       string
		expectedPath string
	}{
		{"start", "/v3/apps/app-1/actions/start"},
		{"stop", "/v3/apps/app-1/actions/stop"},
		{"restart", "/v3/apps/app-1/actions/restart"},
	}

	for _, tc := range cases {
		t.Run(tc.action, func(t *testing.T) {
			capiCalls := 0
			capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/v3" {
					w.Header().Set("Content-Type", "application/json")
					w.Write([]byte(`{"links":{}}`))
					return
				}
				capiCalls++
				assert.Equal(t, http.MethodPost, r.Method)
				assert.Equal(t, tc.expectedPath, r.URL.Path)
				w.Header().Set("Location", "/v3/jobs/job-"+tc.action)
				w.WriteHeader(http.StatusAccepted)
			}))
			defer capiServer.Close()

			plugin := &CloudFoundrySpecification{
				testProxy: &mockNativeCFProxy{
					userID:      "user-1",
					cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
					tokenRecord: api.TokenRecord{AuthToken: "test-token"},
				},
			}

			e := echo.New()
			req := httptest.NewRequest(http.MethodPost, "/pp/v1/cf/apps/cnsi-1/app-1/actions/"+tc.action, nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)
			c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/actions/:action")
			c.SetParamNames("cnsiGuid", "appGuid", "action")
			c.SetParamValues("cnsi-1", "app-1", tc.action)

			require.NoError(t, plugin.appAction(c))
			assert.Equal(t, http.StatusAccepted, rec.Code)
			assert.Equal(t, 1, capiCalls)
		})
	}
}

// TestRestageApp_NoTrackerReturns503 verifies the handler refuses to
// kick a restage if the stratosjobs plugin wasn't registered at startup.
// Restage *must* run via the async-job contract (multi-minute, multi-step)
// so the legacy bare-202 fallback used by other lifecycle handlers is
// not appropriate here.
func TestRestageApp_NoTrackerReturns503(t *testing.T) {
	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL("https://cf.example.com")},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1/cf/apps/cnsi-1/app-1/actions/restage", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/actions/:action")
	c.SetParamNames("cnsiGuid", "appGuid", "action")
	c.SetParamValues("cnsi-1", "app-1", "restage")

	err := plugin.appAction(c)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusServiceUnavailable, httpErr.Code)
}

// TestRestageApp_RejectsInvalidStrategy guards the wire shape: any
// strategy outside {"", "rolling", "canary"} is rejected at the handler
// boundary before the orchestrator runs.
func TestRestageApp_RejectsInvalidStrategy(t *testing.T) {
	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL("https://cf.example.com")},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
		asyncTracker: stratosjobs.NewInMemoryTracker(stratosjobs.InMemoryTrackerConfig{}),
	}
	plugin.restageTranslator = NewRestageJobTranslator(plugin)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1/cf/apps/cnsi-1/app-1/actions/restage",
		strings.NewReader(`{"strategy":"voodoo"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/actions/:action")
	c.SetParamNames("cnsiGuid", "appGuid", "action")
	c.SetParamValues("cnsi-1", "app-1", "restage")

	err := plugin.appAction(c)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
}

// TestRestageApp_FastPathResolvesOnNoEligiblePackage exercises the
// orchestrator end-to-end through the handler when the very first stage
// (package_lookup) terminally fails. The fast-path window resolves
// before handoff, so the handler returns 502 with the FAILED envelope —
// matching the shape used by other write handlers.
func TestRestageApp_FastPathResolvesOnNoEligiblePackage(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/packages":
			_, _ = w.Write([]byte(`{"pagination":{"total_results":0,"total_pages":0},"resources":[]}`))
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
		asyncTracker: stratosjobs.NewInMemoryTracker(stratosjobs.InMemoryTrackerConfig{}),
	}
	plugin.restageTranslator = NewRestageJobTranslator(plugin)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1/cf/apps/cnsi-1/app-empty/actions/restage", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/actions/:action")
	c.SetParamNames("cnsiGuid", "appGuid", "action")
	c.SetParamValues("cnsi-1", "app-empty", "restage")

	require.NoError(t, plugin.appAction(c))
	assert.Equal(t, http.StatusBadGateway, rec.Code)

	var body map[string]interface{}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
	assert.Equal(t, string(stratosjobs.JobStateFailed), body["state"])
	errs, ok := body["errors"].([]interface{})
	require.True(t, ok)
	require.Len(t, errs, 1)
	errObj := errs[0].(map[string]interface{})
	assert.Equal(t, "stratos.restage.package_lookup", errObj["code"])
}

// TestAppAction_RejectsUnknownVerb confirms that a verb outside the allowlist
// is rejected with HTTP 400 before any upstream call is attempted.
func TestAppAction_RejectsUnknownVerb(t *testing.T) {
	capiCalls := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capiCalls++
		w.WriteHeader(http.StatusOK)
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1/cf/apps/cnsi-1/app-1/actions/frobnicate", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/actions/:action")
	c.SetParamNames("cnsiGuid", "appGuid", "action")
	c.SetParamValues("cnsi-1", "app-1", "frobnicate")

	err := plugin.appAction(c)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok, "expected *echo.HTTPError, got %T", err)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
	assert.Equal(t, 0, capiCalls, "no upstream call should be made for an unknown verb")
}

// TestAppAction_PropagatesCapiError confirms non-2xx upstream responses are
// classified and their CF error body is surfaced to the caller — mirroring
// the delete-handler's error-propagation contract via the shared helper.
func TestAppAction_PropagatesCapiError(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		w.Write([]byte(`{"errors":[{"code":10008,"title":"CF-UnprocessableEntity","detail":"App is already started"}]}`))
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1/cf/apps/cnsi-1/app-1/actions/start", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/actions/:action")
	c.SetParamNames("cnsiGuid", "appGuid", "action")
	c.SetParamValues("cnsi-1", "app-1", "start")

	require.NoError(t, plugin.appAction(c))
	assert.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	assert.Contains(t, rec.Body.String(), "UnprocessableEntity")
}

// patchAppHelper wires a mock CF v3 server + plugin + echo.Context for the
// PATCH-handler tests. It returns the recorder so callers can assert status +
// body, and exposes the plugin so tests invoke the handler directly.
func patchAppHelper(t *testing.T, handler http.HandlerFunc, body string) (*httptest.ResponseRecorder, error) {
	t.Helper()
	capiServer := httptest.NewServer(handler)
	t.Cleanup(capiServer.Close)

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodPatch, "/pp/v1/cf/apps/cnsi-1/app-1", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")

	return rec, plugin.patchApp(c)
}

// TestPatchApp_NameOnly_UpdatesAppName verifies that a body with only the name
// field issues exactly one PATCH /v3/apps/{guid} to the upstream CF API and
// returns 200 with the app guid and no _meta.errors envelope.
func TestPatchApp_NameOnly_UpdatesAppName(t *testing.T) {
	appUpdates := 0
	var receivedBody map[string]interface{}
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		if r.URL.Path == "/v3/apps/app-1" && r.Method == http.MethodPatch {
			appUpdates++
			_ = json.NewDecoder(r.Body).Decode(&receivedBody)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"guid":"app-1","name":"new-name"}`))
			return
		}
		http.NotFound(w, r)
	})

	rec, err := patchAppHelper(t, handler, `{"name":"new-name"}`)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, appUpdates)
	assert.Equal(t, "new-name", receivedBody["name"])

	var resp map[string]interface{}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, "app-1", resp["guid"])
	_, hasMeta := resp["_meta"]
	assert.False(t, hasMeta, "name-only success should not include _meta.errors envelope")
}

// TestPatchApp_PartialFailure_ReturnsMetaErrors verifies that when one sub-call
// (process scale) fails after a successful name update, the handler returns
// HTTP 200 with a _meta.errors envelope describing the failed operation, and
// still reports the app guid for the successful fields.
func TestPatchApp_PartialFailure_ReturnsMetaErrors(t *testing.T) {
	appUpdates := 0
	processLists := 0
	scaleCalls := 0
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/apps/app-1" && r.Method == http.MethodPatch:
			appUpdates++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"guid":"app-1","name":"ok"}`))
		case r.URL.Path == "/v3/processes" && r.Method == http.MethodGet:
			processLists++
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"pagination":{"total_results":1,"total_pages":1},"resources":[{"guid":"proc-web","type":"web"}]}`))
		case r.URL.Path == "/v3/processes/proc-web/actions/scale" && r.Method == http.MethodPost:
			scaleCalls++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnprocessableEntity)
			w.Write([]byte(`{"errors":[{"code":10008,"title":"CF-UnprocessableEntity","detail":"memory exceeds quota"}]}`))
		default:
			http.NotFound(w, r)
		}
	})

	rec, err := patchAppHelper(t, handler, `{"name":"ok","memory":99999}`)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, appUpdates)
	assert.GreaterOrEqual(t, scaleCalls, 1)

	var resp struct {
		GUID string `json:"guid"`
		Meta *struct {
			Errors []struct {
				Scope    string   `json:"scope"`
				Code     string   `json:"code"`
				Title    string   `json:"title"`
				Detail   string   `json:"detail"`
				Affected []string `json:"affected"`
			} `json:"errors"`
		} `json:"_meta"`
	}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, "app-1", resp.GUID)
	require.NotNil(t, resp.Meta, "expected _meta envelope after scale failure")
	require.NotEmpty(t, resp.Meta.Errors, "expected at least one error entry")
	e0 := resp.Meta.Errors[0]
	assert.Equal(t, "envelope", e0.Scope)
	assert.Contains(t, e0.Affected, "memory")
	assert.Contains(t, e0.Title, "UnprocessableEntity")
}

// TestDeleteAppInstance_CallsCapiInstanceDelete verifies the handler looks up
// the web process for the app, then issues a DELETE to
// /v3/processes/{procGuid}/instances/{index}. The capi library exposes the
// process-scoped termination path (not the /v3/apps/{guid}/processes/web/...
// convenience path) and returns nil on 204 No Content; the handler surfaces
// that as 204 to the Stratos caller.
func TestDeleteAppInstance_CallsCapiInstanceDelete(t *testing.T) {
	processLists := 0
	terminateCalls := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/processes" && r.Method == http.MethodGet:
			processLists++
			assert.Equal(t, "app-1", r.URL.Query().Get("app_guids"))
			assert.Equal(t, "web", r.URL.Query().Get("types"))
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"pagination":{"total_results":1,"total_pages":1},"resources":[{"guid":"proc-web","type":"web"}]}`))
		case r.URL.Path == "/v3/processes/proc-web/instances/2" && r.Method == http.MethodDelete:
			terminateCalls++
			w.WriteHeader(http.StatusNoContent)
		default:
			http.NotFound(w, r)
		}
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/apps/cnsi-1/app-1/instances/2", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/instances/:index")
	c.SetParamNames("cnsiGuid", "appGuid", "index")
	c.SetParamValues("cnsi-1", "app-1", "2")

	require.NoError(t, plugin.deleteAppInstance(c))
	assert.Equal(t, http.StatusNoContent, rec.Code)
	assert.Equal(t, 1, processLists)
	assert.Equal(t, 1, terminateCalls)
}

// TestDeleteAppInstance_PropagatesCapiError verifies that when the upstream
// CAPI call returns a non-2xx envelope (e.g. an invalid instance index) the
// handler classifies it via handleCapiError and surfaces the CF error body.
func TestDeleteAppInstance_PropagatesCapiError(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/processes" && r.Method == http.MethodGet:
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"pagination":{"total_results":1,"total_pages":1},"resources":[{"guid":"proc-web","type":"web"}]}`))
		case r.URL.Path == "/v3/processes/proc-web/instances/99" && r.Method == http.MethodDelete:
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`{"errors":[{"code":10010,"title":"CF-ResourceNotFound","detail":"Instance not found"}]}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/apps/cnsi-1/app-1/instances/99", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/instances/:index")
	c.SetParamNames("cnsiGuid", "appGuid", "index")
	c.SetParamValues("cnsi-1", "app-1", "99")

	require.NoError(t, plugin.deleteAppInstance(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
	assert.Contains(t, rec.Body.String(), "ResourceNotFound")
}

// TestAssignRouteToApp_PostsDestination verifies the handler issues a
// POST to /v3/routes/{routeGuid}/destinations with the app guid wrapped in
// the CAPI v3 destinations envelope. CF returns 200 OK with the updated
// destinations list; the Stratos-shape handler mirrors that status.
func TestAssignRouteToApp_PostsDestination(t *testing.T) {
	destinationsHit := 0
	var receivedBody struct {
		Destinations []struct {
			App struct {
				GUID string `json:"guid"`
			} `json:"app"`
		} `json:"destinations"`
	}
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/routes/route-1/destinations" && r.Method == http.MethodPost:
			destinationsHit++
			_ = json.NewDecoder(r.Body).Decode(&receivedBody)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"destinations":[{"guid":"dest-1","app":{"guid":"app-1"}}],"links":{}}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/pp/v1/cf/apps/cnsi-1/app-1/routes/route-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/routes/:routeGuid")
	c.SetParamNames("cnsiGuid", "appGuid", "routeGuid")
	c.SetParamValues("cnsi-1", "app-1", "route-1")

	require.NoError(t, plugin.assignRouteToApp(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, destinationsHit)
	require.Len(t, receivedBody.Destinations, 1)
	assert.Equal(t, "app-1", receivedBody.Destinations[0].App.GUID)
}

// TestAssignRouteToApp_PropagatesCapiError verifies that a CAPI 422 envelope
// (e.g. the app is in a different space than the route) is preserved via
// handleCapiError with the CF error body surfaced to the caller.
func TestAssignRouteToApp_PropagatesCapiError(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/routes/route-1/destinations" && r.Method == http.MethodPost:
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnprocessableEntity)
			w.Write([]byte(`{"errors":[{"code":10008,"title":"CF-UnprocessableEntity","detail":"app and route are in different spaces"}]}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/pp/v1/cf/apps/cnsi-1/app-1/routes/route-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/routes/:routeGuid")
	c.SetParamNames("cnsiGuid", "appGuid", "routeGuid")
	c.SetParamValues("cnsi-1", "app-1", "route-1")

	require.NoError(t, plugin.assignRouteToApp(c))
	assert.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	assert.Contains(t, rec.Body.String(), "UnprocessableEntity")
}

// TestDeleteAppInstance_RejectsNonIntegerIndex ensures a non-numeric index is
// rejected with 400 before any upstream call is attempted. The capi library
// expects an int, so we parse up-front.
func TestDeleteAppInstance_RejectsNonIntegerIndex(t *testing.T) {
	capiCalls := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capiCalls++
		w.WriteHeader(http.StatusOK)
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/apps/cnsi-1/app-1/instances/not-a-number", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/instances/:index")
	c.SetParamNames("cnsiGuid", "appGuid", "index")
	c.SetParamValues("cnsi-1", "app-1", "not-a-number")

	err := plugin.deleteAppInstance(c)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok, "expected *echo.HTTPError, got %T", err)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
	assert.Equal(t, 0, capiCalls, "no upstream call should be made for a bad index")
}

// TestRollbackApp_NoTrackerReturns503 mirrors TestRestageApp_NoTrackerReturns503.
// Without the asyncTracker / rollbackTranslator wired up the handler must
// reject the request before any state-machine work happens.
func TestRollbackApp_NoTrackerReturns503(t *testing.T) {
	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL("https://cf.example.com")},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1/cf/apps/cnsi-1/app-1/rollback",
		strings.NewReader(`{"revisionGuid":"rev-1"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/rollback")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")

	err := plugin.rollbackApp(c, "cnsi-1", "app-1")
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusServiceUnavailable, httpErr.Code)
}

// TestRollbackApp_RejectsMissingRevisionGuid guards the wire shape: the
// handler refuses a request without the required revisionGuid before
// reaching the orchestrator.
func TestRollbackApp_RejectsMissingRevisionGuid(t *testing.T) {
	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL("https://cf.example.com")},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
		asyncTracker: stratosjobs.NewInMemoryTracker(stratosjobs.InMemoryTrackerConfig{}),
	}
	plugin.rollbackTranslator = NewRollbackJobTranslator(plugin)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1/cf/apps/cnsi-1/app-1/rollback",
		strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/rollback")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")

	err := plugin.rollbackApp(c, "cnsi-1", "app-1")
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
	assert.Contains(t, fmt.Sprintf("%v", httpErr.Message), "revisionGuid is required")
}

// TestRollbackApp_RejectsInvalidStrategy mirrors restage's strategy
// validation: only "rolling" and "canary" are accepted (default
// "rolling" is applied when the field is absent).
func TestRollbackApp_RejectsInvalidStrategy(t *testing.T) {
	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL("https://cf.example.com")},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
		asyncTracker: stratosjobs.NewInMemoryTracker(stratosjobs.InMemoryTrackerConfig{}),
	}
	plugin.rollbackTranslator = NewRollbackJobTranslator(plugin)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1/cf/apps/cnsi-1/app-1/rollback",
		strings.NewReader(`{"revisionGuid":"rev-1","strategy":"voodoo"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/rollback")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")

	err := plugin.rollbackApp(c, "cnsi-1", "app-1")
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
}

// TestRollbackApp_FastPathResolvesOnDeploymentRejected exercises the
// orchestrator end-to-end through the rollback handler when CF rejects
// /v3/deployments with 422. Mirror of
// TestRestageApp_FastPathResolvesOnNoEligiblePackage — the fast-path
// window resolves before handoff and the handler returns 502 with the
// FAILED envelope.
func TestRollbackApp_FastPathResolvesOnDeploymentRejected(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/deployments":
			w.WriteHeader(http.StatusUnprocessableEntity)
			_, _ = w.Write([]byte(`{"errors":[{"detail":"revision not found","title":"CF-ResourceNotFound","code":10010}]}`))
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
		asyncTracker: stratosjobs.NewInMemoryTracker(stratosjobs.InMemoryTrackerConfig{}),
	}
	plugin.rollbackTranslator = NewRollbackJobTranslator(plugin)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1/cf/apps/cnsi-1/app-1/rollback",
		strings.NewReader(`{"revisionGuid":"rev-bogus"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/rollback")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")

	require.NoError(t, plugin.rollbackApp(c, "cnsi-1", "app-1"))
	assert.Equal(t, http.StatusBadGateway, rec.Code)

	var body map[string]interface{}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
	assert.Equal(t, string(stratosjobs.JobStateFailed), body["state"])
	errs, ok := body["errors"].([]interface{})
	require.True(t, ok)
	require.Len(t, errs, 1)
	errObj := errs[0].(map[string]interface{})
	assert.Equal(t, "stratos.rollback.deployment_create", errObj["code"])
}

// TestRestageApp_RollingFastPathReachesDeployment exercises the
// strategy=rolling path end-to-end through the restage handler. The
// orchestrator should walk package_lookup → build_create → build_poll →
// deployment_create (skipping set_droplet/stop/start for rolling) and
// resolve to COMPLETE on FINALIZED+DEPLOYED — proving the strategy fork
// in advanceBuildPoll routes correctly through the handler boundary.
func TestRestageApp_RollingFastPathReachesDeployment(t *testing.T) {
	deploymentCreated := false
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/packages":
			_, _ = w.Write([]byte(`{"pagination":{"total_results":1,"total_pages":1},"resources":[{"guid":"pkg-1","state":"READY"}]}`))
		case r.URL.Path == "/v3/builds" && r.Method == http.MethodPost:
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":    "build-1",
				"state":   "STAGED",
				"droplet": map[string]string{"guid": "droplet-1"},
			})
		case r.URL.Path == "/v3/builds/build-1":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":    "build-1",
				"state":   "STAGED",
				"droplet": map[string]string{"guid": "droplet-1"},
			})
		case r.URL.Path == "/v3/deployments" && r.Method == http.MethodPost:
			deploymentCreated = true
			w.WriteHeader(http.StatusAccepted)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "dep-1",
				"status": map[string]interface{}{
					"value":  "FINALIZED",
					"reason": "DEPLOYED",
				},
			})
		case r.URL.Path == "/v3/deployments/dep-1":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "dep-1",
				"status": map[string]interface{}{
					"value":  "FINALIZED",
					"reason": "DEPLOYED",
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
		asyncTracker: stratosjobs.NewInMemoryTracker(stratosjobs.InMemoryTrackerConfig{}),
	}
	plugin.restageTranslator = NewRestageJobTranslator(plugin)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1/cf/apps/cnsi-1/app-1/actions/restage",
		strings.NewReader(`{"strategy":"rolling"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/actions/:action")
	c.SetParamNames("cnsiGuid", "appGuid", "action")
	c.SetParamValues("cnsi-1", "app-1", "restage")

	require.NoError(t, plugin.appAction(c))
	assert.Equal(t, http.StatusOK, rec.Code, "rolling restage should fast-path resolve to COMPLETE")
	assert.True(t, deploymentCreated, "rolling strategy must POST /v3/deployments")

	var body map[string]interface{}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
	assert.Equal(t, string(stratosjobs.JobStateComplete), body["state"])
}

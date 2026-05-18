// src/jetstream/plugins/cloudfoundry/native_apps_detail_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// fakeAppDetailServer wires a CF v3 fake that responds to every endpoint
// the detail handler fans out to. Each callback may be left nil to use a
// sensible default; setting one to return 4xx exercises the per-source
// failure path.
type fakeAppDetailServer struct {
	appJSON          string
	processJSON      string
	dropletJSON      string
	packagesJSON     string
	buildsJSON       string
	sshFeatureJSON   string
	envJSON          string
	spaceJSON        string
	orgJSON          string
	dropletStatus    int
	packagesStatus   int
	buildsStatus     int
	sshFeatureStatus int
	spaceStatus      int
	orgStatus        int
}

func newAppDetailServer(t *testing.T, cfg fakeAppDetailServer) *httptest.Server {
	t.Helper()
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		path := r.URL.Path
		switch {
		case path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case path == "/v3/apps/app-1":
			_, _ = w.Write([]byte(cfg.appJSON))
		case path == "/v3/processes":
			// list-processes filtered by app_guids+types=web
			_, _ = w.Write([]byte(cfg.processJSON))
		case path == "/v3/apps/app-1/droplets/current":
			if cfg.dropletStatus != 0 {
				w.WriteHeader(cfg.dropletStatus)
				return
			}
			_, _ = w.Write([]byte(cfg.dropletJSON))
		case path == "/v3/packages":
			if cfg.packagesStatus != 0 {
				w.WriteHeader(cfg.packagesStatus)
				return
			}
			_, _ = w.Write([]byte(cfg.packagesJSON))
		case path == "/v3/builds":
			if cfg.buildsStatus != 0 {
				w.WriteHeader(cfg.buildsStatus)
				return
			}
			_, _ = w.Write([]byte(cfg.buildsJSON))
		case strings.HasPrefix(path, "/v3/apps/app-1/features/ssh"):
			if cfg.sshFeatureStatus != 0 {
				w.WriteHeader(cfg.sshFeatureStatus)
				return
			}
			_, _ = w.Write([]byte(cfg.sshFeatureJSON))
		case path == "/v3/apps/app-1/env":
			_, _ = w.Write([]byte(cfg.envJSON))
		case path == "/v3/spaces/space-1":
			if cfg.spaceStatus != 0 {
				w.WriteHeader(cfg.spaceStatus)
				return
			}
			_, _ = w.Write([]byte(cfg.spaceJSON))
		case path == "/v3/organizations/org-1":
			if cfg.orgStatus != 0 {
				w.WriteHeader(cfg.orgStatus)
				return
			}
			_, _ = w.Write([]byte(cfg.orgJSON))
		default:
			http.NotFound(w, r)
		}
	})
	return httptest.NewServer(mux)
}

const (
	stubAppJSON = `{
		"guid":"app-1","name":"my-app","state":"STARTED",
		"relationships":{"space":{"data":{"guid":"space-1"}}},
		"lifecycle":{"type":"buildpack","data":{"stack":"cflinuxfs4"}},
		"created_at":"2024-01-01T00:00:00Z","updated_at":"2024-01-02T00:00:00Z"
	}`

	stubProcessJSON = `{
		"pagination":{"total_results":1,"total_pages":1},
		"resources":[{
			"guid":"proc-1","type":"web","instances":3,
			"memory_in_mb":256,"disk_in_mb":1024,
			"command":"bundle exec rails s",
			"health_check":{"type":"port","data":{"timeout":30}}
		}]
	}`

	stubDropletJSON = `{
		"guid":"droplet-1","state":"STAGED",
		"lifecycle":{"type":"buildpack","data":{"stack":"cflinuxfs4"}},
		"buildpacks":[{"name":"ruby_buildpack","detect_output":"ruby","version":"1.8.0"}],
		"created_at":"2024-01-01T00:00:00Z","updated_at":"2024-01-01T00:01:00Z"
	}`

	stubPackagesJSON = `{
		"pagination":{"total_results":1,"total_pages":1},
		"resources":[{
			"guid":"pkg-1","state":"READY","type":"bits",
			"created_at":"2024-01-01T00:00:00Z","updated_at":"2024-01-01T00:00:30Z"
		}]
	}`

	stubBuildsJSON = `{
		"pagination":{"total_results":1,"total_pages":1},
		"resources":[{
			"guid":"build-1","state":"STAGED",
			"created_at":"2024-01-01T00:00:00Z","updated_at":"2024-01-01T00:01:00Z"
		}]
	}`

	stubSSHFeatureJSON = `{"name":"ssh","enabled":true}`

	stubEnvJSON = `{
		"environment_variables":{"FOO":"bar","NUM":42},
		"system_env_json":{"VCAP_SERVICES":{}},
		"application_env_json":{"VCAP_APPLICATION":{"name":"my-app"}},
		"running_env_json":{},
		"staging_env_json":{}
	}`

	stubSpaceJSON = `{
		"guid":"space-1","name":"my-space",
		"relationships":{"organization":{"data":{"guid":"org-1"}}},
		"created_at":"2024-01-01T00:00:00Z","updated_at":"2024-01-02T00:00:00Z"
	}`

	stubOrgJSON = `{
		"guid":"org-1","name":"my-org",
		"created_at":"2024-01-01T00:00:00Z","updated_at":"2024-01-02T00:00:00Z"
	}`
)

// withSpec wires a CloudFoundrySpecification with a mock proxy pointed at
// the fake CF server.
func withSpec(t *testing.T, ts *httptest.Server) *CloudFoundrySpecification {
	t.Helper()
	return &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}
}

func newDetailRequest(t *testing.T, returnMode string) (*httptest.ResponseRecorder, echo.Context) {
	t.Helper()
	e := echo.New()
	url := "/pp/v1/cf/apps/cnsi-1/app-1"
	if returnMode != "" {
		url += "?return=" + returnMode
	}
	req := httptest.NewRequest(http.MethodGet, url, nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "appGuid")
	ctx.SetParamValues("cnsi-1", "app-1")
	return rec, ctx
}

// -------- Default mode (no return param) --------

func TestGetNativeAppDetail_DefaultModeReturnsBasicStApp(t *testing.T) {
	ts := newAppDetailServer(t, fakeAppDetailServer{appJSON: stubAppJSON})
	defer ts.Close()

	rec, ctx := newDetailRequest(t, "")
	require.NoError(t, withSpec(t, ts).getNativeAppDetail(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var got StApp
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&got))
	assert.Equal(t, "app-1", got.GUID)
	assert.Equal(t, "my-app", got.Name)
	assert.Equal(t, "STARTED", got.State)
	assert.Equal(t, "cflinuxfs4", got.StackName)
	// default mode does NOT compose process — memory/disk/instances stay zero/nil
	assert.Nil(t, got.Memory)
	assert.Nil(t, got.DiskQuota)
	assert.Equal(t, 0, got.Instances)
}

func TestGetNativeAppDetail_DefaultModeStitchesSpaceAndOrg(t *testing.T) {
	ts := newAppDetailServer(t, fakeAppDetailServer{
		appJSON:   stubAppJSON,
		spaceJSON: stubSpaceJSON,
		orgJSON:   stubOrgJSON,
	})
	defer ts.Close()

	rec, ctx := newDetailRequest(t, "")
	require.NoError(t, withSpec(t, ts).getNativeAppDetail(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var got StApp
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&got))
	assert.Equal(t, "space-1", got.SpaceGUID)
	assert.Equal(t, "my-space", got.SpaceName)
	require.NotNil(t, got.OrgGUID)
	assert.Equal(t, "org-1", *got.OrgGUID)
	assert.Equal(t, "my-org", got.OrgName)
}

func TestGetNativeAppDetail_DefaultModeSpaceFetchFailureKeepsAppFields(t *testing.T) {
	// Space lookup 5xx — stitch silently degrades, base app still returned.
	ts := newAppDetailServer(t, fakeAppDetailServer{
		appJSON:     stubAppJSON,
		spaceStatus: http.StatusInternalServerError,
	})
	defer ts.Close()

	rec, ctx := newDetailRequest(t, "")
	require.NoError(t, withSpec(t, ts).getNativeAppDetail(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var got StApp
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&got))
	assert.Equal(t, "app-1", got.GUID)
	assert.Equal(t, "space-1", got.SpaceGUID) // from app.relationships, no fetch needed
	assert.Empty(t, got.SpaceName)
	assert.Nil(t, got.OrgGUID)
	assert.Empty(t, got.OrgName)
}

// -------- ?return=summary --------

func TestGetNativeAppDetail_SummaryModeAddsProcessFields(t *testing.T) {
	ts := newAppDetailServer(t, fakeAppDetailServer{
		appJSON:     stubAppJSON,
		processJSON: stubProcessJSON,
	})
	defer ts.Close()

	rec, ctx := newDetailRequest(t, "summary")
	require.NoError(t, withSpec(t, ts).getNativeAppDetail(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var got StApp
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&got))
	assert.Equal(t, "app-1", got.GUID)
	require.NotNil(t, got.Memory)
	assert.Equal(t, 256, *got.Memory)
	require.NotNil(t, got.DiskQuota)
	assert.Equal(t, 1024, *got.DiskQuota)
	assert.Equal(t, 3, got.Instances)
}

// -------- ?return=details (full envelope, all sources OK) --------

func TestGetNativeAppDetail_DetailsModeHappyPath(t *testing.T) {
	ts := newAppDetailServer(t, fakeAppDetailServer{
		appJSON:        stubAppJSON,
		processJSON:    stubProcessJSON,
		dropletJSON:    stubDropletJSON,
		packagesJSON:   stubPackagesJSON,
		buildsJSON:     stubBuildsJSON,
		sshFeatureJSON: stubSSHFeatureJSON,
	})
	defer ts.Close()

	rec, ctx := newDetailRequest(t, "details")
	require.NoError(t, withSpec(t, ts).getNativeAppDetail(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var got StAppDetail
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&got))

	assert.Equal(t, "app-1", got.App.GUID)
	require.NotNil(t, got.App.Memory)
	assert.Equal(t, 256, *got.App.Memory)

	require.NotNil(t, got.Process)
	assert.Equal(t, "proc-1", got.Process.GUID)
	assert.Equal(t, 256, got.Process.MemoryMB)

	require.NotNil(t, got.Droplet)
	assert.Equal(t, "STAGED", got.Droplet.State)
	assert.Equal(t, "cflinuxfs4", got.Droplet.Stack)
	require.Len(t, got.Droplet.Buildpacks, 1)
	assert.Equal(t, "ruby_buildpack", got.Droplet.Buildpacks[0].Name)

	require.NotNil(t, got.Pkg)
	assert.Equal(t, "READY", got.Pkg.State)
	assert.Equal(t, "bits", got.Pkg.Type)

	require.NotNil(t, got.Build)
	assert.Equal(t, "STAGED", got.Build.State)

	assert.True(t, got.SSHEnabled)

	// No source failed → no _meta.unavailable
	assert.Nil(t, got.Meta)
}

// -------- ?return=details with missing droplet (unstaged app) --------

func TestGetNativeAppDetail_DetailsModeMissingDropletSurfacesUnavailable(t *testing.T) {
	ts := newAppDetailServer(t, fakeAppDetailServer{
		appJSON:        stubAppJSON,
		processJSON:    stubProcessJSON,
		dropletStatus:  http.StatusNotFound,
		packagesJSON:   stubPackagesJSON,
		buildsJSON:     stubBuildsJSON,
		sshFeatureJSON: stubSSHFeatureJSON,
	})
	defer ts.Close()

	rec, ctx := newDetailRequest(t, "details")
	require.NoError(t, withSpec(t, ts).getNativeAppDetail(ctx))
	// 404 on a sub-resource is NOT a route-level failure — envelope still 200.
	assert.Equal(t, http.StatusOK, rec.Code)

	var got StAppDetail
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&got))
	assert.Nil(t, got.Droplet)

	// _meta.unavailable should mention droplet-derived fields
	require.NotNil(t, got.Meta)
	require.NotNil(t, got.Meta.Unavailable)
	joined := strings.Join(got.Meta.Unavailable, ",")
	assert.Contains(t, joined, "droplet")
	assert.Contains(t, joined, "stack")
}

// -------- /env handler --------

func TestGetNativeAppEnv_ReturnsStEnvVars(t *testing.T) {
	ts := newAppDetailServer(t, fakeAppDetailServer{envJSON: stubEnvJSON})
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/cnsi-1/app-1/env", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "appGuid")
	ctx.SetParamValues("cnsi-1", "app-1")

	require.NoError(t, withSpec(t, ts).getNativeAppEnv(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var got StEnvVars
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&got))
	assert.Equal(t, "bar", got.Environment["FOO"])
	// env var values keep their typed shape (number, not stringified)
	assert.EqualValues(t, 42, got.Environment["NUM"])
	require.NotNil(t, got.SystemProvided)
	assert.NotNil(t, got.ApplicationProvided)
}

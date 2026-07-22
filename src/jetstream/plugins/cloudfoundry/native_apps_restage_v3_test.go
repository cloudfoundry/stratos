// src/jetstream/plugins/cloudfoundry/native_apps_restage_v3_test.go
package cloudfoundry

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/fivetwenty-io/capi/v3/pkg/cfclient"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestGetNewestReadyPackage_HappyPath verifies the helper issues a single
// /v3/packages list query filtered to the target app and the READY state,
// ordered descending by created_at with per_page=1, and returns the first
// resource's GUID.
func TestGetNewestReadyPackage_HappyPath(t *testing.T) {
	var capturedQuery string
	var capturedPath string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/packages":
			capturedPath = r.URL.Path
			capturedQuery = r.URL.RawQuery
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid":  "pkg-newest",
						"state": "READY",
						"type":  "bits",
					},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	pkgGUID, err := getNewestReadyPackage(ctx, client, "app-1")
	require.NoError(t, err)
	assert.Equal(t, "pkg-newest", pkgGUID)
	assert.Equal(t, "/v3/packages", capturedPath)
	assert.Contains(t, capturedQuery, "app_guids=app-1")
	assert.Contains(t, capturedQuery, "states=READY")
	assert.Contains(t, capturedQuery, "order_by=-created_at")
	assert.Contains(t, capturedQuery, "per_page=1")
}

// TestGetNewestReadyPackage_NoEligiblePackages verifies that an empty
// resources list (e.g. an app with no buildable package) surfaces
// errNoReadyPackage. The orchestrator treats this as a terminal failure.
func TestGetNewestReadyPackage_NoEligiblePackages(t *testing.T) {
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

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	pkgGUID, err := getNewestReadyPackage(ctx, client, "app-empty")
	require.ErrorIs(t, err, errNoReadyPackage)
	assert.Empty(t, pkgGUID)
}

// TestGetNewestReadyPackage_PropagatesUpstreamError verifies the helper
// returns the underlying error when CF responds with a non-success status,
// rather than masking it with errNoReadyPackage.
func TestGetNewestReadyPackage_PropagatesUpstreamError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/v3" {
			_, _ = w.Write([]byte(`{"links":{}}`))
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"errors":[{"code":10001,"title":"CF-ServerError","detail":"upstream broke"}]}`))
	}))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	pkgGUID, err := getNewestReadyPackage(ctx, client, "app-1")
	require.Error(t, err)
	require.NotErrorIs(t, err, errNoReadyPackage)
	assert.Empty(t, pkgGUID)
}

// TestCreateBuildForPackage_HappyPath verifies the helper POSTs to
// /v3/builds with the v3 BuildCreateRequest envelope, and returns the new
// build's GUID from the response body.
func TestCreateBuildForPackage_HappyPath(t *testing.T) {
	var capturedMethod string
	var capturedPath string
	var capturedBody map[string]interface{}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/builds":
			capturedMethod = r.Method
			capturedPath = r.URL.Path
			_ = json.NewDecoder(r.Body).Decode(&capturedBody)
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":  "build-new",
				"state": "STAGING",
				"package": map[string]interface{}{
					"guid": "pkg-1",
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	buildGUID, err := createBuildForPackage(ctx, client, "pkg-1")
	require.NoError(t, err)
	assert.Equal(t, "build-new", buildGUID)
	assert.Equal(t, http.MethodPost, capturedMethod)
	assert.Equal(t, "/v3/builds", capturedPath)

	pkg, ok := capturedBody["package"].(map[string]interface{})
	require.True(t, ok, "request body must include a package object: %v", capturedBody)
	assert.Equal(t, "pkg-1", pkg["guid"])
}

// TestCreateBuildForPackage_PropagatesError verifies the helper returns
// the upstream error rather than masking it. Build creation can fail
// when the package is not READY or the app is missing.
func TestCreateBuildForPackage_PropagatesError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/v3" {
			_, _ = w.Write([]byte(`{"links":{}}`))
			return
		}
		w.WriteHeader(http.StatusUnprocessableEntity)
		_, _ = w.Write([]byte(`{"errors":[{"code":10008,"title":"CF-UnprocessableEntity","detail":"Package state must be READY"}]}`))
	}))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	buildGUID, err := createBuildForPackage(ctx, client, "pkg-not-ready")
	require.Error(t, err)
	assert.Empty(t, buildGUID)
}

// stagingThenStaged returns a fake handler that walks a build through
// `staging` polls before flipping to STAGED. Counter increments per call
// to /v3/builds/<guid>.
func stagingThenStaged(staging int, dropletGUID string, callsOut *int) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/v3" {
			_, _ = w.Write([]byte(`{"links":{}}`))
			return
		}
		*callsOut++
		state := "STAGING"
		body := map[string]interface{}{
			"guid":  "build-1",
			"state": state,
		}
		if *callsOut > staging {
			body["state"] = "STAGED"
			body["droplet"] = map[string]interface{}{"guid": dropletGUID}
		}
		_ = json.NewEncoder(w).Encode(body)
	}
}

// TestPollBuildUntilTerminal_ReturnsStagedBuild verifies the helper
// polls until the build reports STAGED, then returns it with the
// droplet GUID populated.
func TestPollBuildUntilTerminal_ReturnsStagedBuild(t *testing.T) {
	calls := 0
	srv := httptest.NewServer(stagingThenStaged(2, "droplet-newest", &calls))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	build, err := pollBuildUntilTerminal(ctx, client, "build-1", time.Millisecond)
	require.NoError(t, err)
	require.NotNil(t, build)
	assert.Equal(t, "STAGED", build.State)
	require.NotNil(t, build.Droplet)
	assert.Equal(t, "droplet-newest", build.Droplet.GUID)
	assert.GreaterOrEqual(t, calls, 3, "expected at least 3 polls (two STAGING + one STAGED)")
}

// TestPollBuildUntilTerminal_FailedReturnsErrBuildFailed verifies a
// FAILED state surfaces errBuildFailed and preserves CF's error string
// on the returned build for caller diagnostics.
func TestPollBuildUntilTerminal_FailedReturnsErrBuildFailed(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/v3" {
			_, _ = w.Write([]byte(`{"links":{}}`))
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"guid":  "build-fail",
			"state": "FAILED",
			"error": "NoAppDetectedError - An app was not successfully detected by any available buildpack",
		})
	}))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	build, err := pollBuildUntilTerminal(ctx, client, "build-fail", time.Millisecond)
	require.ErrorIs(t, err, errBuildFailed)
	require.NotNil(t, build)
	assert.Equal(t, "FAILED", build.State)
	require.NotNil(t, build.Error)
	assert.Contains(t, *build.Error, "NoAppDetectedError")
}

// TestSetCurrentDroplet_PatchesRelationship verifies the helper PATCHes
// /v3/apps/<a>/relationships/current_droplet with a v3 relationship body.
func TestSetCurrentDroplet_PatchesRelationship(t *testing.T) {
	var capturedMethod string
	var capturedPath string
	var capturedBody map[string]interface{}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/apps/app-1/relationships/current_droplet":
			capturedMethod = r.Method
			capturedPath = r.URL.Path
			_ = json.NewDecoder(r.Body).Decode(&capturedBody)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"data": map[string]interface{}{"guid": "droplet-target"},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	require.NoError(t, setCurrentDroplet(ctx, client, "app-1", "droplet-target"))
	assert.Equal(t, http.MethodPatch, capturedMethod)
	assert.Equal(t, "/v3/apps/app-1/relationships/current_droplet", capturedPath)

	data, ok := capturedBody["data"].(map[string]interface{})
	require.True(t, ok, "request body must include a data object: %v", capturedBody)
	assert.Equal(t, "droplet-target", data["guid"])
}

// TestSetCurrentDroplet_PropagatesError verifies upstream failures
// surface unmodified — relevant for rollback when the supplied droplet
// GUID belongs to a different app or no longer exists.
func TestSetCurrentDroplet_PropagatesError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/v3" {
			_, _ = w.Write([]byte(`{"links":{}}`))
			return
		}
		w.WriteHeader(http.StatusUnprocessableEntity)
		_, _ = w.Write([]byte(`{"errors":[{"code":10008,"title":"CF-UnprocessableEntity","detail":"Droplet must belong to the requested app"}]}`))
	}))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	err = setCurrentDroplet(ctx, client, "app-1", "droplet-from-other-app")
	require.Error(t, err)
}

// TestStopApp_PostsActionAndReturnsJob verifies the helper POSTs to the
// v3 stop action endpoint and surfaces the v3 job GUID from the
// Location header (the fork's documented behavior for /actions/stop).
func TestStopApp_PostsActionAndReturnsJob(t *testing.T) {
	var capturedMethod string
	var capturedPath string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/apps/app-1/actions/stop":
			capturedMethod = r.Method
			capturedPath = r.URL.Path
			w.Header().Set("Location", "/v3/jobs/stop-job-7")
			w.WriteHeader(http.StatusAccepted)
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	job, err := stopApp(ctx, client, "app-1")
	require.NoError(t, err)
	require.NotNil(t, job)
	assert.Equal(t, "stop-job-7", job.GUID)
	assert.Equal(t, http.MethodPost, capturedMethod)
	assert.Equal(t, "/v3/apps/app-1/actions/stop", capturedPath)
}

// TestGetWebProcessGUID_HappyPath verifies the helper queries
// /v3/processes filtered to the target app + type=web and returns the
// first resource's GUID.
func TestGetWebProcessGUID_HappyPath(t *testing.T) {
	var capturedQuery string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/processes":
			capturedQuery = r.URL.RawQuery
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					{"guid": "proc-web-1", "type": "web"},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	procGUID, err := getWebProcessGUID(ctx, client, "app-1")
	require.NoError(t, err)
	assert.Equal(t, "proc-web-1", procGUID)
	assert.Contains(t, capturedQuery, "app_guids=app-1")
	assert.Contains(t, capturedQuery, "types=web")
	assert.Contains(t, capturedQuery, "per_page=1")
}

// TestGetWebProcessGUID_NoWebProcess verifies an app with no web
// process surfaces errNoWebProcess.
func TestGetWebProcessGUID_NoWebProcess(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/v3" {
			_, _ = w.Write([]byte(`{"links":{}}`))
			return
		}
		_, _ = w.Write([]byte(`{"pagination":{"total_results":0,"total_pages":0},"resources":[]}`))
	}))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	procGUID, err := getWebProcessGUID(ctx, client, "task-only-app")
	require.ErrorIs(t, err, errNoWebProcess)
	assert.Empty(t, procGUID)
}

// statsHandler is a fake /v3/processes/{guid}/stats handler that
// returns a sequence of instance-state snapshots, one per call. Once
// the sequence is exhausted, the last snapshot is repeated.
func statsHandler(snapshots [][]string, callsOut *int) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/v3" {
			_, _ = w.Write([]byte(`{"links":{}}`))
			return
		}
		idx := *callsOut
		*callsOut++
		if idx >= len(snapshots) {
			idx = len(snapshots) - 1
		}
		states := snapshots[idx]
		resources := make([]map[string]interface{}, 0, len(states))
		for i, s := range states {
			resources = append(resources, map[string]interface{}{
				"type": "web", "index": i, "state": s,
			})
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"resources": resources,
		})
	}
}

// TestPollInstancesUntilRunning_AllRunningReturnsNil verifies the loop
// exits successfully once every instance reports RUNNING.
func TestPollInstancesUntilRunning_AllRunningReturnsNil(t *testing.T) {
	calls := 0
	srv := httptest.NewServer(statsHandler([][]string{
		{"STARTING", "STARTING"},
		{"RUNNING", "STARTING"},
		{"RUNNING", "RUNNING"},
	}, &calls))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	require.NoError(t, pollInstancesUntilRunning(ctx, client, "proc-1", false, time.Millisecond))
	assert.GreaterOrEqual(t, calls, 3)
}

// TestPollInstancesUntilRunning_NoWaitShortCircuits verifies that with
// noWait=true the loop exits as soon as one instance is RUNNING, even
// if peers are still STARTING.
func TestPollInstancesUntilRunning_NoWaitShortCircuits(t *testing.T) {
	calls := 0
	srv := httptest.NewServer(statsHandler([][]string{
		{"STARTING", "STARTING"},
		{"RUNNING", "STARTING"},
	}, &calls))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	require.NoError(t, pollInstancesUntilRunning(ctx, client, "proc-1", true, time.Millisecond))
	assert.Equal(t, 2, calls, "no-wait should exit on the first poll showing a RUNNING instance")
}

// TestPollInstancesUntilRunning_AllCrashedFailsFast verifies the loop
// returns errAllInstancesCrashed when every non-DOWN instance is in
// CRASHED state, rather than blocking until CF_STARTUP_TIMEOUT.
func TestPollInstancesUntilRunning_AllCrashedFailsFast(t *testing.T) {
	calls := 0
	srv := httptest.NewServer(statsHandler([][]string{
		{"CRASHED", "CRASHED"},
	}, &calls))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	err = pollInstancesUntilRunning(ctx, client, "proc-1", false, time.Millisecond)
	require.ErrorIs(t, err, errAllInstancesCrashed)
}

// TestPollInstancesUntilRunning_HonorsContextCancellation verifies that
// stuck STARTING instances honor the deadline imposed by the caller
// (the CF_STARTUP_TIMEOUT contract).
func TestPollInstancesUntilRunning_HonorsContextCancellation(t *testing.T) {
	calls := 0
	srv := httptest.NewServer(statsHandler([][]string{
		{"STARTING", "STARTING"},
	}, &calls))
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)
	defer cancel()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	err = pollInstancesUntilRunning(ctx, client, "proc-1", false, 5*time.Millisecond)
	require.Error(t, err)
	assert.True(t, errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled),
		"expected deadline exceeded or canceled, got %v", err)
}

// TestSummarizeInstanceStates_HandlesMixed verifies the summary helper
// distinguishes "some down + rest running" from "all crashed".
func TestSummarizeInstanceStates_HandlesMixed(t *testing.T) {
	t.Run("all_running", func(t *testing.T) {
		s := summarizeInstanceStates([]capi.ProcessStatsDetail{
			{State: "RUNNING"}, {State: "RUNNING"},
		})
		assert.True(t, s.allRunning)
		assert.True(t, s.someRunning)
		assert.False(t, s.allCrashed)
	})
	t.Run("none_running_yet", func(t *testing.T) {
		s := summarizeInstanceStates([]capi.ProcessStatsDetail{
			{State: "STARTING"}, {State: "STARTING"},
		})
		assert.False(t, s.allRunning)
		assert.False(t, s.someRunning)
		assert.False(t, s.allCrashed)
	})
	t.Run("all_crashed", func(t *testing.T) {
		s := summarizeInstanceStates([]capi.ProcessStatsDetail{
			{State: "CRASHED"}, {State: "CRASHED"},
		})
		assert.True(t, s.allCrashed)
		assert.False(t, s.allRunning)
	})
	t.Run("crashed_plus_down_still_crashed", func(t *testing.T) {
		// DOWN instances are scaled-down, not failures — so a mix of
		// DOWN + CRASHED with no RUNNING still trips allCrashed.
		s := summarizeInstanceStates([]capi.ProcessStatsDetail{
			{State: "DOWN"}, {State: "CRASHED"},
		})
		assert.True(t, s.allCrashed)
	})
	t.Run("empty", func(t *testing.T) {
		s := summarizeInstanceStates(nil)
		assert.False(t, s.allRunning)
		assert.False(t, s.someRunning)
		assert.False(t, s.allCrashed)
	})
}

// TestStartApp_PostsActionAndReturnsJob mirrors the stop test against
// the /actions/start endpoint.
func TestStartApp_PostsActionAndReturnsJob(t *testing.T) {
	var capturedPath string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/apps/app-1/actions/start":
			capturedPath = r.URL.Path
			w.Header().Set("Location", "/v3/jobs/start-job-9")
			w.WriteHeader(http.StatusAccepted)
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	job, err := startApp(ctx, client, "app-1")
	require.NoError(t, err)
	require.NotNil(t, job)
	assert.Equal(t, "start-job-9", job.GUID)
	assert.Equal(t, "/v3/apps/app-1/actions/start", capturedPath)
}

// TestPollBuildUntilTerminal_HonorsContextCancellation verifies that a
// context timeout interrupts the poll loop. Models the
// CF_STAGING_TIMEOUT contract — caller imposes a deadline; the helper
// returns ctx.Err() when it expires.
func TestPollBuildUntilTerminal_HonorsContextCancellation(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/v3" {
			_, _ = w.Write([]byte(`{"links":{}}`))
			return
		}
		// Always STAGING — the context must time out.
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"guid":  "build-stuck",
			"state": "STAGING",
		})
	}))
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)
	defer cancel()
	client, err := cfclient.NewWithToken(ctx, srv.URL, "test-token")
	require.NoError(t, err)

	build, err := pollBuildUntilTerminal(ctx, client, "build-stuck", 5*time.Millisecond)
	require.Error(t, err)
	assert.True(t, errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled),
		"expected deadline exceeded or canceled, got %v", err)
	assert.Nil(t, build)
}

// fixedClock returns a now() func that yields a deterministic, advancing
// timestamp on each call (10s per call). Tests use it to assert StartedAt
// vs EndedAt without sleeping.
func fixedClock() func() time.Time {
	base := time.Date(2026, 5, 1, 12, 0, 0, 0, time.UTC)
	calls := 0
	return func() time.Time {
		t := base.Add(time.Duration(calls) * 10 * time.Second)
		calls++
		return t
	}
}

// orchestratorTestClient builds a capi client wired to an httptest server.
// All orchestrator tests use this helper to keep the boilerplate per-test
// down to handler-shape only.
func orchestratorTestClient(t *testing.T, srv *httptest.Server) capi.Client {
	t.Helper()
	client, err := cfclient.NewWithToken(context.Background(), srv.URL, "test-token")
	require.NoError(t, err)
	return client
}

// rootHandler responds to the /v3 capability probe so cfclient.NewWithToken
// succeeds before the test-specific handler runs.
func rootHandler(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write([]byte(`{"links":{}}`))
}

func TestEnsureStageInProgress_AppendsRecordOnFirstCall(t *testing.T) {
	ref := &RestageRef{}
	now := fixedClock()
	rec := ensureStageInProgress(ref, StageRestagePackageLookup, now)
	require.NotNil(t, rec)
	require.Len(t, ref.Stages, 1)
	assert.Equal(t, StageRestagePackageLookup, ref.Stages[0].Stage)
	assert.Equal(t, StageStateInProgress, ref.Stages[0].State)
	assert.False(t, ref.Stages[0].StartedAt.IsZero())
}

func TestEnsureStageInProgress_IsIdempotent(t *testing.T) {
	ref := &RestageRef{}
	now := fixedClock()
	rec1 := ensureStageInProgress(ref, StageRestagePackageLookup, now)
	rec2 := ensureStageInProgress(ref, StageRestagePackageLookup, now)
	assert.Same(t, rec1, rec2)
	assert.Len(t, ref.Stages, 1)
}

func TestAdvanceRestage_PackageLookupAdvancesToBuildCreate(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/packages":
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources":  []map[string]interface{}{{"guid": "pkg-1", "state": "READY"}},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{AppGuid: "app-1", CurrentStage: StageRestagePackageLookup}
	state, errs, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Empty(t, errs)
	assert.Equal(t, stratosjobs.JobStateProcessing, state)
	assert.Equal(t, "pkg-1", ref.PackageGuid)
	assert.Equal(t, StageRestageBuildCreate, ref.CurrentStage)
	require.Len(t, ref.Stages, 1)
	assert.Equal(t, StageStateDone, ref.Stages[0].State)
}

func TestAdvanceRestage_PackageLookupNoEligiblePackageFailsTerminal(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/packages":
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"pagination":{"total_results":0,"total_pages":0},"resources":[]}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{AppGuid: "app-empty", CurrentStage: StageRestagePackageLookup}
	state, errs, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateFailed, state)
	require.Len(t, errs, 1)
	assert.Equal(t, "stratos.restage.package_lookup", errs[0].Code)
	require.Len(t, ref.Stages, 1)
	assert.Equal(t, StageStateFailed, ref.Stages[0].State)
	assert.Contains(t, ref.Stages[0].Error, "no READY package")
}

func TestAdvanceRestage_BuildCreateAdvancesToBuildPoll(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			rootHandler(w)
		case r.URL.Path == "/v3/builds" && r.Method == http.MethodPost:
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":  "build-1",
				"state": "STAGING",
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{
		AppGuid:      "app-1",
		PackageGuid:  "pkg-1",
		CurrentStage: StageRestageBuildCreate,
	}
	state, _, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateProcessing, state)
	assert.Equal(t, "build-1", ref.BuildGuid)
	assert.Equal(t, StageRestageBuildPoll, ref.CurrentStage)
}

func TestAdvanceRestage_BuildPollStagingStaysOnSameStage(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/builds/build-1":
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":  "build-1",
				"state": "STAGING",
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{
		AppGuid:      "app-1",
		BuildGuid:    "build-1",
		CurrentStage: StageRestageBuildPoll,
	}
	state, _, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateProcessing, state)
	assert.Equal(t, StageRestageBuildPoll, ref.CurrentStage)
	require.Len(t, ref.Stages, 1)
	assert.Equal(t, StageStateInProgress, ref.Stages[0].State)
}

func TestAdvanceRestage_BuildPollStagedAdvancesAndCapturesDroplet(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/builds/build-1":
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":    "build-1",
				"state":   "STAGED",
				"droplet": map[string]string{"guid": "droplet-1"},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{
		AppGuid:      "app-1",
		BuildGuid:    "build-1",
		CurrentStage: StageRestageBuildPoll,
	}
	state, _, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateProcessing, state)
	assert.Equal(t, "droplet-1", ref.DropletGuid)
	assert.Equal(t, StageRestageSetDroplet, ref.CurrentStage)
}

func TestAdvanceRestage_BuildPollFailedTerminalWithCfErrorMessage(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/builds/build-bad":
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":  "build-bad",
				"state": "FAILED",
				"error": "StagingError - no buildpack matched",
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{
		BuildGuid:    "build-bad",
		CurrentStage: StageRestageBuildPoll,
	}
	state, errs, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateFailed, state)
	require.Len(t, errs, 1)
	assert.Contains(t, errs[0].Message, "no buildpack matched")
}

func TestAdvanceRestage_SetDropletAdvancesToStop(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			rootHandler(w)
		case r.URL.Path == "/v3/apps/app-1/relationships/current_droplet" && r.Method == http.MethodPatch:
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"data": map[string]string{"guid": "droplet-1"},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{
		AppGuid:      "app-1",
		DropletGuid:  "droplet-1",
		CurrentStage: StageRestageSetDroplet,
	}
	state, _, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateProcessing, state)
	assert.Equal(t, StageRestageStop, ref.CurrentStage)
}

func TestAdvanceRestage_StopKicksAndAdvancesToStart(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			rootHandler(w)
		case r.URL.Path == "/v3/apps/app-1/actions/stop" && r.Method == http.MethodPost:
			w.Header().Set("Location", "/v3/jobs/stop-job-1")
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusAccepted)
			_, _ = w.Write([]byte(`{"guid":"app-1","state":"STOPPED"}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{AppGuid: "app-1", CurrentStage: StageRestageStop}
	state, _, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateProcessing, state)
	assert.Equal(t, StageRestageStart, ref.CurrentStage)
}

func TestAdvanceRestage_StartKicksAndAdvancesToInstancePoll(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			rootHandler(w)
		case r.URL.Path == "/v3/apps/app-1/actions/start" && r.Method == http.MethodPost:
			w.Header().Set("Location", "/v3/jobs/start-job-1")
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusAccepted)
			_, _ = w.Write([]byte(`{"guid":"app-1","state":"STARTED"}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{AppGuid: "app-1", CurrentStage: StageRestageStart}
	state, _, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateProcessing, state)
	assert.Equal(t, StageRestageInstancePoll, ref.CurrentStage)
}

// TestAdvanceRestage_InstancePollResolvesProcessOnFirstCall verifies the
// orchestrator caches the web-process GUID via /v3/processes lookup before
// querying stats.
func TestAdvanceRestage_InstancePollResolvesProcessOnFirstCall(t *testing.T) {
	processLookups := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/processes":
			processLookups++
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources":  []map[string]interface{}{{"guid": "proc-web", "type": "web"}},
			})
		case "/v3/processes/proc-web/stats":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"resources": []map[string]interface{}{{"state": "RUNNING"}},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{AppGuid: "app-1", CurrentStage: StageRestageInstancePoll}
	state, _, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateComplete, state)
	assert.Equal(t, "proc-web", ref.WebProcessGuid)
	assert.Equal(t, RestageStage(""), ref.CurrentStage)
	assert.Equal(t, 1, processLookups)
}

// TestAdvanceRestage_InstancePollAllRunningCompletes verifies the terminal
// transition when every instance is RUNNING.
func TestAdvanceRestage_InstancePollAllRunningCompletes(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/processes/proc-web/stats":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"resources": []map[string]interface{}{
					{"state": "RUNNING"},
					{"state": "RUNNING"},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{
		AppGuid:        "app-1",
		WebProcessGuid: "proc-web",
		CurrentStage:   StageRestageInstancePoll,
	}
	state, _, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateComplete, state)
}

// TestAdvanceRestage_InstancePollNoWaitShortCircuits verifies the noWait
// shortcut returns COMPLETE the moment any instance is RUNNING.
func TestAdvanceRestage_InstancePollNoWaitShortCircuits(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/processes/proc-web/stats":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"resources": []map[string]interface{}{
					{"state": "RUNNING"},
					{"state": "STARTING"},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{
		AppGuid:        "app-1",
		WebProcessGuid: "proc-web",
		NoWait:         true,
		CurrentStage:   StageRestageInstancePoll,
	}
	state, _, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateComplete, state)
}

// TestAdvanceRestage_InstancePollStillStartingStays verifies the orchestrator
// stays on INSTANCE_POLL when no instance is RUNNING yet.
func TestAdvanceRestage_InstancePollStillStartingStays(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/processes/proc-web/stats":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"resources": []map[string]interface{}{{"state": "STARTING"}},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{
		WebProcessGuid: "proc-web",
		CurrentStage:   StageRestageInstancePoll,
	}
	state, _, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateProcessing, state)
	assert.Equal(t, StageRestageInstancePoll, ref.CurrentStage)
}

// TestAdvanceRestage_InstancePollAllCrashedFailsFast verifies the
// fail-fast path when all running instances crash, rather than waiting
// for context timeout.
func TestAdvanceRestage_InstancePollAllCrashedFailsFast(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/processes/proc-web/stats":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"resources": []map[string]interface{}{
					{"state": "CRASHED"},
					{"state": "CRASHED"},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{
		WebProcessGuid: "proc-web",
		CurrentStage:   StageRestageInstancePoll,
	}
	state, errs, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateFailed, state)
	require.Len(t, errs, 1)
	assert.Contains(t, errs[0].Message, "all app instances crashed")
}

// TestAdvanceRestage_UnknownStageFailsTerminal guards against a ref that
// names a stage the downtime path does not own (e.g. deployment_create
// from the rolling/canary path before that slice lands).
func TestAdvanceRestage_UnknownStageFailsTerminal(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			rootHandler(w)
			return
		}
		http.NotFound(w, r)
	}))
	defer srv.Close()

	ref := &RestageRef{CurrentStage: "bogus_stage"}
	state, errs, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateFailed, state)
	require.Len(t, errs, 1)
	assert.Equal(t, "stratos.restage.invalid_stage", errs[0].Code)
}

// TestAdvanceRestage_TerminalStageReturnsComplete verifies a ref that
// has already drained (CurrentStage == "") is reported COMPLETE rather
// than treated as an error.
func TestAdvanceRestage_TerminalStageReturnsComplete(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			rootHandler(w)
			return
		}
		http.NotFound(w, r)
	}))
	defer srv.Close()

	ref := &RestageRef{CurrentStage: ""}
	state, _, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateComplete, state)
}

// TestAdvanceRestage_BuildPollTimeout verifies the wall-clock budget
// branch in advanceBuildPoll. CF can leave a build STAGING for an
// unbounded period; the orchestrator imposes RestageBuildPollTimeout so
// the Stratos job has a definite end. Mirror of
// TestAdvanceRollback_PollingTimeout.
//
// Mechanic: call 1 with `now` returning T0 anchors the build_poll stage's
// StartedAt at T0. Call 2 with `now` returning T0 + RestageBuildPollTimeout
// + 1s should trip the budget branch even though the GET response still
// indicates STAGING.
func TestAdvanceRestage_BuildPollTimeout(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/builds/build-slow":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":  "build-slow",
				"state": "STAGING",
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client := orchestratorTestClient(t, srv)

	ref := &RestageRef{
		AppGuid:      "app-1",
		BuildGuid:    "build-slow",
		CurrentStage: StageRestageBuildPoll,
	}

	t0 := time.Date(2026, 5, 1, 12, 0, 0, 0, time.UTC)
	nowAtT0 := func() time.Time { return t0 }

	// Call 1: build_poll at T0 — anchors the stage's StartedAt; server
	// returns STAGING so we stay.
	state, _, err := advanceRestage(ctx, client, ref, nowAtT0)
	require.NoError(t, err)
	require.Equal(t, stratosjobs.JobStateProcessing, state)
	require.Len(t, ref.Stages, 1)
	require.Equal(t, t0, ref.Stages[0].StartedAt, "build_poll StartedAt anchored at T0")

	// Call 2: poll again past the budget. Server still says STAGING; the
	// budget branch must trip first.
	beyondBudget := func() time.Time { return t0.Add(RestageBuildPollTimeout + time.Second) }
	state, errs, err := advanceRestage(ctx, client, ref, beyondBudget)
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateFailed, state)
	require.NotEmpty(t, errs)
	assert.True(t,
		strings.Contains(errs[0].Message, "timed out") || strings.Contains(errs[0].Message, "timeout"),
		"timeout branch message should mention timeout, got %q", errs[0].Message)
	assert.Equal(t, "stratos.restage.build_poll", errs[0].Code)
	assert.Equal(t, StageStateFailed, ref.Stages[0].State)
}

// TestAdvanceRestage_InstancePollTimeout verifies the wall-clock budget
// branch in advanceInstancePoll. Catches the pathological case where
// some instances stay STARTING indefinitely without crashing.
func TestAdvanceRestage_InstancePollTimeout(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/processes/proc-web/stats":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"resources": []map[string]interface{}{{"state": "STARTING"}},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client := orchestratorTestClient(t, srv)

	ref := &RestageRef{
		AppGuid:        "app-1",
		WebProcessGuid: "proc-web",
		CurrentStage:   StageRestageInstancePoll,
	}

	t0 := time.Date(2026, 5, 1, 12, 0, 0, 0, time.UTC)
	nowAtT0 := func() time.Time { return t0 }

	// Call 1: instance_poll at T0 — anchors the stage's StartedAt; server
	// returns STARTING so we stay.
	state, _, err := advanceRestage(ctx, client, ref, nowAtT0)
	require.NoError(t, err)
	require.Equal(t, stratosjobs.JobStateProcessing, state)
	require.Len(t, ref.Stages, 1)
	require.Equal(t, t0, ref.Stages[0].StartedAt, "instance_poll StartedAt anchored at T0")

	// Call 2: poll again past the budget. Server still says STARTING; the
	// budget branch must trip first.
	beyondBudget := func() time.Time { return t0.Add(RestageInstancePollTimeout + time.Second) }
	state, errs, err := advanceRestage(ctx, client, ref, beyondBudget)
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateFailed, state)
	require.NotEmpty(t, errs)
	assert.True(t,
		strings.Contains(errs[0].Message, "timed out") || strings.Contains(errs[0].Message, "timeout"),
		"timeout branch message should mention timeout, got %q", errs[0].Message)
	assert.Equal(t, "stratos.restage.instance_poll", errs[0].Code)
	assert.Equal(t, StageStateFailed, ref.Stages[0].State)
}

// TestAdvanceRestage_BuildPollAdvancesToDeploymentCreateForRolling verifies
// that the build_poll success branch routes to deployment_create (not
// set_droplet) when Strategy is rolling.
func TestAdvanceRestage_BuildPollAdvancesToDeploymentCreateForRolling(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/builds/build-1":
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":    "build-1",
				"state":   "STAGED",
				"droplet": map[string]string{"guid": "droplet-1"},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{
		AppGuid:      "app-1",
		BuildGuid:    "build-1",
		Strategy:     RestageStrategyRolling,
		CurrentStage: StageRestageBuildPoll,
	}
	state, _, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateProcessing, state)
	assert.Equal(t, "droplet-1", ref.DropletGuid)
	assert.Equal(t, StageRestageDeploymentCreate, ref.CurrentStage)
}

// TestAdvanceRestage_BuildPollAdvancesToDeploymentCreateForCanary mirror
// of the rolling test for the canary strategy.
func TestAdvanceRestage_BuildPollAdvancesToDeploymentCreateForCanary(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/builds/build-1":
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":    "build-1",
				"state":   "STAGED",
				"droplet": map[string]string{"guid": "droplet-1"},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{
		AppGuid:      "app-1",
		BuildGuid:    "build-1",
		Strategy:     RestageStrategyCanary,
		CurrentStage: StageRestageBuildPoll,
	}
	state, _, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateProcessing, state)
	assert.Equal(t, StageRestageDeploymentCreate, ref.CurrentStage)
}

// TestAdvanceRestage_DeploymentCreateAdvancesToPoll verifies the POST
// /v3/deployments call captures the deployment GUID and advances.
func TestAdvanceRestage_DeploymentCreateAdvancesToPoll(t *testing.T) {
	var gotBody map[string]interface{}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			rootHandler(w)
		case r.URL.Path == "/v3/deployments" && r.Method == http.MethodPost:
			_ = json.NewDecoder(r.Body).Decode(&gotBody)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusAccepted)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "dep-1",
				"status": map[string]interface{}{
					"value":  "ACTIVE",
					"reason": "DEPLOYING",
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{
		AppGuid:      "app-1",
		DropletGuid:  "droplet-1",
		Strategy:     RestageStrategyRolling,
		CurrentStage: StageRestageDeploymentCreate,
	}
	state, _, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateProcessing, state)
	assert.Equal(t, "dep-1", ref.DeploymentGuid)
	assert.Equal(t, StageRestageDeploymentPoll, ref.CurrentStage)

	// Wire-shape assertions: the body must carry droplet.guid (NOT
	// revision.guid — that's rollback's path), strategy, and the app
	// relationship.
	require.NotNil(t, gotBody)
	droplet, _ := gotBody["droplet"].(map[string]interface{})
	require.NotNil(t, droplet, "POST body missing droplet block")
	assert.Equal(t, "droplet-1", droplet["guid"])
	assert.Equal(t, "rolling", gotBody["strategy"])
}

// TestAdvanceRestage_DeploymentPollDeployedCompletes verifies the
// FINALIZED+DEPLOYED branch terminates as success.
func TestAdvanceRestage_DeploymentPollDeployedCompletes(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/deployments/dep-1":
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

	ref := &RestageRef{
		DeploymentGuid: "dep-1",
		Strategy:       RestageStrategyRolling,
		CurrentStage:   StageRestageDeploymentPoll,
	}
	state, _, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateComplete, state)
	assert.Equal(t, RestageStage(""), ref.CurrentStage)
}

// TestAdvanceRestage_DeploymentPollCanceledFails verifies the
// FINALIZED+CANCELED branch surfaces status.details.error.
func TestAdvanceRestage_DeploymentPollCanceledFails(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/deployments/dep-1":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "dep-1",
				"status": map[string]interface{}{
					"value":  "FINALIZED",
					"reason": "CANCELED",
					"details": map[string]interface{}{
						"error": "instances crashed",
					},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{
		DeploymentGuid: "dep-1",
		Strategy:       RestageStrategyRolling,
		CurrentStage:   StageRestageDeploymentPoll,
	}
	state, errs, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateFailed, state)
	require.NotEmpty(t, errs)
	assert.Equal(t, "stratos.restage.deployment_poll", errs[0].Code)
	assert.Contains(t, errs[0].Message, "instances crashed")
}

// TestAdvanceRestage_DeploymentPollSupersededFails verifies the
// FINALIZED+SUPERSEDED branch (a newer deployment for the same app
// abandons this one) is treated as a terminal failure.
func TestAdvanceRestage_DeploymentPollSupersededFails(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/deployments/dep-1":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "dep-1",
				"status": map[string]interface{}{
					"value":  "FINALIZED",
					"reason": "SUPERSEDED",
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ref := &RestageRef{
		DeploymentGuid: "dep-1",
		Strategy:       RestageStrategyRolling,
		CurrentStage:   StageRestageDeploymentPoll,
	}
	state, errs, err := advanceRestage(context.Background(), orchestratorTestClient(t, srv), ref, fixedClock())
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateFailed, state)
	require.NotEmpty(t, errs)
	assert.Contains(t, errs[0].Message, "Superseded")
}

// TestAdvanceRestage_DeploymentPollPausedStaysWithoutTimeout verifies
// canary's PAUSED state stays on the poll stage indefinitely without
// tripping the polling-budget check, even past RestageDeploymentPollTimeout.
// This is the behavior that lets a human review take longer than the
// deployment timeout would otherwise allow.
func TestAdvanceRestage_DeploymentPollPausedStaysWithoutTimeout(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/deployments/dep-1":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "dep-1",
				"status": map[string]interface{}{
					"value":  "ACTIVE",
					"reason": "PAUSED",
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client := orchestratorTestClient(t, srv)

	ref := &RestageRef{
		DeploymentGuid: "dep-1",
		Strategy:       RestageStrategyCanary,
		CurrentStage:   StageRestageDeploymentPoll,
	}

	t0 := time.Date(2026, 5, 1, 12, 0, 0, 0, time.UTC)
	nowAtT0 := func() time.Time { return t0 }

	// Anchor the poll stage at T0.
	state, _, err := advanceRestage(ctx, client, ref, nowAtT0)
	require.NoError(t, err)
	require.Equal(t, stratosjobs.JobStateProcessing, state)

	// Past the budget, but still PAUSED — must NOT trip timeout.
	beyondBudget := func() time.Time { return t0.Add(RestageDeploymentPollTimeout + time.Hour) }
	state, errs, err := advanceRestage(ctx, client, ref, beyondBudget)
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateProcessing, state, "PAUSED canary must not trip timeout")
	assert.Empty(t, errs)
	assert.Equal(t, StageRestageDeploymentPoll, ref.CurrentStage)
}

// TestAdvanceRestage_DeploymentPollTimeout verifies the wall-clock budget
// branch trips when the deployment stays ACTIVE/DEPLOYING (NOT PAUSED) past
// RestageDeploymentPollTimeout. Mirror of TestAdvanceRollback_PollingTimeout.
func TestAdvanceRestage_DeploymentPollTimeout(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			rootHandler(w)
		case "/v3/deployments/dep-slow":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "dep-slow",
				"status": map[string]interface{}{
					"value":  "ACTIVE",
					"reason": "DEPLOYING",
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	ctx := context.Background()
	client := orchestratorTestClient(t, srv)

	ref := &RestageRef{
		DeploymentGuid: "dep-slow",
		Strategy:       RestageStrategyRolling,
		CurrentStage:   StageRestageDeploymentPoll,
	}

	t0 := time.Date(2026, 5, 1, 12, 0, 0, 0, time.UTC)
	nowAtT0 := func() time.Time { return t0 }
	state, _, err := advanceRestage(ctx, client, ref, nowAtT0)
	require.NoError(t, err)
	require.Equal(t, stratosjobs.JobStateProcessing, state)

	beyondBudget := func() time.Time { return t0.Add(RestageDeploymentPollTimeout + time.Second) }
	state, errs, err := advanceRestage(ctx, client, ref, beyondBudget)
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateFailed, state)
	require.NotEmpty(t, errs)
	assert.True(t,
		strings.Contains(errs[0].Message, "timed out") || strings.Contains(errs[0].Message, "timeout"),
		"timeout branch message should mention timeout, got %q", errs[0].Message)
	assert.Equal(t, "stratos.restage.deployment_poll", errs[0].Code)
}

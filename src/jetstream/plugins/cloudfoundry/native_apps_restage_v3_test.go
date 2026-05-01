// src/jetstream/plugins/cloudfoundry/native_apps_restage_v3_test.go
package cloudfoundry

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

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

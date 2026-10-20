package cloudfoundry

import (
	"context"
	"encoding/json"
	"flag"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// The files in testdata/cf-jobs/cf are Cloud Controller responses recorded on
// a live foundation against a test broker answering synchronously ("sync-")
// and asynchronously ("async-"): each job as first polled ("-polling") and
// once terminal, plus the service instance bodies the outcome check reads.
// The app binding and service key bodies ("app-binding-*", "service-key-*")
// were not captured: they follow CF's v3 service_credential_binding shape,
// with the guids of the captured jobs.
// These tests replay them through the real write handlers on both resolve
// paths - the job already terminal inside the fast-path window, and the job
// still running when the window closes, then polled through the tracker - and
// record what the frontend receives in testdata/cf-jobs/stratos. The frontend
// specs read those files, so both suites test CF's real shapes instead of
// hand-written fixtures (hand-written fixtures hid #6001).
//
// Rewrite the stratos files after a deliberate contract change:
//
//	go test ./plugins/cloudfoundry -run TestServiceWritesContract -update
var updateContract = flag.Bool("update", false, "rewrite testdata/cf-jobs/stratos from the CF captures")

const cfJobsDir = "testdata/cf-jobs"

type serviceWriteCase struct {
	op string
	// resource prefixes the capture of the resource the job's link names,
	// as the outcome check GETs it.
	resource string
	method   string
	path     string
	params   echo.PathValues
	body     string
	handler  func(*CloudFoundrySpecification, *echo.Context) error
}

var serviceWriteCases = []serviceWriteCase{
	{
		op: "service-instance-create", resource: "service-instance", method: http.MethodPost,
		path:    "/pp/v1/cf/service_instances/:cnsiGuid",
		params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}},
		body:    `{"type":"managed","name":"si","relationships":{"space":{"data":{"guid":"space-1"}},"service_plan":{"data":{"guid":"plan-1"}}}}`,
		handler: (*CloudFoundrySpecification).createManagedServiceInstance,
	},
	{
		op: "service-instance-update", resource: "service-instance", method: http.MethodPatch,
		path:    "/pp/v1/cf/service_instances/:cnsiGuid/:siGuid",
		params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}, {Name: "siGuid", Value: "si-1"}},
		body:    `{"parameters":{"capture":true}}`,
		handler: (*CloudFoundrySpecification).updateManagedServiceInstance,
	},
	{
		op: "service-instance-delete", resource: "service-instance", method: http.MethodDelete,
		path:    "/pp/v1/cf/service_instances/:cnsiGuid/:siGuid",
		params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}, {Name: "siGuid", Value: "si-1"}},
		handler: (*CloudFoundrySpecification).deleteServiceInstance,
	},
	{
		op: "app-binding-create", resource: "app-binding", method: http.MethodPost,
		path:    "/pp/v1/cf/service_bindings/:cnsiGuid",
		params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}},
		body:    `{"type":"app","relationships":{"app":{"data":{"guid":"app-1"}},"service_instance":{"data":{"guid":"si-1"}}}}`,
		handler: (*CloudFoundrySpecification).createServiceBinding,
	},
	{
		op: "app-binding-delete", resource: "app-binding", method: http.MethodDelete,
		path:    "/pp/v1/cf/service_bindings/:cnsiGuid/:bindingGuid",
		params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}, {Name: "bindingGuid", Value: "binding-1"}},
		handler: (*CloudFoundrySpecification).deleteServiceBinding,
	},
	{
		op: "service-key-create", resource: "service-key", method: http.MethodPost,
		path:    "/pp/v1/cf/service_keys/:cnsiGuid",
		params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}},
		body:    `{"type":"key","name":"my-key","relationships":{"service_instance":{"data":{"guid":"si-1"}}}}`,
		handler: (*CloudFoundrySpecification).createServiceKey,
	},
	{
		op: "service-key-delete", resource: "service-key", method: http.MethodDelete,
		path:    "/pp/v1/cf/service_keys/:cnsiGuid/:keyGuid",
		params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}, {Name: "keyGuid", Value: "key-1"}},
		handler: (*CloudFoundrySpecification).deleteServiceKey,
	},
}

// fakeCF answers a write with 202 + Location (as CF does), serves the job
// from the captures - the running body until finished is set - and serves
// the resource body the outcome check GETs.
type fakeCF struct {
	jobGUID  string
	running  []byte
	done     []byte
	resource []byte
	finished atomic.Bool
}

func (f *fakeCF) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	switch {
	case r.URL.Path == "/v3":
		_, _ = w.Write([]byte(`{"links":{}}`))
	case r.Method == http.MethodGet && r.URL.Path == "/v3/jobs/"+f.jobGUID:
		if f.finished.Load() {
			_, _ = w.Write(f.done)
		} else {
			_, _ = w.Write(f.running)
		}
	case r.Method == http.MethodGet && (strings.HasPrefix(r.URL.Path, "/v3/service_instances/") ||
		strings.HasPrefix(r.URL.Path, "/v3/service_credential_bindings/")):
		_, _ = w.Write(f.resource)
	case r.Method != http.MethodGet &&
		(strings.HasPrefix(r.URL.Path, "/v3/service_instances") || strings.HasPrefix(r.URL.Path, "/v3/service_credential_bindings")):
		w.Header().Set("Location", "/v3/jobs/"+f.jobGUID)
		w.WriteHeader(http.StatusAccepted)
	default:
		http.NotFound(w, r)
	}
}

func readCapture(t *testing.T, name string) []byte {
	t.Helper()
	data, err := os.ReadFile(filepath.Join(cfJobsDir, "cf", name+".json"))
	require.NoError(t, err)
	return data
}

// newFakeCF serves capture as the terminal job, running while it is still
// running, and resource for resource GETs.
func newFakeCF(t *testing.T, capture, running, resource string) *fakeCF {
	t.Helper()
	done := readCapture(t, capture)
	var job struct {
		GUID string `json:"guid"`
	}
	require.NoError(t, json.Unmarshal(done, &job))
	return &fakeCF{jobGUID: job.GUID, running: readCapture(t, running), done: done, resource: readCapture(t, resource)}
}

// recordedResponse is one HTTP answer the frontend sees.
type recordedResponse struct {
	Status int             `json:"status"`
	Body   json.RawMessage `json:"body"`
}

// writeContract is what the frontend receives for one write on each path.
// Handoff and Poll carry a fixed job id and timestamps so the files stay
// stable.
type writeContract struct {
	FastPath recordedResponse `json:"fastPath"`
	Handoff  recordedResponse `json:"handoff"`
	Poll     recordedResponse `json:"poll"`
}

const contractJobID = "stratos-job-1"

func runWrite(t *testing.T, wc serviceWriteCase, cf http.Handler) (recordedResponse, *CloudFoundrySpecification) {
	t.Helper()
	srv := httptest.NewServer(cf)
	t.Cleanup(srv.Close)

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
		asyncTracker: stratosjobs.NewInMemoryTracker(stratosjobs.InMemoryTrackerConfig{}),
	}
	plugin.asyncTranslator = NewCFJobTranslator(plugin)

	e := echo.New()
	req := httptest.NewRequest(wc.method, wc.path, strings.NewReader(wc.body))
	if wc.body != "" {
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	}
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath(wc.path)
	c.SetPathValues(wc.params)

	require.NoError(t, wc.handler(plugin, c))
	return recordedResponse{Status: rec.Code, Body: rec.Body.Bytes()}, plugin
}

// pollHandedOff finishes the job in CF and polls it the way
// GET /pp/v1/stratos/jobs/{id} does.
func pollHandedOff(t *testing.T, plugin *CloudFoundrySpecification, cf *fakeCF, handoff recordedResponse) recordedResponse {
	t.Helper()
	require.Equal(t, http.StatusAccepted, handoff.Status, "a running job must hand off: %s", handoff.Body)
	var job stratosjobs.StratosJob
	require.NoError(t, json.Unmarshal(handoff.Body, &job))
	cf.finished.Store(true)
	polled, ok := plugin.asyncTracker.Refresh(context.Background(), job.ID)
	require.True(t, ok)
	body, err := json.Marshal(polled)
	require.NoError(t, err)
	return recordedResponse{Status: http.StatusOK, Body: body}
}

// stableJob fixes the per-run job id and timestamps.
func stableJob(t *testing.T, r recordedResponse) recordedResponse {
	t.Helper()
	var m map[string]interface{}
	require.NoError(t, json.Unmarshal(r.Body, &m))
	m["id"] = contractJobID
	m["startedAt"] = "2026-01-01T00:00:00Z"
	m["updatedAt"] = "2026-01-01T00:00:00Z"
	body, err := json.Marshal(m)
	require.NoError(t, err)
	return recordedResponse{Status: r.Status, Body: body}
}

func runContract(t *testing.T, wc serviceWriteCase, capture, running, resource string) writeContract {
	t.Helper()
	fast := newFakeCF(t, capture, running, resource)
	fast.finished.Store(true)
	fastResp, _ := runWrite(t, wc, fast)

	slow := newFakeCF(t, capture, running, resource)
	handoff, plugin := runWrite(t, wc, slow)
	poll := pollHandedOff(t, plugin, slow, handoff)

	return writeContract{FastPath: fastResp, Handoff: stableJob(t, handoff), Poll: stableJob(t, poll)}
}

func checkContractFile(t *testing.T, name string, got writeContract) {
	t.Helper()
	path := filepath.Join(cfJobsDir, "stratos", name+".json")
	data, err := json.MarshalIndent(got, "", "  ")
	require.NoError(t, err)
	data = append(data, '\n')
	if *updateContract {
		require.NoError(t, os.MkdirAll(filepath.Dir(path), 0o755))
		require.NoError(t, os.WriteFile(path, data, 0o644))
		return
	}
	want, err := os.ReadFile(path)
	require.NoError(t, err, "missing %s: run with -update", path)
	assert.JSONEq(t, string(want), string(data), "%s is stale: run with -update after checking the change", path)
}

// fastPathOutcome is the {state, result|errors} body the fast path returns.
type fastPathOutcome struct {
	State  string                     `json:"state"`
	Result json.RawMessage            `json:"result"`
	Errors []stratosjobs.StratosError `json:"errors"`
}

// Whether the broker answers synchronously or asynchronously, and whether the
// job finishes inside the fast-path window or after the handoff, the frontend
// must end up with the same outcome.
func TestServiceWritesContract(t *testing.T) {
	for _, mode := range []string{"sync", "async"} {
		for _, wc := range serviceWriteCases {
			t.Run(mode+"/"+wc.op, func(t *testing.T) {
				t.Parallel()
				got := runContract(t, wc, mode+"-"+wc.op, mode+"-"+wc.op+"-polling", wc.resource+"-succeeded")

				require.Equal(t, http.StatusOK, got.FastPath.Status, "fast path: %s", got.FastPath.Body)
				var fast fastPathOutcome
				require.NoError(t, json.Unmarshal(got.FastPath.Body, &fast))
				var polled stratosjobs.StratosJob
				require.NoError(t, json.Unmarshal(got.Poll.Body, &polled))

				assert.Equal(t, string(stratosjobs.JobStateComplete), fast.State)
				assert.Equal(t, stratosjobs.JobStateComplete, polled.State)
				polledResult, err := json.Marshal(polled.Result)
				require.NoError(t, err)
				assert.JSONEq(t, string(fast.Result), string(polledResult), "fast path and polled path must report the same result")

				checkContractFile(t, mode+"-"+wc.op, got)
			})
		}
	}

	// Broker failures, captured from a broker failing asynchronously
	// ("failasync": accepts, then reports the operation failed) and
	// synchronously ("syncfail": an error on the provision call). CF fails
	// the job in every case, and both paths must report it with the broker's
	// error.
	//
	// "lastop" is the other way a failure can arrive: the job COMPLETE while
	// the resource it links to records the operation as failed. The outcome
	// check must turn that into the same failure on both paths, with the
	// broker's description from last_operation.
	failures := []struct {
		name, capture, running, resource string
		wc                               serviceWriteCase
		code                             string // expected error code; "" leaves it to the capture
	}{
		{"failasync-service-instance-create", "failasync-service-instance-create", "failasync-service-instance-create-polling", "service-instance-create-failed", serviceWriteCases[0], ""},
		{"failasync-service-instance-update", "failasync-service-instance-update", "async-service-instance-update-polling", "service-instance-update-failed", serviceWriteCases[1], ""},
		{"syncfail-service-instance-create", "syncfail-service-instance-create", "syncfail-service-instance-create-polling", "service-instance-create-failed", serviceWriteCases[0], ""},
		{"lastop-service-instance-create", "async-service-instance-create", "async-service-instance-create-polling", "service-instance-create-failed", serviceWriteCases[0], "cf.service_instance.last_operation.failed"},
		{"lastop-service-instance-update", "async-service-instance-update", "async-service-instance-update-polling", "service-instance-update-failed", serviceWriteCases[1], "cf.service_instance.last_operation.failed"},
		{"lastop-app-binding-create", "async-app-binding-create", "async-app-binding-create-polling", "app-binding-create-failed", serviceWriteCases[3], "cf.service_credential_binding.last_operation.failed"},
		{"lastop-service-key-create", "async-service-key-create", "async-service-key-create-polling", "service-key-create-failed", serviceWriteCases[5], "cf.service_credential_binding.last_operation.failed"},
	}
	for _, f := range failures {
		t.Run(f.name, func(t *testing.T) {
			t.Parallel()
			got := runContract(t, f.wc, f.capture, f.running, f.resource)

			assert.Equal(t, http.StatusUnprocessableEntity, got.FastPath.Status, "fast path: %s", got.FastPath.Body)
			var fast fastPathOutcome
			require.NoError(t, json.Unmarshal(got.FastPath.Body, &fast))
			var polled stratosjobs.StratosJob
			require.NoError(t, json.Unmarshal(got.Poll.Body, &polled))
			assert.Equal(t, string(stratosjobs.JobStateFailed), fast.State)
			assert.Equal(t, stratosjobs.JobStateFailed, polled.State)
			require.NotEmpty(t, fast.Errors)
			assert.Equal(t, fast.Errors, polled.Errors, "both paths must report the broker's error")
			if f.code != "" {
				assert.Equal(t, f.code, fast.Errors[0].Code)
				assert.Equal(t, "Operation failed", fast.Errors[0].Detail, "the broker's last_operation description")
			}

			checkContractFile(t, f.name, got)
		})
	}
}

// CF deletes a user-provided service instance, and its app and route
// bindings, synchronously: 204 No Content with no Location header (CF v3 API
// docs, each resource's delete). The handlers must report the delete as
// complete, not as failed after CF has already done it.
func TestUserProvidedDeletesCompleteSynchronously(t *testing.T) {
	cases := []serviceWriteCase{
		{
			op: "service-instance-delete", method: http.MethodDelete,
			path:    "/pp/v1/cf/service_instances/:cnsiGuid/:siGuid",
			params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}, {Name: "siGuid", Value: "ups-1"}},
			handler: (*CloudFoundrySpecification).deleteServiceInstance,
		},
		{
			op: "app-binding-delete", method: http.MethodDelete,
			path:    "/pp/v1/cf/service_bindings/:cnsiGuid/:bindingGuid",
			params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}, {Name: "bindingGuid", Value: "binding-1"}},
			handler: (*CloudFoundrySpecification).deleteServiceBinding,
		},
		{
			op: "route-binding-delete", method: http.MethodDelete,
			path:    "/pp/v1/cf/service_route_bindings/:cnsiGuid/:bindingGuid",
			params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}, {Name: "bindingGuid", Value: "route-binding-1"}},
			handler: (*CloudFoundrySpecification).deleteServiceRouteBinding,
		},
	}
	syncCF := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.Method == http.MethodDelete:
			w.WriteHeader(http.StatusNoContent)
		default:
			http.NotFound(w, r)
		}
	})
	for _, wc := range cases {
		t.Run(wc.op, func(t *testing.T) {
			resp, _ := runWrite(t, wc, syncCF)
			require.Equal(t, http.StatusOK, resp.Status, "%s", resp.Body)
			var body map[string]interface{}
			require.NoError(t, json.Unmarshal(resp.Body, &body))
			assert.Equal(t, string(stratosjobs.JobStateComplete), body["state"])
		})
	}
}

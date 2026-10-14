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
// once terminal, plus the service instance bodies the outcome checks read.
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
	op      string
	method  string
	path    string
	params  echo.PathValues
	body    string
	handler func(*CloudFoundrySpecification, *echo.Context) error
}

var serviceWriteCases = []serviceWriteCase{
	{
		op: "service-instance-create", method: http.MethodPost,
		path:    "/pp/v1/cf/service_instances/:cnsiGuid",
		params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}},
		body:    `{"type":"managed","name":"si","relationships":{"space":{"data":{"guid":"space-1"}},"service_plan":{"data":{"guid":"plan-1"}}}}`,
		handler: (*CloudFoundrySpecification).createManagedServiceInstance,
	},
	{
		op: "service-instance-update", method: http.MethodPatch,
		path:    "/pp/v1/cf/service_instances/:cnsiGuid/:siGuid",
		params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}, {Name: "siGuid", Value: "si-1"}},
		body:    `{"parameters":{"capture":true}}`,
		handler: (*CloudFoundrySpecification).updateManagedServiceInstance,
	},
	{
		op: "service-instance-delete", method: http.MethodDelete,
		path:    "/pp/v1/cf/service_instances/:cnsiGuid/:siGuid",
		params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}, {Name: "siGuid", Value: "si-1"}},
		handler: (*CloudFoundrySpecification).deleteServiceInstance,
	},
	{
		op: "app-binding-create", method: http.MethodPost,
		path:    "/pp/v1/cf/service_bindings/:cnsiGuid",
		params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}},
		body:    `{"type":"app","relationships":{"app":{"data":{"guid":"app-1"}},"service_instance":{"data":{"guid":"si-1"}}}}`,
		handler: (*CloudFoundrySpecification).createServiceBinding,
	},
	{
		op: "app-binding-delete", method: http.MethodDelete,
		path:    "/pp/v1/cf/service_bindings/:cnsiGuid/:bindingGuid",
		params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}, {Name: "bindingGuid", Value: "binding-1"}},
		handler: (*CloudFoundrySpecification).deleteServiceBinding,
	},
	{
		op: "service-key-create", method: http.MethodPost,
		path:    "/pp/v1/cf/service_keys/:cnsiGuid",
		params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}},
		body:    `{"type":"key","name":"my-key","relationships":{"service_instance":{"data":{"guid":"si-1"}}}}`,
		handler: (*CloudFoundrySpecification).createServiceKey,
	},
	{
		op: "service-key-delete", method: http.MethodDelete,
		path:    "/pp/v1/cf/service_keys/:cnsiGuid/:keyGuid",
		params:  echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}, {Name: "keyGuid", Value: "key-1"}},
		handler: (*CloudFoundrySpecification).deleteServiceKey,
	},
}

// fakeCF answers a write with 202 + Location (as CF does), serves the job
// from the captures - the running body until finished is set - and serves
// the service instance body the outcome checks GET.
type fakeCF struct {
	jobGUID  string
	running  []byte
	done     []byte
	si       []byte
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
	case r.Method == http.MethodGet && strings.HasPrefix(r.URL.Path, "/v3/service_instances/"):
		_, _ = w.Write(f.si)
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
// running, and si for service instance GETs.
func newFakeCF(t *testing.T, capture, running, si string) *fakeCF {
	t.Helper()
	done := readCapture(t, capture)
	var job struct {
		GUID string `json:"guid"`
	}
	require.NoError(t, json.Unmarshal(done, &job))
	return &fakeCF{jobGUID: job.GUID, running: readCapture(t, running), done: done, si: readCapture(t, si)}
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

func runWrite(t *testing.T, wc serviceWriteCase, cf *fakeCF) (recordedResponse, *CloudFoundrySpecification) {
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

func runContract(t *testing.T, wc serviceWriteCase, capture, running, si string) writeContract {
	t.Helper()
	fast := newFakeCF(t, capture, running, si)
	fast.finished.Store(true)
	fastResp, _ := runWrite(t, wc, fast)

	slow := newFakeCF(t, capture, running, si)
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
				got := runContract(t, wc, mode+"-"+wc.op, mode+"-"+wc.op+"-polling", "service-instance-succeeded")

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
	failures := []struct {
		name, capture, running, si string
		wc                         serviceWriteCase
	}{
		{"failasync-service-instance-create", "failasync-service-instance-create", "failasync-service-instance-create-polling", "service-instance-create-failed", serviceWriteCases[0]},
		{"failasync-service-instance-update", "failasync-service-instance-update", "async-service-instance-update-polling", "service-instance-update-failed", serviceWriteCases[1]},
		{"syncfail-service-instance-create", "syncfail-service-instance-create", "syncfail-service-instance-create-polling", "service-instance-create-failed", serviceWriteCases[0]},
	}
	for _, f := range failures {
		t.Run(f.name, func(t *testing.T) {
			t.Parallel()
			got := runContract(t, f.wc, f.capture, f.running, f.si)

			assert.Equal(t, http.StatusUnprocessableEntity, got.FastPath.Status, "fast path: %s", got.FastPath.Body)
			var fast fastPathOutcome
			require.NoError(t, json.Unmarshal(got.FastPath.Body, &fast))
			var polled stratosjobs.StratosJob
			require.NoError(t, json.Unmarshal(got.Poll.Body, &polled))
			assert.Equal(t, string(stratosjobs.JobStateFailed), fast.State)
			assert.Equal(t, stratosjobs.JobStateFailed, polled.State)
			require.NotEmpty(t, fast.Errors)
			assert.Equal(t, fast.Errors, polled.Errors, "both paths must report the broker's error")

			checkContractFile(t, f.name, got)
		})
	}
}

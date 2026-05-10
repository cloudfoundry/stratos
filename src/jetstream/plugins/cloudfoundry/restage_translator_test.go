// src/jetstream/plugins/cloudfoundry/restage_translator_test.go
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

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mustParseTime parses an RFC 3339 timestamp and panics if it fails.
// Test helper only.
func mustParseTime(s string) time.Time {
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		panic("mustParseTime: " + err.Error())
	}
	return t
}

// newTestRestageTranslator wires a translator to a fixed mockNativeCFProxy
// that points capi at the supplied test server. Returns the translator
// plus the proxy so tests can assert on call counts when needed.
func newTestRestageTranslator(t *testing.T, srv *httptest.Server) (*RestageJobTranslator, *mockNativeCFProxy) {
	t.Helper()
	proxy := &mockNativeCFProxy{
		userID: "user-1",
		cnsiRecord: api.CNSIRecord{
			GUID:        "cnsi-1",
			APIEndpoint: mustParseURL(srv.URL),
		},
		tokenRecord: api.TokenRecord{AuthToken: "test-token"},
	}
	t1 := &RestageJobTranslator{
		proxyProvider: func() nativeCFProxy { return proxy },
	}
	return t1, proxy
}

func TestRestageJobTranslator_KindIsStable(t *testing.T) {
	tr := &RestageJobTranslator{}
	assert.Equal(t, "cf.app.restage", tr.Kind())
	assert.Equal(t, RestageJobKind, tr.Kind())
}

// TestRestageJobTranslator_Fetch_RejectsWrongRefType guards against a
// caller registering the translator with the wrong ref payload — e.g.
// passing CFJobRef by mistake. We surface this as a transport error
// (4th return) so the tracker logs it and surfaces clearly.
func TestRestageJobTranslator_Fetch_RejectsWrongRefType(t *testing.T) {
	tr := &RestageJobTranslator{
		proxyProvider: func() nativeCFProxy { return &mockNativeCFProxy{} },
	}
	state, errs, result, err := tr.Fetch(context.Background(), CFJobRef{JobGUID: "wrong"})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "unexpected ref type")
	assert.Equal(t, stratosjobs.JobState(""), state)
	assert.Nil(t, errs)
	assert.Nil(t, result)
}

// TestRestageJobTranslator_Fetch_RejectsNilProxy guards against the
// translator being constructed without a proxy provider.
func TestRestageJobTranslator_Fetch_RejectsNilProxy(t *testing.T) {
	tr := &RestageJobTranslator{
		proxyProvider: func() nativeCFProxy { return nil },
	}
	ref := &RestageRef{
		CNSIGuid:     "cnsi-1",
		UserGuid:     "user-1",
		AppGuid:      "app-1",
		CurrentStage: StageRestagePackageLookup,
	}
	_, _, _, err := tr.Fetch(context.Background(), ref)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "native proxy unavailable")
}

// TestRestageJobTranslator_Fetch_AdvancesPackageLookup verifies the
// translator delegates to advanceRestage and correctly mutates the ref
// pointer across subsequent calls (state machine progresses on each
// frontend poll).
func TestRestageJobTranslator_Fetch_AdvancesPackageLookup(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/packages":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources":  []map[string]interface{}{{"guid": "pkg-1", "state": "READY"}},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	tr, _ := newTestRestageTranslator(t, srv)
	ref := &RestageRef{
		CNSIGuid:     "cnsi-1",
		UserGuid:     "user-1",
		AppGuid:      "app-1",
		CurrentStage: StageRestagePackageLookup,
	}

	state, errs, result, err := tr.Fetch(context.Background(), ref)
	require.NoError(t, err)
	assert.Empty(t, errs)
	assert.Nil(t, result, "result should be nil while still PROCESSING")
	assert.Equal(t, stratosjobs.JobStateProcessing, state)

	// Verify ref was mutated through the pointer — next Fetch should
	// resume from BUILD_CREATE.
	assert.Equal(t, StageRestageBuildCreate, ref.CurrentStage)
	assert.Equal(t, "pkg-1", ref.PackageGuid)
	require.Len(t, ref.Stages, 1)
	assert.Equal(t, StageStateDone, ref.Stages[0].State)
}

// TestRestageJobTranslator_Fetch_TerminalCompleteSurfaceResult verifies
// the translator emits a structured result payload only on COMPLETE,
// containing the appGuid + strategy + stages timeline so the frontend
// can render the final state without a second roundtrip.
func TestRestageJobTranslator_Fetch_TerminalCompleteSurfaceResult(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/processes/proc-web/stats":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"resources": []map[string]interface{}{{"state": "RUNNING"}},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	tr, _ := newTestRestageTranslator(t, srv)
	ref := &RestageRef{
		CNSIGuid:       "cnsi-1",
		UserGuid:       "user-1",
		AppGuid:        "app-1",
		Strategy:       RestageStrategyDowntime,
		WebProcessGuid: "proc-web",
		CurrentStage:   StageRestageInstancePoll,
	}

	state, _, result, err := tr.Fetch(context.Background(), ref)
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateComplete, state)
	require.NotNil(t, result)
	resultMap, ok := result.(map[string]interface{})
	require.True(t, ok, "result should be map[string]interface{}, got %T", result)
	assert.Equal(t, "app-1", resultMap["appGuid"])
	assert.Equal(t, "", resultMap["strategy"]) // downtime = empty string
	assert.NotNil(t, resultMap["stages"])
}

// TestRestageJobTranslator_Fetch_TerminalFailedSurfaceErrors verifies
// the translator surfaces stage-failure errors via the StratosError
// envelope and leaves result nil (the failure context is in errors).
func TestRestageJobTranslator_Fetch_TerminalFailedSurfaceErrors(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/packages":
			// Empty resources → errNoReadyPackage path
			_, _ = w.Write([]byte(`{"pagination":{"total_results":0,"total_pages":0},"resources":[]}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	tr, _ := newTestRestageTranslator(t, srv)
	ref := &RestageRef{
		CNSIGuid:     "cnsi-1",
		UserGuid:     "user-1",
		AppGuid:      "app-empty",
		CurrentStage: StageRestagePackageLookup,
	}
	state, errs, result, err := tr.Fetch(context.Background(), ref)
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateFailed, state)
	require.Len(t, errs, 1)
	assert.Equal(t, "stratos.restage.package_lookup", errs[0].Code)
	assert.Nil(t, result)
}

// TestRestageJobTranslator_Fetch_TransportFailurePropagates verifies
// that capi-build failures (e.g. proxy returns no token) surface as
// the Fetch error rather than a stage failure — the orchestrator
// hasn't even begun, so we should not invent a fake stage record.
func TestRestageJobTranslator_Fetch_TransportFailurePropagates(t *testing.T) {
	tr := &RestageJobTranslator{
		proxyProvider: func() nativeCFProxy {
			return &noTokenProxy{}
		},
	}
	ref := &RestageRef{
		CNSIGuid:     "cnsi-1",
		UserGuid:     "user-1",
		AppGuid:      "app-1",
		CurrentStage: StageRestagePackageLookup,
	}
	_, _, _, err := tr.Fetch(context.Background(), ref)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "build capi client")
}

// TestRestageJobTranslator_CurrentStage_WrongRefType verifies that a non-
// *RestageRef ref causes CurrentStage to return (JobStage{}, false) rather
// than panicking or returning stale data.
func TestRestageJobTranslator_CurrentStage_WrongRefType(t *testing.T) {
	tr := &RestageJobTranslator{}
	stage, has := tr.CurrentStage(CFJobRef{JobGUID: "wrong"})
	assert.False(t, has)
	assert.Equal(t, "", stage.Code)
}

// TestRestageJobTranslator_CurrentStage_EmptyStages verifies that a valid
// *RestageRef with no stage history returns (JobStage{}, false).
func TestRestageJobTranslator_CurrentStage_EmptyStages(t *testing.T) {
	tr := &RestageJobTranslator{}
	ref := &RestageRef{
		CNSIGuid:     "cnsi-1",
		UserGuid:     "user-1",
		AppGuid:      "app-1",
		CurrentStage: StageRestagePackageLookup,
		// Stages intentionally empty
	}
	stage, has := tr.CurrentStage(ref)
	assert.False(t, has)
	assert.Equal(t, "", stage.Code)
}

// TestRestageJobTranslator_CurrentStage_MapsLastRecord verifies that
// CurrentStage returns a properly mapped JobStage from the last entry in
// ref.Stages, including the uppercase Code, human label, and 1-based Index.
func TestRestageJobTranslator_CurrentStage_MapsLastRecord(t *testing.T) {
	tr := &RestageJobTranslator{}

	startedAt := mustParseTime("2026-05-02T10:00:00Z")
	ref := &RestageRef{
		Stages: []RestageStageRecord{
			{
				Stage:     StageRestagePackageLookup,
				State:     StageStateDone,
				StartedAt: startedAt,
			},
			{
				Stage:     StageRestageBuildCreate,
				State:     StageStateInProgress,
				StartedAt: startedAt,
			},
		},
	}

	stage, has := tr.CurrentStage(ref)
	require.True(t, has)
	assert.Equal(t, "BUILD_CREATE", stage.Code)
	assert.Equal(t, "Creating build", stage.Label)
	assert.Equal(t, 2, stage.Index) // two records → Index 2
	assert.Equal(t, 0, stage.Of)    // unknown total
	assert.Equal(t, startedAt, stage.EnteredAt)
}

// TestRestageJobTranslator_CurrentStage_AllStageCodes exercises every
// RestageStage value to ensure none falls through to the default case
// (which returns the raw constant value as label — acceptable as a
// fallback, but we want explicit labels for all known stages).
func TestRestageJobTranslator_CurrentStage_AllStageCodes(t *testing.T) {
	tr := &RestageJobTranslator{}
	knownStages := []RestageStage{
		StageRestagePackageLookup,
		StageRestageBuildCreate,
		StageRestageBuildPoll,
		StageRestageSetDroplet,
		StageRestageStop,
		StageRestageStart,
		StageRestageInstancePoll,
		StageRestageDeploymentCreate,
		StageRestageDeploymentPoll,
	}
	for _, s := range knownStages {
		ref := &RestageRef{
			Stages: []RestageStageRecord{{Stage: s, State: StageStateDone}},
		}
		stage, has := tr.CurrentStage(ref)
		require.True(t, has, "expected CurrentStage to return true for stage %q", s)
		// Code must be uppercase form of the constant value.
		assert.Equal(t, strings.ToUpper(string(s)), stage.Code,
			"Code mismatch for stage %q", s)
		// Label must not fall back to the raw constant value (all known
		// stages have a dedicated human label).
		assert.NotEqual(t, string(s), stage.Label,
			"stage %q missing human label — fell through to default", s)
	}
}

// noTokenProxy returns no token so newCapiClient surfaces a forbidden
// error from the Stratos token store — exercises the transport-error
// path in Fetch.
type noTokenProxy struct{}

func (p *noTokenProxy) GetCNSIRecord(_ string) (api.CNSIRecord, error) {
	return api.CNSIRecord{
		GUID:        "cnsi-1",
		APIEndpoint: mustParseURL("https://example.invalid"),
	}, nil
}

func (p *noTokenProxy) GetCNSITokenRecord(_, _ string) (api.TokenRecord, bool) {
	return api.TokenRecord{}, false
}

func (p *noTokenProxy) GetSessionStringValue(_ echo.Context, _ string) (string, error) {
	return "", nil
}

func (p *noTokenProxy) RefreshOAuthToken(_ bool, _, _, _, _, _ string) (api.TokenRecord, error) {
	return api.TokenRecord{}, errors.New("not used")
}

func (p *noTokenProxy) DoProxySingleRequestWithToken(_ string, _ *api.TokenRecord, _, _ string, _ http.Header, _ []byte) (*api.CNSIRequest, error) {
	return &api.CNSIRequest{}, nil
}

// src/jetstream/plugins/cloudfoundry/restage_translator_test.go
package cloudfoundry

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

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

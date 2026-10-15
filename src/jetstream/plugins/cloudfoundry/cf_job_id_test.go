package cloudfoundry

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	testCnsiGUID = "6f3c2b1a-0d4e-4c5b-9a8f-7e6d5c4b3a21"
	testJobGUID  = "f25fc536-d89e-4c51-a964-6cbdc886a644"
)

// tokenlessProxy is a proxy whose session user holds no token for the
// endpoint, or that knows no such endpoint.
type tokenlessProxy struct {
	mockNativeCFProxy
	noEndpoint bool
}

func (p *tokenlessProxy) GetCNSIRecord(guid string) (api.CNSIRecord, error) {
	if p.noEndpoint {
		return api.CNSIRecord{}, errors.New("no such endpoint")
	}
	return p.mockNativeCFProxy.GetCNSIRecord(guid)
}

func (p *tokenlessProxy) GetCNSITokenRecord(_, _ string) (api.TokenRecord, bool) {
	return api.TokenRecord{}, p.noEndpoint
}

func TestCFJobTranslator_ImplementsJobIDCodec(t *testing.T) {
	var _ stratosjobs.JobIDCodec = (*CFJobTranslator)(nil)
}

func TestCFJobTranslator_EncodeIDCarriesKindEndpointAndJob(t *testing.T) {
	tr := NewCFJobTranslator(newPhase1CPlugin("http://cf.invalid"))

	id, ok := tr.EncodeID("cf.service_instance.create",
		CFJobRef{CnsiGUID: testCnsiGUID, UserGUID: "user-1", JobGUID: testJobGUID})

	require.True(t, ok)
	assert.Equal(t, "cf.service_instance.create."+testCnsiGUID+"."+testJobGUID, id)
	assert.NotContains(t, id, "user-1", "the id must not carry the user")
}

func TestCFJobTranslator_EncodeIDDeclinesUnsafeRefs(t *testing.T) {
	tr := NewCFJobTranslator(newPhase1CPlugin("http://cf.invalid"))
	good := CFJobRef{CnsiGUID: testCnsiGUID, UserGUID: "user-1", JobGUID: testJobGUID}

	cases := map[string]struct {
		kind string
		ref  interface{}
	}{
		"wrong ref type":        {"cf.app.delete", "not-a-ref"},
		"kind of another owner": {"k8s.thing.delete", good},
		"kind without an op":    {"cf", good},
		"kind with extra parts": {"cf.app.delete.now", good},
		"kind with upper case":  {"cf.App.delete", good},
		"empty job guid":        {"cf.app.delete", CFJobRef{CnsiGUID: testCnsiGUID, JobGUID: ""}},
		"dot in job guid":       {"cf.app.delete", CFJobRef{CnsiGUID: testCnsiGUID, JobGUID: "a.b"}},
		"slash in cnsi guid":    {"cf.app.delete", CFJobRef{CnsiGUID: "a/b", JobGUID: testJobGUID}},
		"percent in job guid":   {"cf.app.delete", CFJobRef{CnsiGUID: testCnsiGUID, JobGUID: "a%2Fb"}},
	}
	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			_, ok := tr.EncodeID(tc.kind, tc.ref)
			assert.False(t, ok)
		})
	}
}

// The id never carries the user: decoding takes the polling session's.
func TestCFJobTranslator_DecodeIDUsesSessionUser(t *testing.T) {
	tr := NewCFJobTranslator(newPhase1CPlugin("http://cf.invalid"))
	id, ok := tr.EncodeID("cf.service_key.delete",
		CFJobRef{CnsiGUID: testCnsiGUID, UserGUID: "user-1", JobGUID: testJobGUID})
	require.True(t, ok)

	kind, ref, ok := tr.DecodeID(id, "user-2")

	require.True(t, ok)
	assert.Equal(t, "cf.service_key.delete", kind)
	assert.Equal(t, CFJobRef{CnsiGUID: testCnsiGUID, UserGUID: "user-2", JobGUID: testJobGUID}, ref)
}

func TestCFJobTranslator_DecodeIDRejects(t *testing.T) {
	plugin := newPhase1CPlugin("http://cf.invalid")
	tr := NewCFJobTranslator(plugin)
	valid := "cf.app.delete." + testCnsiGUID + "." + testJobGUID

	for name, id := range map[string]string{
		"random id":        "0123456789abcdef0123456789abcdef",
		"missing job guid": "cf.app.delete." + testCnsiGUID,
		"no operation":     "cf." + testCnsiGUID + "." + testJobGUID,
		"other prefix":     "k8s.app.delete." + testCnsiGUID + "." + testJobGUID,
		"empty segment":    "cf.app.delete.." + testJobGUID,
		"bad characters":   "cf.app.delete." + testCnsiGUID + ".job%2F1",
		"empty":            "",
	} {
		t.Run(name, func(t *testing.T) {
			_, _, ok := tr.DecodeID(id, "user-1")
			assert.False(t, ok)
		})
	}

	t.Run("no session user", func(t *testing.T) {
		_, _, ok := tr.DecodeID(valid, "")
		assert.False(t, ok)
	})
	t.Run("no token for the endpoint", func(t *testing.T) {
		plugin.testProxy = &tokenlessProxy{mockNativeCFProxy: *plugin.testProxy.(*mockNativeCFProxy)}
		_, _, ok := tr.DecodeID(valid, "user-1")
		assert.False(t, ok)
	})
	t.Run("unknown endpoint", func(t *testing.T) {
		plugin.testProxy = &tokenlessProxy{mockNativeCFProxy: mockNativeCFProxy{}, noEndpoint: true}
		_, _, ok := tr.DecodeID(valid, "user-1")
		assert.False(t, ok)
	})
}

// CF answering 404 for the job means the job does not exist: the tracker
// must hear ErrJobNotFound, not a transport error it would retry forever.
func TestCFJobTranslatorFetch_JobNotFound(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"GET /v3/jobs/job-1": func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusNotFound)
			_, _ = w.Write([]byte(`{"errors":[{"code":10010,"title":"CF-ResourceNotFound","detail":"Job not found"}]}`))
		},
	})
	defer ts.Close()

	translator := NewCFJobTranslator(newPhase1CPlugin(ts.URL))
	_, _, _, err := translator.Fetch(context.Background(),
		CFJobRef{CnsiGUID: "cnsi-1", UserGUID: "user-1", JobGUID: "job-1"})

	require.Error(t, err)
	assert.True(t, errors.Is(err, stratosjobs.ErrJobNotFound), "got %v", err)
}

func TestCFJobTranslatorFetch_ServerErrorIsNotJobNotFound(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{
		"GET /v3/jobs/job-1": func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusBadGateway)
		},
	})
	defer ts.Close()

	translator := NewCFJobTranslator(newPhase1CPlugin(ts.URL))
	_, _, _, err := translator.Fetch(context.Background(),
		CFJobRef{CnsiGUID: "cnsi-1", UserGUID: "user-1", JobGUID: "job-1"})

	require.Error(t, err)
	assert.False(t, errors.Is(err, stratosjobs.ErrJobNotFound))
}

// A write handed off on one replica and polled on another — a fresh
// tracker that only registered the CF translator — reports the same
// outcome as polling the replica that created it.
func TestServiceWrites_AnotherReplicaResolvesHandedOffJob(t *testing.T) {
	for _, wc := range serviceWriteCases {
		t.Run(wc.op, func(t *testing.T) {
			t.Parallel()
			cf := newFakeCF(t, "async-"+wc.op, "async-"+wc.op+"-polling", wc.resource+"-succeeded")
			handoff, plugin := runWrite(t, wc, cf)
			require.Equal(t, http.StatusAccepted, handoff.Status, "%s", handoff.Body)
			var handed stratosjobs.StratosJob
			require.NoError(t, json.Unmarshal(handoff.Body, &handed))
			assert.True(t, strings.HasPrefix(handed.ID, handed.Kind+".cnsi-1."), "id %q must encode kind and endpoint", handed.ID)

			replica := stratosjobs.NewInMemoryTracker(stratosjobs.InMemoryTrackerConfig{})
			t.Cleanup(replica.Stop)
			replica.Register(NewCFJobTranslator(plugin))

			running, ok := replica.Resolve(context.Background(), handed.ID, "user-1")
			require.True(t, ok, "the replica must rebuild the job from its id")
			assert.Equal(t, stratosjobs.JobStateProcessing, running.State)
			assert.Equal(t, handed.Kind, running.Kind)

			creatorPoll := pollHandedOff(t, plugin, cf, handoff)
			replicaJob, ok := replica.Resolve(context.Background(), handed.ID, "user-1")
			require.True(t, ok)
			replicaPoll, err := json.Marshal(replicaJob)
			require.NoError(t, err)
			assert.JSONEq(t,
				string(stableJob(t, creatorPoll).Body),
				string(stableJob(t, recordedResponse{Status: http.StatusOK, Body: replicaPoll}).Body),
				"both replicas must report the same outcome")
		})
	}
}

func TestCFJob_ReplicaAnswersNotFoundWhenCFHasNoJob(t *testing.T) {
	ts := newCaptureServer(map[string]capiHandler{}) // every job GET is a 404
	defer ts.Close()
	plugin := newPhase1CPlugin(ts.URL)

	replica := stratosjobs.NewInMemoryTracker(stratosjobs.InMemoryTrackerConfig{})
	t.Cleanup(replica.Stop)
	replica.Register(NewCFJobTranslator(plugin))

	_, ok := replica.Resolve(context.Background(), "cf.app.delete.cnsi-1."+testJobGUID, "user-1")
	assert.False(t, ok)
}

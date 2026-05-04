package diagnostics

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMiddleware_TalliesCFCalls(t *testing.T) {
	b := NewBuffer(DefaultBufferConfig())
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"resources":[]}`))
	}))
	defer server.Close()

	client := WrapClient(http.DefaultClient, b)
	resp, err := client.Get(server.URL + "/v3/organizations?per_page=1")
	assert.NoError(t, err)
	if resp != nil {
		_ = resp.Body.Close()
	}

	snap := b.Snapshot()
	counters := snap.Counters["cf-api-call-count"]
	assert.NotEmpty(t, counters)
	assert.Equal(t, "GET", counters[0].Dimensions["method"])
	assert.Equal(t, "/v3/organizations", counters[0].Dimensions["path"])
	assert.Equal(t, "200", counters[0].Dimensions["status"])

	samples := snap.Samples["cf-api-call-timing"]
	assert.NotEmpty(t, samples)
	assert.NotNil(t, samples[0].Value)
	assert.GreaterOrEqual(t, *samples[0].Value, 0.0)
}

func TestMiddleware_NormalizesGuidInPath(t *testing.T) {
	b := NewBuffer(DefaultBufferConfig())
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	client := WrapClient(http.DefaultClient, b)
	resp, _ := client.Get(server.URL + "/v3/organizations/abc12345-1234-5678-9abc-def012345678/spaces")
	if resp != nil {
		_ = resp.Body.Close()
	}

	snap := b.Snapshot()
	path := snap.Counters["cf-api-call-count"][0].Dimensions["path"]
	assert.Contains(t, path, "/:guid")
	assert.NotContains(t, path, "abc12345-1234-5678-9abc-def012345678")
}

func TestMiddleware_TagsErrorOutcome(t *testing.T) {
	b := NewBuffer(DefaultBufferConfig())
	client := WrapClient(http.DefaultClient, b)
	// Unreachable port — triggers transport error.
	_, err := client.Get("http://127.0.0.1:1/doesnotexist")
	assert.Error(t, err)

	snap := b.Snapshot()
	errMatch := findCounter(snap.Counters["cf-api-call-count"], "outcome", "error")
	assert.NotNil(t, errMatch)
	assert.Equal(t, int64(1), errMatch.Count)
}

func findCounter(cs []Counter, dimKey, dimVal string) *Counter {
	for i := range cs {
		if cs[i].Dimensions[dimKey] == dimVal {
			return &cs[i]
		}
	}
	return nil
}

package cloudfoundry

import (
	"net/http"
	"testing"
)

// fakeChain simulates a proxy chain with a fixed request-target ceiling.
func fakeChain(limit int) func(*http.Client, string, int) (bool, error) {
	return func(_ *http.Client, _ string, targetLen int) (bool, error) {
		return targetLen <= limit, nil
	}
}

func TestProbeURILimitBisect(t *testing.T) {
	t.Parallel()

	// An 8KB chain (the common default) — probed limit must land within
	// one granularity step below the true ceiling, never above it.
	limit, capped, requests, err := probeURILimit(nil, "https://api.example.com", fakeChain(8192))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if capped {
		t.Error("8KB chain must not report capped")
	}
	if limit > 8192 || limit < 8192-probeGranularityBytes {
		t.Errorf("probed limit %d outside (%d, %d]", limit, 8192-probeGranularityBytes, 8192)
	}
	if requests > 15 {
		t.Errorf("bisect took %d requests, expected a handful", requests)
	}

	// A chain accepting everything caps at the search maximum.
	limit, capped, _, err = probeURILimit(nil, "https://api.example.com", fakeChain(1<<20))
	if err != nil || !capped || limit != probeHiBytes {
		t.Errorf("wide-open chain: want capped at %d, got limit=%d capped=%v err=%v", probeHiBytes, limit, capped, err)
	}

	// A chain tighter than the floor is an explicit error, not a bogus 0.
	_, _, _, err = probeURILimit(nil, "https://api.example.com", fakeChain(1024))
	if err == nil {
		t.Error("sub-floor chain must error")
	}
}

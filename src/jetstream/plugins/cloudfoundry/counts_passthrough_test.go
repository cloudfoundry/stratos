// src/jetstream/plugins/cloudfoundry/counts_passthrough_test.go
//
// Shared helper for the ?return=counts assertions added to every list
// handler in the Phase 1B backfill. Each backfilled handler must satisfy:
//
//  1. ?return=counts forwards per_page=1 to the upstream V3 CAPI URL.
//  2. The handler returns a flat {totalResults: N} envelope (resources
//     either omitted or `[]`).
//
// runCountsAssertion wraps the boilerplate so each per-handler test stays
// a one-liner.
package cloudfoundry

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// capturedCountsQuery records what the upstream URL carried when the
// handler answered a ?return=counts request. Tests assert PerPage="1"
// and verify any extra filters the handler is supposed to forward.
type capturedCountsQuery struct {
	Hits    int
	PerPage string
	Filters map[string]string
}

// newCountsCapiServer returns a server that listens on /v3 and listPath,
// captures per_page + a configurable list of extra filter keys (e.g.
// "organization_guids"), and replies with a fixed {totalResults}
// response. Caller closes the server. The capturedCountsQuery pointer
// stays live across requests.
func newCountsCapiServer(_ *testing.T, listPath string, totalResults int, captureFilters ...string) (*httptest.Server, *capturedCountsQuery) {
	q := &capturedCountsQuery{Filters: map[string]string{}}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case listPath:
			q.Hits++
			q.PerPage = r.URL.Query().Get("per_page")
			for _, f := range captureFilters {
				q.Filters[f] = r.URL.Query().Get(f)
			}
			w.WriteHeader(http.StatusOK)
			// Generic shape — totalResults is what every count-shape
			// response uses, regardless of resource type.
			body := `{"pagination":{"total_results":` + itoa(totalResults) + `,"total_pages":1,"next":null},"resources":[]}`
			w.Write([]byte(body))
		default:
			http.NotFound(w, r)
		}
	}))
	return srv, q
}

// itoa is a tiny strconv-free int formatter to keep this helper free of
// extra imports the test file otherwise wouldn't need.
func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var buf [20]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		buf[i] = '-'
	}
	return string(buf[i:])
}

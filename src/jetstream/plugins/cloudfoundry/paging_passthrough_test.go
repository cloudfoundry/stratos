// src/jetstream/plugins/cloudfoundry/paging_passthrough_test.go
//
// Shared assertion helpers for the per-page paging-passthrough tests of
// the 20 list handlers converted in the V2-frontend-cutover sweep. Every
// handler must satisfy two contract clauses:
//
//  1. When the caller passes ?per_page=N&page=M, the upstream V3 CAPI URL
//     contains those exact values verbatim (no Stratos-side defaults
//     poisoning, no internal multi-page drain).
//
//  2. When the caller omits both, the upstream V3 CAPI URL contains
//     neither key — V3 applies its own server defaults rather than
//     Stratos forging them.
//
// These helpers wrap an httptest.Server with a single CAPI endpoint and
// return the captured query state so each per-handler test can assert
// the contract without re-spelling the boilerplate.
package cloudfoundry

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// capturedPagingQuery records what arrived on the upstream URL the
// handler issued. Tests inspect Hits to ensure exactly one CAPI call was
// made (no drain), and PerPage/Page/Present to verify forwarding rules.
type capturedPagingQuery struct {
	Hits           int
	PerPage        string
	Page           string
	PerPagePresent bool
	PagePresent    bool
}

// newPagingCapiServer spins up a single-endpoint httptest CAPI server.
// Every request to "/v3/<path>" updates the supplied query record and
// responds with the body + status code returned by handler. Returns the
// server (caller .Close()s) and a pointer to the live query record.
//
// Tests that need multiple endpoints (composition joins) should keep
// using the bespoke httptest.Server pattern in their own file; this
// helper exists for the simple single-call passthrough checks.
func newPagingCapiServer(_ *testing.T, listPath string, body []byte) (*httptest.Server, *capturedPagingQuery) {
	q := &capturedPagingQuery{}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case listPath:
			q.Hits++
			q.PerPage = r.URL.Query().Get("per_page")
			q.Page = r.URL.Query().Get("page")
			_, q.PerPagePresent = r.URL.Query()["per_page"]
			_, q.PagePresent = r.URL.Query()["page"]
			w.WriteHeader(http.StatusOK)
			w.Write(body)
		default:
			http.NotFound(w, r)
		}
	}))
	return srv, q
}

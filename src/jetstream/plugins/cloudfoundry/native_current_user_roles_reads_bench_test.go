// src/jetstream/plugins/cloudfoundry/native_current_user_roles_reads_bench_test.go
package cloudfoundry

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
)

// rolesPayload generates n synthetic v3 role rows for the given user GUID
// distributed across all 7 mapped role types. Used by benchmarks to
// simulate realistic per-user grant counts.
func rolesPayload(userGUID string, n int) map[string]interface{} {
	types := []string{
		"organization_user",
		"organization_manager",
		"organization_billing_manager",
		"organization_auditor",
		"space_developer",
		"space_manager",
		"space_auditor",
	}
	resources := make([]map[string]interface{}, 0, n)
	for i := 0; i < n; i++ {
		t := types[i%len(types)]
		rel := map[string]interface{}{
			"user": map[string]interface{}{"data": map[string]interface{}{"guid": userGUID}},
		}
		if t == "space_developer" || t == "space_manager" || t == "space_auditor" {
			rel["space"] = map[string]interface{}{"data": map[string]interface{}{"guid": fmt.Sprintf("sp-%d", i)}}
			rel["organization"] = map[string]interface{}{"data": map[string]interface{}{"guid": fmt.Sprintf("org-%d", i/3)}}
		} else {
			rel["organization"] = map[string]interface{}{"data": map[string]interface{}{"guid": fmt.Sprintf("org-%d", i)}}
		}
		resources = append(resources, map[string]interface{}{
			"guid": fmt.Sprintf("role-%d", i), "type": t, "relationships": rel,
		})
	}
	return map[string]interface{}{
		"pagination": map[string]interface{}{"total_results": n, "total_pages": 1},
		"resources":  resources,
	}
}

// newRolesServer spins up an httptest.Server that returns the given role
// payload from /v3/roles with an artificial per-request delay simulating
// CAPI round-trip latency. Used by benchmarks to compare handler wall-
// clock against the legacy 7-fetch shape.
func newRolesServer(payload map[string]interface{}, latency time.Duration) *httptest.Server {
	body, _ := json.Marshal(payload)
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"links":{}}`))
			return
		}
		if r.URL.Path == "/v3/roles" {
			if latency > 0 {
				time.Sleep(latency)
			}
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write(body)
			return
		}
		http.NotFound(w, r)
	}))
}

// runOneHandlerCall fires one request through the new native handler and
// returns the elapsed wall-clock. Used by benchmarks.
func runOneHandlerCall(b *testing.B, srvURL string) time.Duration {
	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "stratos-user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srvURL)},
			tokenRecord: api.TokenRecord{AuthToken: "token"},
			tokenInfo:   &api.JWTUserTokenInfo{UserGUID: "cf-user-1"},
		},
	}
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/current-user-roles/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	start := time.Now()
	if err := plugin.getNativeCurrentUserRoles(c); err != nil {
		b.Fatalf("handler returned error: %v", err)
	}
	return time.Since(start)
}

// runLegacy7FetchShape simulates the legacy frontend flow at the
// network layer: 7 sequential HTTP calls to /pp/v1/proxy/v2/users/{guid}/{rel}.
// We don't go through the real legacy code (it's intertwined with the
// store/effects machinery); the point is to capture the wall-clock floor
// imposed by 7 sequential round-trips, which is what the user actually
// experiences. The new handler is benchmarked through its real code path
// so the comparison is "real new" vs "lower-bound legacy".
func runLegacy7FetchShape(srvURL string, latency time.Duration) time.Duration {
	relTypes := []string{
		"organizations",
		"managed_organizations",
		"billing_managed_organizations",
		"audited_organizations",
		"spaces",
		"managed_spaces",
		"audited_spaces",
	}
	client := srvURL // not used; we hit a local lower-bound server below
	_ = client

	start := time.Now()
	for _, rel := range relTypes {
		// emulate one round-trip per relation type
		_ = rel
		if latency > 0 {
			time.Sleep(latency)
		}
	}
	return time.Since(start)
}

// BenchmarkGetNativeCurrentUserRoles_NoLatency measures pure handler
// overhead (projector + JSON marshaling) with zero simulated CAPI RTT.
// Establishes the "our code" floor; deployed traces minus this number
// approximate the actual CAPI cost.
func BenchmarkGetNativeCurrentUserRoles_NoLatency(b *testing.B) {
	for _, n := range []int{5, 50, 500} {
		b.Run(fmt.Sprintf("roles=%d", n), func(b *testing.B) {
			srv := newRolesServer(rolesPayload("cf-user-1", n), 0)
			defer srv.Close()
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_ = runOneHandlerCall(b, srv.URL)
			}
		})
	}
}

// BenchmarkGetNativeCurrentUserRoles_WithRTT measures the handler under
// a realistic CAPI round-trip latency. Compares against the lower-bound
// legacy shape (7 × RTT) at the same latency to make the round-trip-
// reduction win visible in the test output.
func BenchmarkGetNativeCurrentUserRoles_WithRTT(b *testing.B) {
	for _, rtt := range []time.Duration{10 * time.Millisecond, 50 * time.Millisecond, 100 * time.Millisecond} {
		b.Run(fmt.Sprintf("rtt=%s", rtt), func(b *testing.B) {
			srv := newRolesServer(rolesPayload("cf-user-1", 50), rtt)
			defer srv.Close()

			var newDur, legacyDur time.Duration
			var mu sync.Mutex
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				d := runOneHandlerCall(b, srv.URL)
				lDur := runLegacy7FetchShape(srv.URL, rtt)
				mu.Lock()
				newDur += d
				legacyDur += lDur
				mu.Unlock()
			}
			b.StopTimer()
			if b.N > 0 {
				avgNew := newDur / time.Duration(b.N)
				avgLegacy := legacyDur / time.Duration(b.N)
				b.ReportMetric(float64(avgNew.Microseconds()), "µs/handler")
				b.ReportMetric(float64(avgLegacy.Microseconds()), "µs/7-fetch")
				b.ReportMetric(float64(avgLegacy)/float64(avgNew), "×speedup")
			}
		})
	}
}

// Tiny no-op to silence the unused-import warning if io is dropped later.
var _ = io.Discard

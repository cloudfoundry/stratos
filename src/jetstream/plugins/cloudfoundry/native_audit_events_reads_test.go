// src/jetstream/plugins/cloudfoundry/native_audit_events_reads_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestGetNativeAuditEvents_ReturnsMappedEvents verifies the handler
// drives a CAPI AuditEvents().List call and maps capi.AuditEvent
// resources onto flat StAuditEvent DTOs. Audit events are CF's
// foundation-wide activity log: every successful API call leaves an
// audit event with actor, target, type, optional space/org context, and
// arbitrary data. Read-only — there are no writes to surface.
//
// The Data field is intentionally returned as a JSON-encoded string;
// it's a shape-of-shapes (varies wildly per event type) and the list
// shape only needs it for "show details" expansion.
func TestGetNativeAuditEvents_ReturnsMappedEvents(t *testing.T) {
	hits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/audit_events" && r.Method == http.MethodGet:
			hits++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"pagination": {"total_results": 2, "total_pages": 1, "next": null},
				"resources": [
					{
						"guid":"event-1",
						"created_at":"2026-04-22T12:00:00Z",
						"updated_at":"2026-04-22T12:00:00Z",
						"type":"audit.app.create",
						"actor":{"guid":"user-1","type":"user","name":"alice"},
						"target":{"guid":"app-1","type":"app","name":"myapp"},
						"data":{"request":{"name":"myapp","memory":512}},
						"space":{"guid":"space-1","name":"dev"},
						"organization":{"guid":"org-1","name":"engineering"}
					},
					{
						"guid":"event-2",
						"created_at":"2026-04-22T12:05:00Z",
						"updated_at":"2026-04-22T12:05:00Z",
						"type":"audit.user.login",
						"actor":{"guid":"user-2","type":"user","name":"bob"},
						"target":{"guid":"user-2","type":"user","name":"bob"},
						"data":{},
						"space":null,
						"organization":null
					}
				]
			}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/audit_events/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/audit_events/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeAuditEvents(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, hits)

	var resp StAuditEventsResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	assert.Equal(t, 2, resp.TotalResults)

	e0 := resp.Resources[0]
	assert.Equal(t, "event-1", e0.GUID)
	assert.Equal(t, "audit.app.create", e0.Type)
	assert.Equal(t, "user-1", e0.ActorGUID)
	assert.Equal(t, "user", e0.ActorType)
	assert.Equal(t, "alice", e0.ActorName)
	assert.Equal(t, "app-1", e0.TargetGUID)
	assert.Equal(t, "app", e0.TargetType)
	assert.Equal(t, "myapp", e0.TargetName)
	assert.Equal(t, "space-1", e0.SpaceGUID)
	assert.Equal(t, "dev", e0.SpaceName)
	assert.Equal(t, "org-1", e0.OrganizationGUID)
	assert.Equal(t, "engineering", e0.OrganizationName)
	assert.Contains(t, e0.Data, `"name":"myapp"`, "Data round-trips as a JSON string for detail-screen expansion")
	assert.Equal(t, "cnsi-1", e0.CnsiGUID)
	assert.Equal(t, "2026-04-22T12:00:00Z", e0.CreatedAt)

	e1 := resp.Resources[1]
	assert.Equal(t, "audit.user.login", e1.Type)
	assert.Equal(t, "", e1.SpaceGUID, "null space must marshal as empty string")
	assert.Equal(t, "", e1.OrganizationGUID, "null organization must marshal as empty string")
}

// TestGetNativeAuditEvents_EmptyResult ensures the resources slice
// marshals as `[]` (not null) when CF returns no events.
func TestGetNativeAuditEvents_EmptyResult(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/audit_events" && r.Method == http.MethodGet:
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"pagination": {"total_results": 0, "total_pages": 1, "next": null},"resources":[]}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/audit_events/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/audit_events/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeAuditEvents(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), `"resources":[]`)
}

// TestGetNativeAuditEvents_DrainsAllPages confirms pagination drain.
// Audit events accumulate fast on busy foundations — the handler caps
// the drain at maxAuditEventPages to avoid unbounded reads. This test
// only exercises a 2-page case; the cap behavior is exercised in a
// separate test if needed.
func TestGetNativeAuditEvents_DrainsAllPages(t *testing.T) {
	hits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/audit_events" && r.Method == http.MethodGet:
			hits++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			if r.URL.Query().Get("page") == "2" {
				w.Write([]byte(`{
					"pagination": {"total_results": 3, "total_pages": 2, "next": null},
					"resources": [{"guid":"event-3","type":"x","actor":{"guid":"u","type":"user","name":"u"},"target":{"guid":"t","type":"app","name":"t"},"data":{}}]
				}`))
				return
			}
			w.Write([]byte(`{
				"pagination": {"total_results": 3, "total_pages": 2, "next": {"href": "/v3/audit_events?page=2"}},
				"resources": [
					{"guid":"event-1","type":"x","actor":{"guid":"u","type":"user","name":"u"},"target":{"guid":"t","type":"app","name":"t"},"data":{}},
					{"guid":"event-2","type":"x","actor":{"guid":"u","type":"user","name":"u"},"target":{"guid":"t","type":"app","name":"t"},"data":{}}
				]
			}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/audit_events/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/audit_events/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeAuditEvents(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 2, hits, "should drain both pages")

	var resp StAuditEventsResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 3)
}

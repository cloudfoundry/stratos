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

	var resp StratosPagedResponse[StAuditEvent]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	assert.Equal(t, 2, resp.Pagination.TotalResults)

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

// TestGetNativeAuditEvents_PerPagePassthrough verifies the handler is a
// single-page passthrough: caller's per_page+page forward verbatim to the
// upstream /v3/audit_events call, the response carries a V3-shape
// pagination envelope, and the handler issues exactly one CAPI request.
func TestGetNativeAuditEvents_PerPagePassthrough(t *testing.T) {
	hits := 0
	var lastPerPage, lastPage string
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/audit_events" && r.Method == http.MethodGet:
			hits++
			lastPerPage = r.URL.Query().Get("per_page")
			lastPage = r.URL.Query().Get("page")
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"pagination": {
					"total_results": 100,
					"total_pages": 4,
					"first": {"href":"/v3/audit_events?page=1&per_page=25"},
					"last":  {"href":"/v3/audit_events?page=4&per_page=25"},
					"next":  {"href":"/v3/audit_events?page=3&per_page=25"},
					"previous": {"href":"/v3/audit_events?page=1&per_page=25"}
				},
				"resources": [
					{"guid":"event-1","type":"x","actor":{"guid":"u","type":"user","name":"u"},"target":{"guid":"t","type":"app","name":"t"},"data":{}}
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/audit_events/cnsi-1?per_page=25&page=2", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/audit_events/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeAuditEvents(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, hits, "single-page passthrough must issue exactly one CAPI call")
	assert.Equal(t, "25", lastPerPage, "per_page must forward verbatim")
	assert.Equal(t, "2", lastPage, "page must forward verbatim")

	var resp StratosPagedResponse[StAuditEvent]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 1)
	assert.Equal(t, 100, resp.Pagination.TotalResults)
	assert.Equal(t, 4, resp.Pagination.TotalPages)
	assert.NotNil(t, resp.Pagination.First)
	assert.NotNil(t, resp.Pagination.Last)
	assert.NotNil(t, resp.Pagination.Next)
	assert.NotNil(t, resp.Pagination.Previous)
}

// TestGetNativeAuditEvents_CountsFastPath verifies ?return=counts:
// upstream is called with per_page=1, the handler returns a flat
// {totalResults} response (no resources fetched), and the response
// shape mirrors the other count-shape endpoints.
func TestGetNativeAuditEvents_CountsFastPath(t *testing.T) {
	var sawPerPage string
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/audit_events" && r.Method == http.MethodGet:
			sawPerPage = r.URL.Query().Get("per_page")
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"pagination": {"total_results": 1234, "total_pages": 1234, "next": null},"resources":[]}`))
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/audit_events/cnsi-1?return=counts", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/audit_events/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeAuditEvents(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "1", sawPerPage, "counts branch must request per_page=1")

	var resp StAuditEventsResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 1234, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}

// TestGetNativeOrgAuditEvents_PerPagePassthrough verifies the org-scoped
// variant: caller's per_page+page forward verbatim, the upstream URL
// carries the organization_guids filter, and exactly one CAPI call is
// issued.
func TestGetNativeOrgAuditEvents_PerPagePassthrough(t *testing.T) {
	hits := 0
	var lastPerPage, lastPage, lastOrgFilter, lastOrderBy string
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/audit_events" && r.Method == http.MethodGet:
			hits++
			lastPerPage = r.URL.Query().Get("per_page")
			lastPage = r.URL.Query().Get("page")
			lastOrgFilter = r.URL.Query().Get("organization_guids")
			lastOrderBy = r.URL.Query().Get("order_by")
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"pagination": {"total_results": 8, "total_pages": 1, "next": null},
				"resources": [
					{"guid":"event-1","type":"audit.app.create","actor":{"guid":"u","type":"user","name":"u"},"target":{"guid":"t","type":"app","name":"t"},"data":{},"organization":{"guid":"org-1","name":"engineering"}}
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/org/cnsi-1/org-1/events?per_page=25&page=2", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/org/:cnsiGuid/:orgGuid/events")
	c.SetParamNames("cnsiGuid", "orgGuid")
	c.SetParamValues("cnsi-1", "org-1")

	require.NoError(t, plugin.getNativeOrgAuditEvents(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, hits)
	assert.Equal(t, "25", lastPerPage)
	assert.Equal(t, "2", lastPage)
	assert.Equal(t, "org-1", lastOrgFilter, "organization_guids filter must be forwarded")
	assert.Equal(t, "-created_at", lastOrderBy, "order_by=-created_at must be forwarded")

	var resp StratosPagedResponse[StAuditEvent]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 1)
	assert.Equal(t, 8, resp.Pagination.TotalResults)
}

// TestGetNativeOrgAuditEvents_CountsFastPath verifies the counts branch
// requests per_page=1 with the organization_guids filter and returns
// only totalResults.
func TestGetNativeOrgAuditEvents_CountsFastPath(t *testing.T) {
	var sawPerPage, sawOrgFilter string
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/audit_events" && r.Method == http.MethodGet:
			sawPerPage = r.URL.Query().Get("per_page")
			sawOrgFilter = r.URL.Query().Get("organization_guids")
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"pagination": {"total_results": 42, "total_pages": 42, "next": null},"resources":[]}`))
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/org/cnsi-1/org-1/events?return=counts", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/org/:cnsiGuid/:orgGuid/events")
	c.SetParamNames("cnsiGuid", "orgGuid")
	c.SetParamValues("cnsi-1", "org-1")

	require.NoError(t, plugin.getNativeOrgAuditEvents(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "1", sawPerPage)
	assert.Equal(t, "org-1", sawOrgFilter)

	var resp StAuditEventsResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 42, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}

// TestGetNativeSpaceAuditEvents_PerPagePassthrough mirrors the org variant
// for the space-scoped endpoint.
func TestGetNativeSpaceAuditEvents_PerPagePassthrough(t *testing.T) {
	hits := 0
	var lastPerPage, lastPage, lastSpaceFilter string
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/audit_events" && r.Method == http.MethodGet:
			hits++
			lastPerPage = r.URL.Query().Get("per_page")
			lastPage = r.URL.Query().Get("page")
			lastSpaceFilter = r.URL.Query().Get("space_guids")
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"pagination": {"total_results": 3, "total_pages": 1, "next": null},
				"resources": [
					{"guid":"event-1","type":"audit.app.create","actor":{"guid":"u","type":"user","name":"u"},"target":{"guid":"t","type":"app","name":"t"},"data":{},"space":{"guid":"space-1","name":"dev"}}
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/space/cnsi-1/space-1/events?per_page=10&page=3", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/space/:cnsiGuid/:spaceGuid/events")
	c.SetParamNames("cnsiGuid", "spaceGuid")
	c.SetParamValues("cnsi-1", "space-1")

	require.NoError(t, plugin.getNativeSpaceAuditEvents(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, hits)
	assert.Equal(t, "10", lastPerPage)
	assert.Equal(t, "3", lastPage)
	assert.Equal(t, "space-1", lastSpaceFilter, "space_guids filter must be forwarded")
}

// TestGetNativeSpaceAuditEvents_CountsFastPath verifies the counts
// branch on the space-scoped endpoint.
func TestGetNativeSpaceAuditEvents_CountsFastPath(t *testing.T) {
	var sawPerPage, sawSpaceFilter string
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/audit_events" && r.Method == http.MethodGet:
			sawPerPage = r.URL.Query().Get("per_page")
			sawSpaceFilter = r.URL.Query().Get("space_guids")
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"pagination": {"total_results": 7, "total_pages": 7, "next": null},"resources":[]}`))
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/space/cnsi-1/space-1/events?return=counts", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/space/:cnsiGuid/:spaceGuid/events")
	c.SetParamNames("cnsiGuid", "spaceGuid")
	c.SetParamValues("cnsi-1", "space-1")

	require.NoError(t, plugin.getNativeSpaceAuditEvents(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "1", sawPerPage)
	assert.Equal(t, "space-1", sawSpaceFilter)

	var resp StAuditEventsResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 7, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}

// TestGetNativeAuditEvents_OmitsPagingWhenAbsent verifies V3-default
// behaviour: when the caller doesn't pass per_page or page, the handler
// MUST NOT inject any per_page/page on the upstream call so V3 applies
// its server defaults.
func TestGetNativeAuditEvents_OmitsPagingWhenAbsent(t *testing.T) {
	var sawPerPage, sawPage bool
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/audit_events" && r.Method == http.MethodGet:
			_, sawPerPage = r.URL.Query()["per_page"]
			_, sawPage = r.URL.Query()["page"]
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"pagination": {"total_results": 0, "total_pages": 0, "next": null},"resources":[]}`))
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
	assert.False(t, sawPerPage, "per_page must be absent on upstream when caller omits it")
	assert.False(t, sawPage, "page must be absent on upstream when caller omits it")
}

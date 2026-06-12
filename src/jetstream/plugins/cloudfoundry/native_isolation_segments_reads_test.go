// src/jetstream/plugins/cloudfoundry/native_isolation_segments_reads_test.go
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

func TestGetNativeIsolationSegments_ReturnsMappedSegments(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/isolation_segments":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 2, "total_pages": 1, "next": nil},
				"resources": []map[string]interface{}{
					{"guid": "iso-shared", "name": "shared", "created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-01T00:00:00Z"},
					{"guid": "iso-dedicated", "name": "dedicated", "created_at": "2024-02-01T00:00:00Z", "updated_at": "2024-02-02T00:00:00Z"},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/isolation_segments/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeIsolationSegments(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "1", rec.Header().Get("X-Stratos-Schema-Version"))

	var resp StratosPagedResponse[StIsolationSegment]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	assert.Equal(t, "iso-shared", resp.Resources[0].GUID)
	assert.Equal(t, "shared", resp.Resources[0].Name)
	assert.Equal(t, "cnsi-1", resp.Resources[0].CnsiGUID)
	assert.Equal(t, "2024-01-01T00:00:00Z", resp.Resources[0].CreatedAt)
	assert.Equal(t, "dedicated", resp.Resources[1].Name)
}

func TestGetNativeIsolationSegments_CountsFastPath(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/isolation_segments":
			assert.Equal(t, "1", r.URL.Query().Get("per_page"), "counts path must request per_page=1")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 3, "total_pages": 3, "next": nil},
				"resources":  []map[string]interface{}{{"guid": "iso-shared", "name": "shared"}},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/isolation_segments/cnsi-1?return=counts", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeIsolationSegments(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StIsolationSegmentsResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 3, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}

func TestGetNativeIsolationSegmentDetail_ReturnsMappedSegment(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/isolation_segments/iso-1":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "iso-1", "name": "dedicated",
				"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/isolation_segments/cnsi-1/iso-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("cnsiGuid", "segmentGuid")
	c.SetParamValues("cnsi-1", "iso-1")

	require.NoError(t, plugin.getNativeIsolationSegmentDetail(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StIsolationSegment
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, "iso-1", resp.GUID)
	assert.Equal(t, "dedicated", resp.Name)
	assert.Equal(t, "cnsi-1", resp.CnsiGUID)
}

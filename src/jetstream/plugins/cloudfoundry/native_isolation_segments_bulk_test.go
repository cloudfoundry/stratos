// src/jetstream/plugins/cloudfoundry/native_isolation_segments_bulk_test.go
package cloudfoundry

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// newEntitleContext builds an echo context for the isolation-segment
// entitle-organizations route with the given JSON body, matching how
// native_routes.go registers the handler.
func newEntitleContext(e *echo.Echo, body string) (echo.Context, *httptest.ResponseRecorder) {
	req := httptest.NewRequest(http.MethodPost,
		"/pp/v1/cf/isolation_segments/cnsi-1/iso-1/relationships/organizations",
		strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/isolation_segments/:cnsiGuid/:isoGuid/relationships/organizations")
	c.SetParamNames("cnsiGuid", "isoGuid")
	c.SetParamValues("cnsi-1", "iso-1")
	return c, rec
}

// TestEntitleIsolationSegmentOrgs_Success verifies the handler POSTs the
// target-org relationships to
// /v3/isolation_segments/{guid}/relationships/organizations and returns the
// CF to-many relationship envelope as 200 JSON.
func TestEntitleIsolationSegmentOrgs_Success(t *testing.T) {
	capiCalls := 0
	var gotBody string
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		capiCalls++
		assert.Equal(t, http.MethodPost, r.Method)
		assert.Equal(t, "/v3/isolation_segments/iso-1/relationships/organizations", r.URL.Path)
		b, _ := io.ReadAll(r.Body)
		gotBody = string(b)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"data":[{"guid":"org-a"},{"guid":"org-b"}]}`))
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
	c, rec := newEntitleContext(e, `{"guids":["org-a","org-b"]}`)

	require.NoError(t, plugin.entitleIsolationSegmentOrgs(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, capiCalls)
	// The org GUIDs are marshalled as to-many relationship data entries.
	assert.Contains(t, gotBody, `"guid":"org-a"`)
	assert.Contains(t, gotBody, `"guid":"org-b"`)
	// The CF relationships envelope is passed through to the client.
	assert.Contains(t, rec.Body.String(), `"guid":"org-a"`)
	assert.NotEmpty(t, rec.Header().Get("X-Stratos-Schema-Version"))
}

// TestEntitleIsolationSegmentOrgs_PropagatesCapiError verifies a non-2xx CF
// error flows through handleCapiError — e.g. the 422 CF returns when an org
// GUID is invalid or already entitled.
func TestEntitleIsolationSegmentOrgs_PropagatesCapiError(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		w.Write([]byte(`{"errors":[{"code":10008,"title":"CF-UnprocessableEntity","detail":"cannot entitle organization to isolation segment"}]}`))
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
	c, rec := newEntitleContext(e, `{"guids":["org-a"]}`)

	require.NoError(t, plugin.entitleIsolationSegmentOrgs(c))
	assert.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	assert.Contains(t, rec.Body.String(), "UnprocessableEntity")
}

// TestEntitleIsolationSegmentOrgs_RejectsEmptyGUIDs verifies the shared
// decodeBulkGUIDs validation rejects an empty guids list before any CF call.
func TestEntitleIsolationSegmentOrgs_RejectsEmptyGUIDs(t *testing.T) {
	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1"},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	c, _ := newEntitleContext(e, `{"guids":[]}`)

	err := plugin.entitleIsolationSegmentOrgs(c)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
}

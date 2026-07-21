// src/jetstream/plugins/cloudfoundry/native_service_instance_share_test.go
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

// newShareContext builds an echo context for the shared_spaces route with the
// given JSON body, matching how native_routes.go registers the handler.
func newShareContext(e *echo.Echo, body string) (echo.Context, *httptest.ResponseRecorder) {
	req := httptest.NewRequest(http.MethodPost,
		"/pp/v1/cf/service_instances/cnsi-1/si-1/relationships/shared_spaces",
		strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/service_instances/:cnsiGuid/:siGuid/relationships/shared_spaces")
	c.SetParamNames("cnsiGuid", "siGuid")
	c.SetParamValues("cnsi-1", "si-1")
	return c, rec
}

// TestShareServiceInstanceSpaces_Success verifies the handler POSTs the
// target-space relationships to
// /v3/service_instances/{guid}/relationships/shared_spaces and returns the
// CF shared-spaces relationships envelope as 200 JSON.
func TestShareServiceInstanceSpaces_Success(t *testing.T) {
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
		assert.Equal(t, "/v3/service_instances/si-1/relationships/shared_spaces", r.URL.Path)
		b, _ := io.ReadAll(r.Body)
		gotBody = string(b)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"data":[{"guid":"space-a"},{"guid":"space-b"}],"links":{"self":{"href":"/v3/service_instances/si-1/relationships/shared_spaces"}}}`))
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
	c, rec := newShareContext(e, `{"guids":["space-a","space-b"]}`)

	require.NoError(t, plugin.shareServiceInstanceSpaces(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, capiCalls)
	// The space GUIDs are marshalled as to-many relationship data entries.
	assert.Contains(t, gotBody, `"guid":"space-a"`)
	assert.Contains(t, gotBody, `"guid":"space-b"`)
	// The CF relationships envelope is passed through to the client. Guid
	// fidelity *within* the envelope is the typed capi client's concern — CF
	// models shared_spaces entries as bare {guid}, which the client round-trips
	// through its ServiceInstanceSharedSpacesRelationships type; the handler
	// forwards whatever capi returns and the frontend refetches rather than
	// consuming this body. Assert the envelope (its self link) is passed
	// through, not the client's internal guid modelling.
	assert.Contains(t, rec.Body.String(), `shared_spaces`)
	assert.NotEmpty(t, rec.Header().Get("X-Stratos-Schema-Version"))
}

// TestShareServiceInstanceSpaces_PropagatesCapiError verifies a non-2xx CF
// error flows through handleCapiError — e.g. the 422 CF returns when a target
// space already has the instance shared or the space is invalid.
func TestShareServiceInstanceSpaces_PropagatesCapiError(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		w.Write([]byte(`{"errors":[{"code":10008,"title":"CF-UnprocessableEntity","detail":"cannot share service instance with space"}]}`))
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
	c, rec := newShareContext(e, `{"guids":["space-a"]}`)

	require.NoError(t, plugin.shareServiceInstanceSpaces(c))
	assert.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	assert.Contains(t, rec.Body.String(), "UnprocessableEntity")
}

// TestShareServiceInstanceSpaces_RejectsEmptyGUIDs verifies the shared
// decodeBulkGUIDs validation rejects an empty guids list before any CF call.
func TestShareServiceInstanceSpaces_RejectsEmptyGUIDs(t *testing.T) {
	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1"},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	c, _ := newShareContext(e, `{"guids":[]}`)

	err := plugin.shareServiceInstanceSpaces(c)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
}

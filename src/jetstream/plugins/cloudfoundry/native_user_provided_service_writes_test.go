// src/jetstream/plugins/cloudfoundry/native_user_provided_service_writes_test.go
package cloudfoundry

import (
	"encoding/json"
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

// upsTestServer captures the upstream method/body to assert that the
// handler issues v3 calls with type=user-provided and a v3
// relationships envelope.
type upsTestServer struct {
	*httptest.Server
	lastMethod string
	lastBody   string
	lastPath   string
}

func newUPSTestServer(t *testing.T) *upsTestServer {
	t.Helper()
	s := &upsTestServer{}
	s.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		s.lastMethod = r.Method
		s.lastPath = r.URL.Path
		if r.Body != nil {
			b, _ := io.ReadAll(r.Body)
			s.lastBody = string(b)
		}
		w.Header().Set("Content-Type", "application/json")

		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_instances" && r.Method == http.MethodPost:
			// User-provided sync create — return the created resource directly.
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":       "ups-1",
				"name":       "my-ups",
				"type":       "user-provided",
				"tags":       []string{"red"},
				"created_at": "2024-01-01T00:00:00Z",
				"updated_at": "2024-01-01T00:00:00Z",
				"relationships": map[string]interface{}{
					"space": map[string]interface{}{"data": map[string]interface{}{"guid": "space-1"}},
				},
				"syslog_drain_url":  "https://syslog.example",
				"route_service_url": "https://route.example",
			})
		case strings.HasPrefix(r.URL.Path, "/v3/service_instances/") && r.Method == http.MethodPatch:
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":       "ups-1",
				"name":       "renamed-ups",
				"type":       "user-provided",
				"tags":       []string{"blue"},
				"created_at": "2024-01-01T00:00:00Z",
				"updated_at": "2024-01-02T00:00:00Z",
				"relationships": map[string]interface{}{
					"space": map[string]interface{}{"data": map[string]interface{}{"guid": "space-1"}},
				},
				"syslog_drain_url": "https://syslog2.example",
			})
		default:
			http.NotFound(w, r)
		}
	}))
	return s
}

func newUPSPlugin(serverURL string) *CloudFoundrySpecification {
	return &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID: "user-1",
			cnsiRecord: api.CNSIRecord{
				GUID:        "test-cnsi",
				APIEndpoint: mustParseURL(serverURL),
			},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}
}

func newUPSContext(e *echo.Echo, method, target, body string) (echo.Context, *httptest.ResponseRecorder) {
	var bodyReader io.Reader
	if body != "" {
		bodyReader = strings.NewReader(body)
	}
	req := httptest.NewRequest(method, target, bodyReader)
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	return ctx, rec
}

func TestCreateUserProvidedServiceInstance(t *testing.T) {
	ts := newUPSTestServer(t)
	defer ts.Close()

	body := `{"name":"my-ups","spaceGuid":"space-1","tags":["red"],"credentials":{"username":"u","password":"p"},"syslogDrainUrl":"https://syslog.example","routeServiceUrl":"https://route.example"}`

	e := echo.New()
	ctx, rec := newUPSContext(e, http.MethodPost, "/pp/v1/cf/user_provided_service_instances/test-cnsi", body)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")
	plugin := newUPSPlugin(ts.URL)

	require.NoError(t, plugin.createUserProvidedServiceInstance(ctx))
	assert.Equal(t, http.StatusCreated, rec.Code)

	assert.Equal(t, "/v3/service_instances", ts.lastPath)
	assert.Equal(t, http.MethodPost, ts.lastMethod)

	var sentToCAPI map[string]interface{}
	require.NoError(t, json.Unmarshal([]byte(ts.lastBody), &sentToCAPI))
	assert.Equal(t, "user-provided", sentToCAPI["type"], "create body must carry the user-provided type discriminator")
	assert.Equal(t, "my-ups", sentToCAPI["name"])
	relationships, ok := sentToCAPI["relationships"].(map[string]interface{})
	require.True(t, ok)
	space, ok := relationships["space"].(map[string]interface{})
	require.True(t, ok)
	data, ok := space["data"].(map[string]interface{})
	require.True(t, ok)
	assert.Equal(t, "space-1", data["guid"], "space must travel via v3 relationships envelope, not flat space_guid")

	var resp StServiceInstance
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "ups-1", resp.GUID)
	assert.Equal(t, "user-provided", resp.Type)
	assert.Equal(t, "https://syslog.example", resp.SyslogDrainURL)
	assert.Equal(t, "https://route.example", resp.RouteServiceURL)
}

func TestCreateUserProvidedServiceInstance_RequiresName(t *testing.T) {
	ts := newUPSTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, _ := newUPSContext(e, http.MethodPost, "/pp/v1/cf/user_provided_service_instances/test-cnsi", `{"spaceGuid":"space-1"}`)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")
	plugin := newUPSPlugin(ts.URL)

	err := plugin.createUserProvidedServiceInstance(ctx)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
}

func TestUpdateUserProvidedServiceInstance(t *testing.T) {
	ts := newUPSTestServer(t)
	defer ts.Close()

	body := `{"name":"renamed-ups","tags":["blue"],"syslogDrainUrl":"https://syslog2.example"}`

	e := echo.New()
	ctx, rec := newUPSContext(e, http.MethodPatch, "/pp/v1/cf/user_provided_service_instances/test-cnsi/ups-1", body)
	ctx.SetParamNames("cnsiGuid", "siGuid")
	ctx.SetParamValues("test-cnsi", "ups-1")
	plugin := newUPSPlugin(ts.URL)

	require.NoError(t, plugin.updateUserProvidedServiceInstance(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	assert.Equal(t, "/v3/service_instances/ups-1", ts.lastPath)
	assert.Equal(t, http.MethodPatch, ts.lastMethod, "v3 update is PATCH, not v2's PUT")

	var sentToCAPI map[string]interface{}
	require.NoError(t, json.Unmarshal([]byte(ts.lastBody), &sentToCAPI))
	assert.Equal(t, "renamed-ups", sentToCAPI["name"])
	// type discriminator should NOT be on update — v3 forbids changing it
	_, hasType := sentToCAPI["type"]
	assert.False(t, hasType, "update body must not carry type — v3 disallows changing the discriminator")

	var resp StServiceInstance
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "ups-1", resp.GUID)
	assert.Equal(t, "renamed-ups", resp.Name)
	assert.Equal(t, "https://syslog2.example", resp.SyslogDrainURL)
}

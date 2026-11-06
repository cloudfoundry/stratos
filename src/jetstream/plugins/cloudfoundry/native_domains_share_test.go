// src/jetstream/plugins/cloudfoundry/native_domains_share_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// newShareDomainContext builds an echo context for the bulk share handler
// with a JSON {"guids":[...]} body and the cnsiGuid/domainGuid path params.
func newShareDomainContext(e *echo.Echo, cnsiGUID, domainGUID, body string) (*echo.Context, *httptest.ResponseRecorder) {
	req := httptest.NewRequest(http.MethodPost,
		"/pp/v1/cf/domains/"+cnsiGUID+"/"+domainGUID+"/relationships/shared_organizations",
		strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetPathValues(echo.PathValues{{Name: "cnsiGuid", Value: cnsiGUID}, {Name: "domainGuid", Value: domainGUID}})
	return ctx, rec
}

// shareDomainTestServer mimics CF v3's
// POST /v3/domains/{guid}/relationships/shared_organizations. On success it
// echoes the posted org GUIDs back as the resulting to-many relationship (CF
// returns the full shared-org set). When failMsg is set it returns a 422 with
// a CF error envelope so the handler's error path can be exercised.
func shareDomainTestServer(t *testing.T, domainGUID, failMsg string) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/domains/" + domainGUID + "/relationships/shared_organizations":
			if r.Method != http.MethodPost {
				http.Error(w, "unexpected method", http.StatusMethodNotAllowed)
				return
			}
			if failMsg != "" {
				w.WriteHeader(http.StatusUnprocessableEntity)
				_, _ = w.Write([]byte(`{"errors":[{"code":10008,"title":"CF-UnprocessableEntity","detail":"` + failMsg + `"}]}`))
				return
			}
			var body struct {
				Data []struct {
					GUID string `json:"guid"`
				} `json:"data"`
			}
			_ = json.NewDecoder(r.Body).Decode(&body)
			// Echo the posted org GUIDs back as the relationship data.
			out := map[string]interface{}{"data": body.Data}
			_ = json.NewEncoder(w).Encode(out)
		default:
			http.NotFound(w, r)
		}
	}))
}

func TestShareDomainOrgs_Success(t *testing.T) {
	const domainGUID = "dom-share-1"
	ts := shareDomainTestServer(t, domainGUID, "")
	defer ts.Close()

	e := echo.New()
	ctx, rec := newShareDomainContext(e, "test-cnsi", domainGUID, `{"guids":["org-a","org-b"]}`)
	plugin := newDomainsPlugin(ts.URL)

	require.NoError(t, plugin.shareDomainOrgs(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp struct {
		Data []struct {
			GUID string `json:"guid"`
		} `json:"data"`
	}
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	guids := make([]string, 0, len(resp.Data))
	for _, d := range resp.Data {
		guids = append(guids, d.GUID)
	}
	assert.ElementsMatch(t, []string{"org-a", "org-b"}, guids,
		"response should carry the resulting shared-org relationship")
}

func TestShareDomainOrgs_MissingParams(t *testing.T) {
	e := echo.New()
	ctx, _ := newShareDomainContext(e, "", "", `{"guids":["org-a"]}`)
	plugin := newDomainsPlugin("http://unused")

	err := plugin.shareDomainOrgs(ctx)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
}

func TestShareDomainOrgs_EmptyGuids(t *testing.T) {
	e := echo.New()
	ctx, _ := newShareDomainContext(e, "test-cnsi", "dom-x", `{"guids":[]}`)
	plugin := newDomainsPlugin("http://unused")

	err := plugin.shareDomainOrgs(ctx)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
}

func TestShareDomainOrgs_CapiError(t *testing.T) {
	const domainGUID = "dom-share-err"
	ts := shareDomainTestServer(t, domainGUID, "cannot share internal domain")
	defer ts.Close()

	e := echo.New()
	ctx, rec := newShareDomainContext(e, "test-cnsi", domainGUID, `{"guids":["org-a"]}`)
	plugin := newDomainsPlugin(ts.URL)

	// handleCapiError writes the response directly and returns nil.
	require.NoError(t, plugin.shareDomainOrgs(ctx))
	assert.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	assert.Contains(t, rec.Body.String(), "cannot share internal domain")
}

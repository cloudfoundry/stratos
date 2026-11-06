// src/jetstream/plugins/cloudfoundry/native_security_groups_bulk_test.go
package cloudfoundry

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// securityGroupBulkVariant captures the two lifecycle variants so the
// running- and staging-space handlers are exercised by the same table: only
// the handler under test and the CF relationship sub-path differ.
type securityGroupBulkVariant struct {
	name    string
	relPath string // CF v3 relationship sub-path: running_spaces | staging_spaces
	handler func(*CloudFoundrySpecification) echo.HandlerFunc
}

var securityGroupBulkVariants = []securityGroupBulkVariant{
	{
		name:    "running",
		relPath: "/v3/security_groups/sg-1/relationships/running_spaces",
		handler: func(p *CloudFoundrySpecification) echo.HandlerFunc { return p.bindSecurityGroupRunningSpaces },
	},
	{
		name:    "staging",
		relPath: "/v3/security_groups/sg-1/relationships/staging_spaces",
		handler: func(p *CloudFoundrySpecification) echo.HandlerFunc { return p.bindSecurityGroupStagingSpaces },
	},
}

// TestBindSecurityGroupSpaces_HappyPath verifies both variants POST the space
// GUIDs as a {"data":[{"guid":...}]} relationship body to the correct CF
// relationship sub-resource and pass the returned to-many relationship
// through as a 200 body.
func TestBindSecurityGroupSpaces_HappyPath(t *testing.T) {
	for _, v := range securityGroupBulkVariants {
		t.Run(v.name, func(t *testing.T) {
			var gotBody string
			capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/v3" {
					w.Header().Set("Content-Type", "application/json")
					w.Write([]byte(`{"links":{}}`))
					return
				}
				require.Equal(t, http.MethodPost, r.Method)
				require.Equal(t, v.relPath, r.URL.Path)
				body, _ := io.ReadAll(r.Body)
				gotBody = string(body)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`{"data":[{"guid":"space-1"},{"guid":"space-2"}]}`))
			}))
			defer capiServer.Close()

			plugin := newBulkTestPlugin(capiServer.URL)
			c, rec := newSecurityGroupBulkContext(v.relPath,
				`{"guids":["space-1","space-2"]}`)

			require.NoError(t, v.handler(plugin)(c))
			assert.Equal(t, http.StatusOK, rec.Code)
			assert.Equal(t, stratosSchemaVersion, rec.Header().Get("X-Stratos-Schema-Version"))

			assert.JSONEq(t, `{"data":[{"guid":"space-1"},{"guid":"space-2"}]}`, gotBody,
				"space GUIDs must be sent as a to-many relationship body")

			var rel capi.ToManyRelationship
			require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &rel))
			require.Len(t, rel.Data, 2)
			assert.Equal(t, "space-1", rel.Data[0].GUID)
			assert.Equal(t, "space-2", rel.Data[1].GUID)
		})
	}
}

// TestBindSecurityGroupSpaces_PropagatesCapiError verifies an upstream CF
// error flows through handleCapiError (status mirrored, envelope preserved)
// for both variants rather than surfacing as a bare 500.
func TestBindSecurityGroupSpaces_PropagatesCapiError(t *testing.T) {
	for _, v := range securityGroupBulkVariants {
		t.Run(v.name, func(t *testing.T) {
			capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/v3" {
					w.Header().Set("Content-Type", "application/json")
					w.Write([]byte(`{"links":{}}`))
					return
				}
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnprocessableEntity)
				w.Write([]byte(`{"errors":[{"code":10008,"title":"CF-UnprocessableEntity","detail":"Space not found"}]}`))
			}))
			defer capiServer.Close()

			plugin := newBulkTestPlugin(capiServer.URL)
			c, rec := newSecurityGroupBulkContext(v.relPath,
				`{"guids":["missing-space"]}`)

			require.NoError(t, v.handler(plugin)(c))
			assert.Equal(t, http.StatusUnprocessableEntity, rec.Code)
			assert.Contains(t, rec.Body.String(), "UnprocessableEntity")
			assert.Contains(t, rec.Body.String(), "Space not found")
		})
	}
}

// TestBindSecurityGroupSpaces_Validation verifies the shared {"guids":[...]}
// body validation: empty and missing guids reject with 400 before any CF
// call, for both variants.
func TestBindSecurityGroupSpaces_Validation(t *testing.T) {
	capiHits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capiHits++
		http.NotFound(w, r)
	}))
	defer capiServer.Close()

	cases := []struct {
		name string
		body string
	}{
		{"empty guids", `{"guids":[]}`},
		{"missing guids", `{}`},
	}

	for _, v := range securityGroupBulkVariants {
		for _, tc := range cases {
			t.Run(v.name+"/"+tc.name, func(t *testing.T) {
				plugin := newBulkTestPlugin(capiServer.URL)
				c, _ := newSecurityGroupBulkContext(v.relPath, tc.body)

				err := v.handler(plugin)(c)
				require.Error(t, err)
				httpErr, ok := err.(*echo.HTTPError)
				require.True(t, ok, "expected *echo.HTTPError, got %T", err)
				assert.Equal(t, http.StatusBadRequest, httpErr.Code)
			})
		}
	}
	assert.Equal(t, 0, capiHits, "validation must reject before any CF call")
}

// newSecurityGroupBulkContext builds an echo context for a security-group
// bulk-bind POST with cnsiGuid=cnsi-1 and sgGuid=sg-1 path params (the sibling
// newBulkContext only wires cnsiGuid).
func newSecurityGroupBulkContext(relPath, body string) (*echo.Context, *httptest.ResponseRecorder) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1"+relPath, strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPathValues(echo.PathValues{{Name: "cnsiGuid", Value: "cnsi-1"}, {Name: "sgGuid", Value: "sg-1"}})
	return c, rec
}

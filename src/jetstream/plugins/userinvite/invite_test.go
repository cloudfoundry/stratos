package userinvite

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// fakeInviteProxy is a hand-rolled stub for the narrow inviteProxy interface.
// Each test installs handlers per (method,url) prefix and asserts the
// recorded request afterwards.
type fakeInviteProxy struct {
	calls []recordedCall
	resp  func(method, requestURL string, body []byte) (*api.CNSIRequest, error)
	user  *api.ConnectedUser
}

type recordedCall struct {
	method, url string
	body        []byte
}

func (f *fakeInviteProxy) DoProxySingleRequest(cnsiGUID, userGUID, method, requestURL string, headers http.Header, body []byte) (*api.CNSIRequest, error) {
	f.calls = append(f.calls, recordedCall{method: method, url: requestURL, body: body})
	if f.resp == nil {
		return &api.CNSIRequest{StatusCode: http.StatusOK}, nil
	}
	return f.resp(method, requestURL, body)
}

func (f *fakeInviteProxy) GetCNSIUser(cnsiGUID, userGUID string) (*api.ConnectedUser, bool) {
	if f.user == nil {
		return nil, false
	}
	return f.user, true
}

// v3UniquenessError returns a CF v3 error envelope encoding a UniquenessError.
func v3UniquenessError(detail string) []byte {
	body, _ := json.Marshal(v3ErrorEnvelope{Errors: []v3ErrorDetail{{
		Detail: detail, Title: "CF-UniquenessError", Code: 10016,
	}}})
	return body
}

// v3GenericError returns a CF v3 error envelope with a non-uniqueness error.
func v3GenericError(detail, title string, code int) []byte {
	body, _ := json.Marshal(v3ErrorEnvelope{Errors: []v3ErrorDetail{{
		Detail: detail, Title: title, Code: code,
	}}})
	return body
}

// TestCreateCloudFoundryUser_HitsV3UsersOnSuccess verifies the handler
// POSTs to /v3/users with a {guid} body and treats 201 as success.
func TestCreateCloudFoundryUser_HitsV3UsersOnSuccess(t *testing.T) {
	proxy := &fakeInviteProxy{
		resp: func(method, url string, body []byte) (*api.CNSIRequest, error) {
			return &api.CNSIRequest{StatusCode: http.StatusCreated}, nil
		},
	}
	invite := &UserInvite{testProxy: proxy}

	cfErr, err := invite.CreateCloudFoundryUser("cnsi-1", "user-1", "new-guid")
	require.NoError(t, err)
	assert.Nil(t, cfErr)
	require.Len(t, proxy.calls, 1)
	assert.Equal(t, http.MethodPost, proxy.calls[0].method)
	assert.Equal(t, "/v3/users", proxy.calls[0].url)
	assert.JSONEq(t, `{"guid":"new-guid"}`, string(proxy.calls[0].body))
}

// TestCreateCloudFoundryUser_TreatsUniquenessAsSuccess verifies that a 422
// response with a v3 UniquenessError envelope is treated as idempotent
// success (user already exists).
func TestCreateCloudFoundryUser_TreatsUniquenessAsSuccess(t *testing.T) {
	proxy := &fakeInviteProxy{
		resp: func(method, url string, body []byte) (*api.CNSIRequest, error) {
			return &api.CNSIRequest{
				StatusCode: http.StatusUnprocessableEntity,
				Response:   v3UniquenessError("User must be unique"),
			}, nil
		},
	}
	invite := &UserInvite{testProxy: proxy}

	cfErr, err := invite.CreateCloudFoundryUser("cnsi-1", "user-1", "new-guid")
	require.NoError(t, err)
	assert.Nil(t, cfErr)
}

// TestCreateCloudFoundryUser_PropagatesOtherErrors verifies non-uniqueness
// 422s surface as errors with the parsed CFError attached.
func TestCreateCloudFoundryUser_PropagatesOtherErrors(t *testing.T) {
	proxy := &fakeInviteProxy{
		resp: func(method, url string, body []byte) (*api.CNSIRequest, error) {
			return &api.CNSIRequest{
				StatusCode: http.StatusUnprocessableEntity,
				Response:   v3GenericError("bad request", "CF-InvalidRequest", 10004),
			}, nil
		},
	}
	invite := &UserInvite{testProxy: proxy}

	cfErr, err := invite.CreateCloudFoundryUser("cnsi-1", "user-1", "new-guid")
	require.Error(t, err)
	require.NotNil(t, cfErr)
	assert.Equal(t, "CF-InvalidRequest", cfErr.ErrorCode)
}

// TestAssociateUserWithOrg_PostsV3RoleEnvelope verifies the handler POSTs to
// /v3/roles with the v3 organization_user role envelope.
func TestAssociateUserWithOrg_PostsV3RoleEnvelope(t *testing.T) {
	proxy := &fakeInviteProxy{
		resp: func(method, url string, body []byte) (*api.CNSIRequest, error) {
			return &api.CNSIRequest{StatusCode: http.StatusCreated}, nil
		},
	}
	invite := &UserInvite{testProxy: proxy}

	cfErr, err := invite.AssociateUserWithOrg("cnsi-1", "user-1", "new-guid", "org-1")
	require.NoError(t, err)
	assert.Nil(t, cfErr)
	require.Len(t, proxy.calls, 1)
	assert.Equal(t, http.MethodPost, proxy.calls[0].method)
	assert.Equal(t, "/v3/roles", proxy.calls[0].url)
	assert.JSONEq(t,
		`{"type":"organization_user","relationships":{"user":{"data":{"guid":"new-guid"}},"organization":{"data":{"guid":"org-1"}}}}`,
		string(proxy.calls[0].body),
	)
}

// TestAssociateUserWithOrg_TreatsDuplicateRoleAsSuccess verifies that a 422
// uniqueness error from /v3/roles is treated as success (already assigned).
func TestAssociateUserWithOrg_TreatsDuplicateRoleAsSuccess(t *testing.T) {
	proxy := &fakeInviteProxy{
		resp: func(method, url string, body []byte) (*api.CNSIRequest, error) {
			return &api.CNSIRequest{
				StatusCode: http.StatusUnprocessableEntity,
				Response:   v3UniquenessError("Role already exists"),
			}, nil
		},
	}
	invite := &UserInvite{testProxy: proxy}

	cfErr, err := invite.AssociateUserWithOrg("cnsi-1", "user-1", "new-guid", "org-1")
	require.NoError(t, err)
	assert.Nil(t, cfErr)
}

// TestAssociateSpaceRoleForUser_MapsV2NameToV3Type verifies all three v2
// plural role names are mapped to the correct v3 role type and POSTed to
// /v3/roles with the space relationship.
func TestAssociateSpaceRoleForUser_MapsV2NameToV3Type(t *testing.T) {
	cases := []struct {
		v2Name string
		v3Type string
	}{
		{"auditors", "space_auditor"},
		{"managers", "space_manager"},
		{"developers", "space_developer"},
	}
	for _, tc := range cases {
		t.Run(tc.v2Name, func(t *testing.T) {
			proxy := &fakeInviteProxy{
				resp: func(method, url string, body []byte) (*api.CNSIRequest, error) {
					return &api.CNSIRequest{StatusCode: http.StatusCreated}, nil
				},
			}
			invite := &UserInvite{testProxy: proxy}

			cfErr, err := invite.AssociateSpaceRoleForUser("cnsi-1", "user-1", "new-guid", "space-1", tc.v2Name)
			require.NoError(t, err)
			assert.Nil(t, cfErr)
			require.Len(t, proxy.calls, 1)
			assert.Equal(t, "/v3/roles", proxy.calls[0].url)
			assert.True(t, strings.Contains(string(proxy.calls[0].body), `"type":"`+tc.v3Type+`"`),
				"expected v3 role type %s in body, got %s", tc.v3Type, string(proxy.calls[0].body))
			assert.True(t, strings.Contains(string(proxy.calls[0].body), `"space"`),
				"expected space relationship in body, got %s", string(proxy.calls[0].body))
		})
	}
}

// TestAssociateSpaceRoleForUser_RejectsUnknownRoleName verifies an unmapped
// role name surfaces as an error rather than silently POSTing garbage.
func TestAssociateSpaceRoleForUser_RejectsUnknownRoleName(t *testing.T) {
	proxy := &fakeInviteProxy{}
	invite := &UserInvite{testProxy: proxy}

	cfErr, err := invite.AssociateSpaceRoleForUser("cnsi-1", "user-1", "new-guid", "space-1", "bogus")
	require.Error(t, err)
	assert.Nil(t, cfErr)
	assert.Empty(t, proxy.calls, "must not call upstream for unknown role")
}

// TestAssociateSpaceRoleForUser_TreatsDuplicateAsSuccess verifies idempotency
// on the space-role path.
func TestAssociateSpaceRoleForUser_TreatsDuplicateAsSuccess(t *testing.T) {
	proxy := &fakeInviteProxy{
		resp: func(method, url string, body []byte) (*api.CNSIRequest, error) {
			return &api.CNSIRequest{
				StatusCode: http.StatusUnprocessableEntity,
				Response:   v3UniquenessError("Role already exists"),
			}, nil
		},
	}
	invite := &UserInvite{testProxy: proxy}

	cfErr, err := invite.AssociateSpaceRoleForUser("cnsi-1", "user-1", "new-guid", "space-1", "developers")
	require.NoError(t, err)
	assert.Nil(t, cfErr)
}

// TestRequireOrgManager_AllowsWhenManagerRolePresent verifies the v3
// list-roles call is GET /v3/roles?organization_guids=...&user_guids=... and
// that a resource with type=organization_manager passes the check.
func TestRequireOrgManager_AllowsWhenManagerRolePresent(t *testing.T) {
	proxy := &fakeInviteProxy{
		resp: func(method, url string, body []byte) (*api.CNSIRequest, error) {
			body2, _ := json.Marshal(v3RolesResponse{
				Resources: []v3RoleResource{
					{GUID: "r1", Type: "organization_user"},
					{GUID: "r2", Type: "organization_manager"},
				},
			})
			return &api.CNSIRequest{StatusCode: http.StatusOK, Response: body2}, nil
		},
	}
	invite := &UserInvite{testProxy: proxy}

	err := invite.requireOrgManager("cnsi-1", "user-1", "org-1", "cf-user-1")
	require.NoError(t, err)
	require.Len(t, proxy.calls, 1)
	assert.Equal(t, http.MethodGet, proxy.calls[0].method)
	assert.Contains(t, proxy.calls[0].url, "organization_guids=org-1")
	assert.Contains(t, proxy.calls[0].url, "user_guids=cf-user-1")
}

// TestRequireOrgManager_DeniesWhenManagerRoleAbsent verifies that a list
// without organization_manager surfaces an error.
func TestRequireOrgManager_DeniesWhenManagerRoleAbsent(t *testing.T) {
	proxy := &fakeInviteProxy{
		resp: func(method, url string, body []byte) (*api.CNSIRequest, error) {
			body2, _ := json.Marshal(v3RolesResponse{
				Resources: []v3RoleResource{
					{GUID: "r1", Type: "organization_user"},
					{GUID: "r2", Type: "organization_billing_manager"},
				},
			})
			return &api.CNSIRequest{StatusCode: http.StatusOK, Response: body2}, nil
		},
	}
	invite := &UserInvite{testProxy: proxy}

	err := invite.requireOrgManager("cnsi-1", "user-1", "org-1", "cf-user-1")
	require.Error(t, err)
}

// TestRequireOrgManager_DeniesOnNon200 verifies upstream non-200s deny.
func TestRequireOrgManager_DeniesOnNon200(t *testing.T) {
	proxy := &fakeInviteProxy{
		resp: func(method, url string, body []byte) (*api.CNSIRequest, error) {
			return &api.CNSIRequest{StatusCode: http.StatusForbidden}, nil
		},
	}
	invite := &UserInvite{testProxy: proxy}

	err := invite.requireOrgManager("cnsi-1", "user-1", "org-1", "cf-user-1")
	require.Error(t, err)
}

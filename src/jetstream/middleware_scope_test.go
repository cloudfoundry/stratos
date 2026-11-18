package main

import (
	"net/http"
	"testing"

	"github.com/labstack/echo/v5"
	"go.uber.org/mock/gomock"

	mock_api "github.com/cloudfoundry/stratos/src/jetstream/api/mock"
)

func TestEndpointAdminMiddlewareMatchesTheScopeExactly(t *testing.T) {
	t.Parallel()

	cases := []struct {
		name   string
		scopes []string
		allow  bool
	}{
		{"the scope", []string{"openid", "stratos.endpointadmin"}, true},
		{"a longer scope", []string{"stratos.endpointadmin_read"}, false},
		{"a scope ending in it", []string{"my.stratos.endpointadmin"}, false},
		{"two scopes that join into it", []string{"stratos.endpoint", "admin"}, false},
		{"no scopes", []string{}, false},
	}

	for i, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			mockStratosAuth := mock_api.NewMockStratosAuth(ctrl)
			pp, db, _ := setupPortalProxyWithAuthService(mockStratosAuth)
			defer db.Close()

			user := setupMockUser(mockUserGUID+string(rune('a'+i)), false, tc.scopes)
			ctx, _ := makeNewRequestWithParams("POST", map[string]string{})
			if err := pp.setSessionValues(ctx, user.SessionValues); err != nil {
				t.Fatalf("unable to set the session user: %v", err)
			}
			mockStratosAuth.EXPECT().GetUser(gomock.Eq(user.ConnectedUser.GUID)).Return(user.ConnectedUser, nil)

			reached := false
			err := pp.endpointAdminMiddleware(func(c *echo.Context) error {
				reached = true
				return c.String(http.StatusOK, "ok")
			})(ctx)

			if reached != tc.allow {
				t.Errorf("scopes %v: handler reached = %v, want %v (err %v)", tc.scopes, reached, tc.allow, err)
			}
		})
	}
}

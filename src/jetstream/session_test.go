package main

import (
	"errors"
	"net/http"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/gorilla/sessions"
	"github.com/labstack/echo/v4"
	. "github.com/smartystreets/goconvey/convey"
)

/*
Portal Proxy mock that errors out when looking for a session
*/
type sessionTestPortalProxy struct {
	portalProxy
}

func (*sessionTestPortalProxy) GetSession(_ echo.Context) (*sessions.Session, error) {
	return nil, errors.New("Test error")
}

/*
Echo context mock that will make everything work and bypass all session checks
*/
type testEchoContextBypass struct {
	echo.Context
	JSONResponseVerifier func(statusCode int, input any) error
}

func (*testEchoContextBypass) Request() *http.Request {
	return &http.Request{}
}

func (*testEchoContextBypass) Get(_ string) any {
	return nil
}

func (*testEchoContextBypass) Set(_ string, _ any) {}

func (c *testEchoContextBypass) JSON(statusCode int, input any) error {
	return c.JSONResponseVerifier(statusCode, input)
}

type testSessionStoreFailure struct {
	api.SessionStorer
}

func (p *testSessionStoreFailure) Get(_ *http.Request, _ string) (*sessions.Session, error) {
	return nil, errors.New("Test error")
}

type testSessionStoreSuccessful struct {
	api.SessionStorer
}

func (p *testSessionStoreSuccessful) Get(_ *http.Request, _ string) (*sessions.Session, error) {
	return &sessions.Session{
		ID: "00000000-0000-0000-0000-000000000001",
		Values: map[any]any{
			"exp":     int64(9223372036854775807),
			"user_id": "mockuid",
		},
		Options: &sessions.Options{},
		IsNew:   false,
	}, nil
}

type testStratosAuthService struct {
	api.StratosAuth
}

func (s *testStratosAuthService) BeforeVerifySession(c echo.Context) {}
func (s *testStratosAuthService) VerifySession(c echo.Context, sessionUser string, expiryTime int64) error {
	return nil
}

type testStoreFactory struct {
	api.StoreFactory
}

func (s *testStoreFactory) TokenStore() (api.TokenRepository, error) {
	return &testTokenStore{}, nil
}

type testTokenStore struct {
	api.TokenRepository
}

func (s *testTokenStore) FindAuthToken(userGUID string, encryptionKey []byte) (api.TokenRecord, error) {
	return api.TokenRecord{
		TokenGUID:      "mockTokenGUID",
		AuthToken:      "mockAuthToken",
		RefreshToken:   "mockRefreshToken",
		TokenExpiry:    1,
		Disconnected:   false,
		AuthType:       "mockAuthType",
		Metadata:       "mockMetadata",
		SystemShared:   false,
		LinkedGUID:     "mockLinkedGUID",
		Certificate:    "mockCertificate",
		CertificateKey: "mockCertificateKey",
		Enabled:        false,
	}, nil
}

func TestSession(t *testing.T) {

	Convey("Check error struct", t, func() {

		err := &SessionValueNotFound{
			msg: "TEST MESSAGE",
		}

		So(err.Error(), ShouldEqual, "Session value not found TEST MESSAGE")
	})

	Convey("Check error conditions when no session avaialable", t, func() {

		pp := &portalProxy{
			SessionStore: &testSessionStoreFailure{},
		}

		ctx := &testEchoContextBypass{}

		_, err := pp.GetSession(ctx)
		So(err, ShouldNotBeNil)

		v, err := pp.GetSessionValue(ctx, "TEST_VALUE")
		So(err, ShouldNotBeNil)
		So(v, ShouldBeNil)

		err = pp.setSessionValues(ctx, nil)
		So(err, ShouldNotBeNil)

		err = pp.unsetSessionValue(ctx, "test")
		So(err, ShouldNotBeNil)

		err = pp.clearSession(ctx)
		So(err, ShouldNotBeNil)
	})

	Convey("Return the token on request for the current session when session is valid", t, func() {
		pp := &portalProxy{
			SessionStore:       &testSessionStoreSuccessful{},
			StratosAuthService: &testStratosAuthService{},
			StoreFactory:       &testStoreFactory{},
		}

		ctx := &testEchoContextBypass{JSONResponseVerifier: func(s int, i any) error {
			So(s, ShouldEqual, http.StatusOK)
			t, ok := i.(AuthTokenEnvelope)
			So(ok, ShouldBeTrue)
			So(t.Error, ShouldBeEmpty)
			So(t.Status, ShouldEqual, "ok")
			So(t.Data.AuthToken, ShouldEqual, "mockAuthToken")
			So(t.Data.RefreshToken, ShouldEqual, "mockRefreshToken")
			So(t.Data.TokenExpiry, ShouldEqual, 1)

			return nil
		}}

		err := pp.retrieveToken(ctx)

		So(err, ShouldBeNil)
	})

	Convey("Return error message and no token on request if current session is invalid", t, func() {
		pp := &portalProxy{
			SessionStore:       &testSessionStoreFailure{},
			StratosAuthService: &testStratosAuthService{},
			StoreFactory:       &testStoreFactory{},
		}

		ctx := &testEchoContextBypass{JSONResponseVerifier: func(s int, i any) error {
			So(s, ShouldEqual, http.StatusOK)
			t, ok := i.(AuthTokenEnvelope)
			So(ok, ShouldBeTrue)
			So(t.Error, ShouldNotBeBlank)
			So(t.Status, ShouldEqual, "error")
			So(t.Data, ShouldBeNil)
			return nil
		}}

		err := pp.retrieveToken(ctx)

		So(err, ShouldBeNil)
	})

}

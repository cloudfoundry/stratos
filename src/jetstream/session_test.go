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

type sessionTestPortalProxy struct {
	portalProxy
}

type testEchoContext struct {
	echo.Context
}

func (s *testEchoContext) Request() *http.Request {
	return nil
}

func (s *testEchoContext) Get(key string) interface{} {
	return nil
}

func (p *sessionTestPortalProxy) GetSession(c echo.Context) (*sessions.Session, error) {
	return nil, errors.New("Test error")
}

type testSessionStore struct {
	api.SessionStorer
}

func (p *testSessionStore) Get(req *http.Request, name string) (*sessions.Session, error) {
	return nil, errors.New("Test error")
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
			SessionStore: &testSessionStore{},
		}

		ctx := &testEchoContext{}

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

}

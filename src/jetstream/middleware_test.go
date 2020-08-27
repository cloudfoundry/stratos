package main

import (
	"database/sql"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/apikeys"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces/config"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/mock_interfaces"
	"github.com/golang/mock/gomock"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
	. "github.com/smartystreets/goconvey/convey"
	sqlmock "gopkg.in/DATA-DOG/go-sqlmock.v1"
)

func makeMockServer(apiKeysRepo apikeys.Repository, mockStratosAuth interfaces.StratosAuth) *portalProxy {
	db, _, dberr := sqlmock.New()
	if dberr != nil {
		log.Panicf("an error '%s' was not expected when opening a stub database connection", dberr)
	}

	pp := setupPortalProxy(db)
	pp.DatabaseConnectionPool = db
	pp.APIKeysRepository = apiKeysRepo
	pp.StratosAuthService = mockStratosAuth

	return pp
}

func makeNewRequest() (echo.Context, *httptest.ResponseRecorder) {
	req := setupMockReq("GET", "", map[string]string{})
	rec := httptest.NewRecorder()
	e := echo.New()
	ctx := e.NewContext(req, rec)

	return ctx, rec
}

func Test_apiKeyMiddleware(t *testing.T) {
	t.Parallel()

	// disabling logging noise
	log.SetLevel(log.PanicLevel)

	ctrl := gomock.NewController(t)
	mockAPIRepo := apikeys.NewMockRepository(ctrl)
	mockStratosAuth := mock_interfaces.NewMockStratosAuth(ctrl)
	pp := makeMockServer(mockAPIRepo, mockStratosAuth)
	defer ctrl.Finish()
	defer pp.DatabaseConnectionPool.Close()

	handlerFunc := func(c echo.Context) error {
		return c.String(http.StatusOK, "test")
	}

	middleware := pp.apiKeyMiddleware(handlerFunc)
	apiKeySecret := "SecretMcSecretface"

	Convey("when API keys are enabled for all users", t, func() {
		pp.Config.APIKeysEnabled = config.APIKeysConfigEnum.AllUsers

		Convey("when headers are present", func() {
			Convey("when schema other than Bearer is used", func() {
				ctx, rec := makeNewRequest()
				ctx.Request().Header.Add("Authentication", "JWT "+apiKeySecret)

				err := middleware(ctx)

				Convey("should not set user_id in the context", func() {
					So(ctx.Get("user_id"), ShouldBeNil)
				})

				Convey("should not set skip flag in the context", func() {
					So(ctx.Get(APIKeySkipperContextKey), ShouldBeNil)
				})

				Convey("request should be successful", func() {
					So(err, ShouldBeNil)
					So(rec.Code, ShouldEqual, 200)
					So(rec.Body.String(), ShouldEqual, "test")
				})
			})

			Convey("when Bearer schema is used", func() {
				Convey("when no matching key is found", func() {
					ctx, rec := makeNewRequest()
					ctx.Request().Header.Add("Authentication", "Bearer "+apiKeySecret)

					mockAPIRepo.
						EXPECT().
						GetAPIKeyBySecret(gomock.Eq(apiKeySecret)).
						Return(nil, sql.ErrNoRows)

					err := middleware(ctx)

					Convey("should not set user_id in the context", func() {
						So(ctx.Get("user_id"), ShouldBeNil)
					})

					Convey("should not set skip flag in the context", func() {
						So(ctx.Get(APIKeySkipperContextKey), ShouldBeNil)
					})

					Convey("request should be successful", func() {
						So(err, ShouldBeNil)
						So(rec.Code, ShouldEqual, 200)
						So(rec.Body.String(), ShouldEqual, "test")
					})
				})

				Convey("when APIKeysRepository returns an error", func() {
					ctx, rec := makeNewRequest()
					ctx.Request().Header.Add("Authentication", "Bearer "+apiKeySecret)

					mockAPIRepo.
						EXPECT().
						GetAPIKeyBySecret(gomock.Eq(apiKeySecret)).
						Return(nil, errors.New("Something went wrong"))

					err := middleware(ctx)

					Convey("should not set user_id in the context", func() {
						So(ctx.Get("user_id"), ShouldBeNil)
					})

					Convey("should not set skip flag in the context", func() {
						So(ctx.Get(APIKeySkipperContextKey), ShouldBeNil)
					})

					Convey("request should be successful", func() {
						So(err, ShouldBeNil)
						So(rec.Code, ShouldEqual, 200)
						So(rec.Body.String(), ShouldEqual, "test")
					})
				})

				Convey("when a matching key is found", func() {
					ctx, rec := makeNewRequest()
					ctx.Request().Header.Add("Authentication", "Bearer "+apiKeySecret)

					apiKey := &interfaces.APIKey{
						UserGUID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
						GUID:     "00000000-0000-0000-0000-000000000000",
					}

					mockAPIRepo.
						EXPECT().
						GetAPIKeyBySecret(gomock.Eq(apiKeySecret)).
						Return(apiKey, nil)

					mockAPIRepo.
						EXPECT().
						UpdateAPIKeyLastUsed(gomock.Eq(apiKey.GUID)).
						Return(nil)

					err := middleware(ctx)

					Convey("should set user_id in the context", func() {
						So(ctx.Get("user_id"), ShouldEqual, apiKey.UserGUID)
					})

					Convey("should set skip flag in the context", func() {
						So(ctx.Get(APIKeySkipperContextKey), ShouldBeTrue)
					})

					Convey("request should be successful", func() {
						So(err, ShouldBeNil)
						So(rec.Code, ShouldEqual, 200)
						So(rec.Body.String(), ShouldEqual, "test")
					})
				})

				Convey("when a matching key is found, but last_used can't be updated", func() {
					ctx, rec := makeNewRequest()
					ctx.Request().Header.Add("Authentication", "Bearer "+apiKeySecret)

					apiKey := &interfaces.APIKey{
						UserGUID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
						GUID:     "00000000-0000-0000-0000-000000000000",
					}

					mockAPIRepo.
						EXPECT().
						GetAPIKeyBySecret(gomock.Eq(apiKeySecret)).
						Return(apiKey, nil)

					mockAPIRepo.
						EXPECT().
						UpdateAPIKeyLastUsed(gomock.Eq(apiKey.GUID)).
						Return(errors.New("Something went wrong"))

					err := middleware(ctx)

					Convey("should set user_id in the context", func() {
						So(ctx.Get("user_id"), ShouldEqual, apiKey.UserGUID)
					})

					Convey("should set skip flag in the context", func() {
						So(ctx.Get(APIKeySkipperContextKey), ShouldBeTrue)
					})

					Convey("request should be successful", func() {
						So(err, ShouldBeNil)
						So(rec.Code, ShouldEqual, 200)
						So(rec.Body.String(), ShouldEqual, "test")
					})
				})

			})
		})
	})

	Convey("when API keys are enabled for all admins only", t, func() {
		pp.Config.APIKeysEnabled = config.APIKeysConfigEnum.AdminOnly

		Convey("when a matching key belongs a non-admin user", func() {
			ctx, rec := makeNewRequest()
			ctx.Request().Header.Add("Authentication", "Bearer "+apiKeySecret)

			apiKey := &interfaces.APIKey{
				UserGUID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				GUID:     "00000000-0000-0000-0000-000000000000",
			}

			connectedUser := &interfaces.ConnectedUser{
				GUID:  apiKey.UserGUID,
				Admin: false,
			}

			mockAPIRepo.
				EXPECT().
				GetAPIKeyBySecret(gomock.Eq(apiKeySecret)).
				Return(apiKey, nil)

			mockStratosAuth.
				EXPECT().
				GetUser(gomock.Eq(apiKey.UserGUID)).
				Return(connectedUser, nil)

			err := middleware(ctx)

			Convey("should not set user_id in the context", func() {
				So(ctx.Get("user_id"), ShouldBeNil)
			})

			Convey("should not set skip flag in the context", func() {
				So(ctx.Get(APIKeySkipperContextKey), ShouldBeNil)
			})

			Convey("request should be successful", func() {
				So(err, ShouldBeNil)
				So(rec.Code, ShouldEqual, 200)
				So(rec.Body.String(), ShouldEqual, "test")
			})
		})

		Convey("when a matching key belongs an admin user", func() {
			ctx, rec := makeNewRequest()
			ctx.Request().Header.Add("Authentication", "Bearer "+apiKeySecret)

			apiKey := &interfaces.APIKey{
				UserGUID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				GUID:     "00000000-0000-0000-0000-000000000000",
			}

			connectedUser := &interfaces.ConnectedUser{
				GUID:  apiKey.UserGUID,
				Admin: true,
			}

			mockAPIRepo.
				EXPECT().
				GetAPIKeyBySecret(gomock.Eq(apiKeySecret)).
				Return(apiKey, nil)

			mockAPIRepo.
				EXPECT().
				UpdateAPIKeyLastUsed(gomock.Eq(apiKey.GUID)).
				Return(nil)

			mockStratosAuth.
				EXPECT().
				GetUser(gomock.Eq(apiKey.UserGUID)).
				Return(connectedUser, nil)

			err := middleware(ctx)

			Convey("should set user_id in the context", func() {
				So(ctx.Get("user_id"), ShouldEqual, apiKey.UserGUID)
			})

			Convey("should set skip flag in the context", func() {
				So(ctx.Get(APIKeySkipperContextKey), ShouldBeTrue)
			})

			Convey("request should be successful", func() {
				So(err, ShouldBeNil)
				So(rec.Code, ShouldEqual, 200)
				So(rec.Body.String(), ShouldEqual, "test")
			})
		})

		Convey("when StratosAuth.GetUser returns an error", func() {
			ctx, rec := makeNewRequest()
			ctx.Request().Header.Add("Authentication", "Bearer "+apiKeySecret)

			apiKey := &interfaces.APIKey{
				UserGUID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				GUID:     "00000000-0000-0000-0000-000000000000",
			}

			mockAPIRepo.
				EXPECT().
				GetAPIKeyBySecret(gomock.Eq(apiKeySecret)).
				Return(apiKey, nil)

			mockStratosAuth.
				EXPECT().
				GetUser(gomock.Eq(apiKey.UserGUID)).
				Return(nil, errors.New("Something went wrong"))

			err := middleware(ctx)

			Convey("should not set user_id in the context", func() {
				So(ctx.Get("user_id"), ShouldBeNil)
			})

			Convey("should not set skip flag in the context", func() {
				So(ctx.Get(APIKeySkipperContextKey), ShouldBeNil)
			})

			Convey("request should be successful", func() {
				So(err, ShouldBeNil)
				So(rec.Code, ShouldEqual, 200)
				So(rec.Body.String(), ShouldEqual, "test")
			})
		})
	})

	Convey("when API keys are disabled", t, func() {
		pp.Config.APIKeysEnabled = config.APIKeysConfigEnum.Disabled

		Convey("when an API key header is supplied", func() {
			ctx, rec := makeNewRequest()
			ctx.Request().Header.Add("Authentication", "Bearer "+apiKeySecret)

			err := middleware(ctx)

			Convey("should not set user_id in the context", func() {
				So(ctx.Get("user_id"), ShouldBeNil)
			})

			Convey("should not set skip flag in the context", func() {
				So(ctx.Get(APIKeySkipperContextKey), ShouldBeNil)
			})

			Convey("request should be successful", func() {
				So(err, ShouldBeNil)
				So(rec.Code, ShouldEqual, 200)
				So(rec.Body.String(), ShouldEqual, "test")
			})
		})
	})
}

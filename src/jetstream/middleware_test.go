package main

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api/config"
	mock_api "github.com/cloudfoundry-incubator/stratos/src/jetstream/api/mock"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/apikeys"
	mock_apikeys "github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/apikeys/mock"
	"github.com/golang/mock/gomock"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	. "github.com/smartystreets/goconvey/convey"
	sqlmock "gopkg.in/DATA-DOG/go-sqlmock.v1"
)

func makeMockServer(apiKeysRepo apikeys.Repository, mockStratosAuth api.StratosAuth) *portalProxy {
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

func makeNewRequestWithParams(httpVerb string, formValues map[string]string) (echo.Context, *httptest.ResponseRecorder) {
	req := setupMockReq(httpVerb, "", formValues)
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
	mockAPIRepo := mock_apikeys.NewMockRepository(ctrl)
	mockStratosAuth := mock_api.NewMockStratosAuth(ctrl)
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

					apiKey := &api.APIKey{
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

					apiKey := &api.APIKey{
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

			apiKey := &api.APIKey{
				UserGUID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				GUID:     "00000000-0000-0000-0000-000000000000",
			}

			connectedUser := &api.ConnectedUser{
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

			apiKey := &api.APIKey{
				UserGUID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				GUID:     "00000000-0000-0000-0000-000000000000",
			}

			connectedUser := &api.ConnectedUser{
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

			apiKey := &api.APIKey{
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

func TestEndpointAdminMiddleware(t *testing.T) {
	t.Parallel()

	Convey("new request through endpointAdminMiddleware", t, func() {
		// mock StratosAuthService
		ctrl := gomock.NewController(t)
		mockStratosAuth := mock_api.NewMockStratosAuth(ctrl)
		defer ctrl.Finish()

		// setup mock DB, PortalProxy and mock StratosAuthService
		pp, db, _ := setupPortalProxyWithAuthService(mockStratosAuth)
		defer db.Close()

		handlerFunc := func(c echo.Context) error {
			return c.String(http.StatusOK, "test")
		}

		middleware := pp.endpointAdminMiddleware(handlerFunc)

		mockAdmin := setupMockUser(mockAdminGUID, true, []string{})
		mockEndpointAdmin := setupMockUser(mockUserGUID+"1", false, []string{"stratos.endpointadmin"})
		mockUser := setupMockUser(mockUserGUID+"2", false, []string{})

		Convey("as admin", func() {
			ctx, _ := makeNewRequestWithParams("POST", map[string]string{})

			if errSession := pp.setSessionValues(ctx, mockAdmin.SessionValues); errSession != nil {
				t.Error(errors.New("unable to mock/stub user in session object"))
			}

			mockStratosAuth.
				EXPECT().
				GetUser(gomock.Eq(mockAdmin.ConnectedUser.GUID)).
				Return(mockAdmin.ConnectedUser, nil)

			err := middleware(ctx)

			Convey("request should be successful", func() {
				So(err, ShouldBeNil)
			})
		})

		Convey("as endpointadmin", func() {
			ctx, _ := makeNewRequestWithParams("POST", map[string]string{})

			if errSession := pp.setSessionValues(ctx, mockEndpointAdmin.SessionValues); errSession != nil {
				t.Error(errors.New("unable to mock/stub user in session object"))
			}

			mockStratosAuth.
				EXPECT().
				GetUser(gomock.Eq(mockEndpointAdmin.ConnectedUser.GUID)).
				Return(mockEndpointAdmin.ConnectedUser, nil)

			err := middleware(ctx)

			Convey("request should be successful", func() {
				So(err, ShouldBeNil)
			})

		})
		Convey("as normal user", func() {
			ctx, _ := makeNewRequestWithParams("POST", map[string]string{})

			if errSession := pp.setSessionValues(ctx, mockUser.SessionValues); errSession != nil {
				t.Error(errors.New("unable to mock/stub user in session object"))
			}

			mockStratosAuth.
				EXPECT().
				GetUser(gomock.Eq(mockUser.ConnectedUser.GUID)).
				Return(mockUser.ConnectedUser, nil)

			err := middleware(ctx)

			Convey("request should fail", func() {
				So(err,
					ShouldResemble,
					handleSessionError(pp.Config,
						ctx,
						errors.New("Unauthorized"),
						false,
						"You must be a Stratos admin or endpointAdmin to access this API"))
			})
		})
	})
}

func TestEndpointUpdateDeleteMiddleware(t *testing.T) {
	t.Parallel()

	Convey("new request through endpointUpdateDeleteMiddleware", t, func() {
		// mock StratosAuthService
		ctrl := gomock.NewController(t)
		mockStratosAuth := mock_api.NewMockStratosAuth(ctrl)
		defer ctrl.Finish()

		// setup mock DB, PortalProxy and mock StratosAuthService
		pp, db, mock := setupPortalProxyWithAuthService(mockStratosAuth)
		defer db.Close()

		res := httptest.NewRecorder()
		req := setupMockReq("POST", "", nil)
		_, ctx := setupEchoContext(res, req)
		ctx.SetParamNames("id")

		handlerFunc := func(c echo.Context) error {
			return c.String(http.StatusOK, "test")
		}
		middleware := pp.endpointUpdateDeleteMiddleware(handlerFunc)

		mockAdmin := setupMockUser(mockAdminGUID, true, []string{})
		mockEndpointAdmin1 := setupMockUser(mockUserGUID+"1", false, []string{"stratos.endpointadmin"})
		mockEndpointAdmin2 := setupMockUser(mockUserGUID+"2", false, []string{"stratos.endpointadmin"})

		adminEndpointArgs := createEndpointRowArgs("CF Endpoint 1", "https://127.0.0.1:50001", mockAuthEndpoint, mockTokenEndpoint, mockAdmin.ConnectedUser.GUID, mockAdmin.ConnectedUser.Admin)
		adminEndpointRows := sqlmock.NewRows(datastore.GetColumnNamesForCSNIs()).AddRow(adminEndpointArgs...)

		userEndpoint1Args := createEndpointRowArgs("CF Endpoint 2", "https://127.0.0.1:50002", mockAuthEndpoint, mockTokenEndpoint, mockEndpointAdmin1.ConnectedUser.GUID, mockEndpointAdmin1.ConnectedUser.Admin)
		userEndpoint1Rows := sqlmock.NewRows(datastore.GetColumnNamesForCSNIs()).AddRow(userEndpoint1Args...)

		userEndpoint2Args := createEndpointRowArgs("CF Endpoint 3", "https://127.0.0.1:50003", mockAuthEndpoint, mockTokenEndpoint, mockEndpointAdmin2.ConnectedUser.GUID, mockEndpointAdmin2.ConnectedUser.Admin)
		userEndpoint2Rows := sqlmock.NewRows(datastore.GetColumnNamesForCSNIs()).AddRow(userEndpoint2Args...)

		Convey("as admin", func() {
			if errSession := pp.setSessionValues(ctx, mockAdmin.SessionValues); errSession != nil {
				t.Error(errors.New("unable to mock/stub user in session object"))
			}
			Convey("edit admin endpoint", func() {
				ctx.SetParamValues(fmt.Sprintf("%v", adminEndpointArgs[0]))

				mockStratosAuth.
					EXPECT().
					GetUser(gomock.Eq(mockAdmin.ConnectedUser.GUID)).
					Return(mockAdmin.ConnectedUser, nil)

				mock.ExpectQuery(selectAnyFromCNSIs).WithArgs(adminEndpointArgs[0]).WillReturnRows(adminEndpointRows)

				err := middleware(ctx)
				dberr := mock.ExpectationsWereMet()

				Convey("request should be successful", func() {
					So(err, ShouldBeNil)
					So(dberr, ShouldBeNil)
				})
			})
			Convey("edit user endpoint", func() {
				ctx.SetParamValues(fmt.Sprintf("%v", userEndpoint1Args[0]))

				mockStratosAuth.
					EXPECT().
					GetUser(gomock.Eq(mockAdmin.ConnectedUser.GUID)).
					Return(mockAdmin.ConnectedUser, nil)

				mock.ExpectQuery(selectAnyFromCNSIs).WithArgs(userEndpoint1Args[0]).WillReturnRows(userEndpoint1Rows)

				err := middleware(ctx)
				dberr := mock.ExpectationsWereMet()

				Convey("request should be successful", func() {
					So(err, ShouldBeNil)
					So(dberr, ShouldBeNil)
				})
			})
		})
		Convey("as user", func() {
			if errSession := pp.setSessionValues(ctx, mockEndpointAdmin1.SessionValues); errSession != nil {
				t.Error(errors.New("unable to mock/stub user in session object"))
			}
			Convey("edit admin endpoint", func() {
				ctx.SetParamValues(fmt.Sprintf("%v", adminEndpointArgs[0]))

				mockStratosAuth.
					EXPECT().
					GetUser(gomock.Eq(mockEndpointAdmin1.ConnectedUser.GUID)).
					Return(mockEndpointAdmin1.ConnectedUser, nil)

				mock.ExpectQuery(selectAnyFromCNSIs).WithArgs(adminEndpointArgs[0]).WillReturnRows(adminEndpointRows)

				err := middleware(ctx)
				dberr := mock.ExpectationsWereMet()

				Convey("request should fail", func() {
					So(err,
						ShouldResemble,
						handleSessionError(pp.Config,
							ctx,
							errors.New("Unauthorized"),
							false,
							"You must be Stratos admin to modify this endpoint."))
					So(dberr, ShouldBeNil)
				})
			})
			Convey("edit own endpoint", func() {
				ctx.SetParamValues(fmt.Sprintf("%v", userEndpoint1Args[0]))

				mockStratosAuth.
					EXPECT().
					GetUser(gomock.Eq(mockEndpointAdmin1.ConnectedUser.GUID)).
					Return(mockEndpointAdmin1.ConnectedUser, nil)

				mock.ExpectQuery(selectAnyFromCNSIs).WithArgs(userEndpoint1Args[0]).WillReturnRows(userEndpoint1Rows)

				err := middleware(ctx)
				dberr := mock.ExpectationsWereMet()

				Convey("request should be successful", func() {
					So(err, ShouldBeNil)
					So(dberr, ShouldBeNil)
				})
			})
			Convey("edit endpoint from different user", func() {
				ctx.SetParamValues(fmt.Sprintf("%v", userEndpoint2Args[0]))

				mockStratosAuth.
					EXPECT().
					GetUser(gomock.Eq(mockEndpointAdmin1.ConnectedUser.GUID)).
					Return(mockEndpointAdmin1.ConnectedUser, nil)

				mock.ExpectQuery(selectAnyFromCNSIs).WithArgs(userEndpoint2Args[0]).WillReturnRows(userEndpoint2Rows)

				err := middleware(ctx)
				dberr := mock.ExpectationsWereMet()

				Convey("request should fail", func() {
					So(err,
						ShouldResemble,
						handleSessionError(pp.Config,
							ctx,
							errors.New("Unauthorized"),
							false,
							"EndpointAdmins are not allowed to modify endpoints created by other endpointAdmins."))
					So(dberr, ShouldBeNil)
				})
			})
		})
	})
}

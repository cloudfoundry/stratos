package main

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces/config"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/mock_interfaces"
	"github.com/golang/mock/gomock"
	_ "github.com/satori/go.uuid"
	. "github.com/smartystreets/goconvey/convey"
	"gopkg.in/DATA-DOG/go-sqlmock.v1"
)

func TestRegisterCFCluster(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockV2InfoResponse)))

	defer mockV2Info.Close()

	req := setupMockReq("POST", "", map[string]string{
		"cnsi_name":           "Some fancy CF Cluster",
		"api_endpoint":        mockV2Info.URL,
		"skip_ssl_validation": "true",
		"cnsi_client_id":      mockClientId,
		"cnsi_client_secret":  mockClientSecret,
	})

	_, _, ctx, pp, db, mock := setupHTTPTest(req)
	defer db.Close()

	// Set a dummy userid in session - normally the login to UAA would do this.
	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = mockUserGUID
	sessionValues["exp"] = time.Now().AddDate(0, 0, 1).Unix()

	if errSession := pp.setSessionValues(ctx, sessionValues); errSession != nil {
		t.Error(errors.New("unable to mock/stub user in session object"))
	}

	mock.ExpectExec(insertIntoCNSIs).
		WithArgs(sqlmock.AnyArg(), "Some fancy CF Cluster", "cf", mockV2Info.URL, mockAuthEndpoint, mockTokenEndpoint, mockDopplerEndpoint, true, mockClientId, sqlmock.AnyArg(), false, "", "", "").
		WillReturnResult(sqlmock.NewResult(1, 1))

	if err := pp.RegisterEndpoint(ctx, getCFPlugin(pp, "cf").Info); err != nil {
		t.Errorf("Failed to register cluster: %v", err)
	}

	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("There were unfulfilled expectations: %s", dberr)
	}
}

func TestRegisterCFClusterWithMissingName(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockV2InfoResponse)))

	defer mockV2Info.Close()

	req := setupMockReq("POST", "", map[string]string{
		"api_endpoint": mockV2Info.URL,
	})

	_, _, ctx, pp, db, _ := setupHTTPTest(req)

	defer db.Close()

	if err := pp.RegisterEndpoint(ctx, getCFPlugin(pp, "cf").Info); err == nil {
		t.Error("Should not be able to register cluster without cluster name")
	}
}

func getCFPlugin(p *portalProxy, endpointType string) interfaces.EndpointPlugin {

	for _, plugin := range p.Plugins {
		endpointPlugin, err := plugin.GetEndpointPlugin()
		if err != nil {
			// Plugin doesn't implement an Endpoint Plugin interface, skip
			continue
		}

		if endpointType == endpointPlugin.GetType() {
			return endpointPlugin
		}
	}
	return nil
}

func TestRegisterCFClusterWithMissingAPIEndpoint(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockV2InfoResponse)))

	defer mockV2Info.Close()

	req := setupMockReq("POST", "", map[string]string{
		"cnsi_name": "Some fancy CF Cluster",
	})

	_, _, ctx, pp, db, _ := setupHTTPTest(req)

	defer db.Close()

	if err := pp.RegisterEndpoint(ctx, getCFPlugin(pp, "cf").Info); err == nil {
		t.Error("Should not be able to register cluster without api endpoint")
	}
}

func TestRegisterCFClusterWithInvalidAPIEndpoint(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockV2InfoResponse)))

	defer mockV2Info.Close()

	// force a bad api_endpoint to be sure it is handled properly:
	// src: https://bryce.fisher-fleig.org/blog/golang-testing-stdlib-errors/index.html
	req := setupMockReq("POST", "", map[string]string{
		"cnsi_name":    "Some fancy CF Cluster",
		"api_endpoint": "%zzzzz",
	})

	_, _, ctx, pp, db, _ := setupHTTPTest(req)

	defer db.Close()

	if err := pp.RegisterEndpoint(ctx, getCFPlugin(pp, "cf").Info); err == nil {
		t.Error("Should not be able to register cluster without a valid api endpoint")
	}
}

func TestRegisterCFClusterWithBadV2Request(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusNotFound),
		msBody(""))

	defer mockV2Info.Close()

	req := setupMockReq("POST", "", map[string]string{
		"cnsi_name":    "Some fancy CF Cluster",
		"api_endpoint": mockV2Info.URL,
	})

	_, _, ctx, pp, db, _ := setupHTTPTest(req)

	defer db.Close()

	if err := pp.RegisterEndpoint(ctx, getCFPlugin(pp, "cf").Info); err == nil {
		t.Error("Should not register cluster if call to v2/info fails")
	}
}

func TestRegisterCFClusterButCantSaveCNSIRecord(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockV2InfoResponse)))

	defer mockV2Info.Close()

	req := setupMockReq("POST", "", map[string]string{
		"cnsi_name":    "Some fancy CF Cluster",
		"api_endpoint": mockV2Info.URL,
	})

	_, _, ctx, pp, db, mock := setupHTTPTest(req)

	defer db.Close()

	mock.ExpectExec(insertIntoCNSIs).
		WillReturnError(errors.New("Unknown Database Error"))

	if err := pp.RegisterEndpoint(ctx, getCFPlugin(pp, "cf").Info); err == nil {
		t.Errorf("Unexpected success - should not be able to register cluster without token save.")
	}
}
func TestListCNSIs(t *testing.T) {
	t.Skip("TODO: fix this test")
	t.Parallel()

	req := setupMockReq("GET", "", nil)

	_, _, ctx, pp, db, mock := setupHTTPTest(req)
	defer db.Close()

	// Mock the CNSIs in the database
	expectedCNSIList := expectCFAndCERows()
	mock.ExpectQuery(selectAnyFromCNSIs).
		WillReturnRows(expectedCNSIList)

	err := pp.listCNSIs(ctx)
	if err != nil {
		t.Errorf("Unable to retriece list of registered CNSIs from /cnsis: %v", err)
	}

	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("There were unfulfilled expectations: %s", dberr)
	}
}

func TestListCNSIsWhenListFails(t *testing.T) {
	t.Parallel()

	req := setupMockReq("GET", "", nil)

	_, _, ctx, pp, db, mock := setupHTTPTest(req)
	defer db.Close()

	// Mock a database error
	mock.ExpectQuery(selectAnyFromCNSIs).
		WillReturnError(errors.New("Unknown Database Error"))

	err := pp.listCNSIs(ctx)

	if err == nil {
		t.Errorf("Should receive an error when unable to get a list of registered CNSIs from /cnsis: %v", err)
	}
}

func TestGetCFv2InfoWithBadURL(t *testing.T) {
	t.Parallel()

	cfPlugin := initCFPlugin(&portalProxy{})

	endpointPlugin, _ := cfPlugin.GetEndpointPlugin()
	invalidEndpoint := "%zzzz"
	if _, _, err := endpointPlugin.Info(invalidEndpoint, true); err == nil {
		t.Error("getCFv2Info should not return a valid response when the URL is bad.")
	}
}

func TestGetCFv2InfoWithInvalidEndpoint(t *testing.T) {
	t.Parallel()

	cfPlugin := initCFPlugin(&portalProxy{})
	endpointPlugin, _ := cfPlugin.GetEndpointPlugin()

	ep := "http://invalid.net"
	if _, _, err := endpointPlugin.Info(ep, true); err == nil {
		t.Error("getCFv2Info should not return a valid response when the endpoint is invalid.")
	}
}

func TestRegisterWithUserEndpointsEnabled(t *testing.T) {
	// execute this in parallel
	t.Parallel()

	Convey("Request to register endpoint", t, func() {

		// mock StratosAuthService
		ctrl := gomock.NewController(t)
		mockStratosAuth := mock_interfaces.NewMockStratosAuth(ctrl)
		defer ctrl.Finish()

		// setup mock DB, PortalProxy and mock StratosAuthService
		pp, db, mock := setupPortalProxyWithAuthService(mockStratosAuth)
		defer db.Close()

		// mock individual APIEndpoints
		mockV2Info := []*httptest.Server{}
		for i := 0; i < 1; i++ {
			server := setupMockServer(t,
				msRoute("/v2/info"),
				msMethod("GET"),
				msStatus(http.StatusOK),
				msBody(jsonMust(mockV2InfoResponse)))
			defer server.Close()
			mockV2Info = append(mockV2Info, server)
		}

		// mock different users
		mockAdmin := setupMockUser(mockAdminGUID, true, []string{})
		mockUser1 := setupMockUser(mockUserGUID+"1", false, []string{"stratos.endpointadmin"})
		mockUser2 := setupMockUser(mockUserGUID+"2", false, []string{"stratos.endpointadmin"})

		Convey("with UserEndpointsEnabled=enabled", func() {

			pp.GetConfig().UserEndpointsEnabled = config.UserEndpointsConfigEnum.Enabled

			Convey("as admin", func() {
				Convey("with createSystemEndpoint enabled", func() {
					// setup
					adminEndpoint := setupMockEndpointRegisterRequest(t, mockAdmin.ConnectedUser, mockV2Info[0], "CF Cluster 1", true, true)

					if errSession := pp.setSessionValues(adminEndpoint.EchoContext, mockAdmin.SessionValues); errSession != nil {
						t.Error(errors.New("unable to mock/stub user in session object"))
					}
					Convey("register new endpoint", func() {
						// mock executions
						mockStratosAuth.
							EXPECT().
							GetUser(gomock.Eq(mockAdmin.ConnectedUser.GUID)).
							Return(mockAdmin.ConnectedUser, nil)

						// return no already saved endpoints
						rows := sqlmock.NewRows(rowFieldsForCNSI)
						mock.ExpectQuery(selectAnyFromCNSIs).WithArgs(mockV2Info[0].URL).WillReturnRows(rows)

						mock.ExpectExec(insertIntoCNSIs).
							WithArgs(adminEndpoint.InsertArgs...).
							WillReturnResult(sqlmock.NewResult(1, 1))

						// test
						err := pp.RegisterEndpoint(adminEndpoint.EchoContext, getCFPlugin(pp, "cf").Info)
						dberr := mock.ExpectationsWereMet()

						Convey("there should be no error", func() {
							So(err, ShouldBeNil)
						})

						Convey("there should be no db error", func() {
							So(dberr, ShouldBeNil)
						})
					})
					Convey("create system endpoint over existing user endpoints", func() {
						// setup
						userEndpoint := setupMockEndpointRegisterRequest(t, mockUser1.ConnectedUser, mockV2Info[0], "CF Cluster 1 User", false, false)

						// mock executions
						mockStratosAuth.
							EXPECT().
							GetUser(gomock.Eq(mockAdmin.ConnectedUser.GUID)).
							Return(mockAdmin.ConnectedUser, nil)

						// return a user endpoint with same apiurl
						rows := sqlmock.NewRows(rowFieldsForCNSI).AddRow(userEndpoint.QueryArgs...)
						mock.ExpectQuery(selectAnyFromCNSIs).WithArgs(mockV2Info[0].URL).WillReturnRows(rows)

						// save cnsi
						mock.ExpectExec(insertIntoCNSIs).
							WithArgs(adminEndpoint.InsertArgs...).
							WillReturnResult(sqlmock.NewResult(1, 1))

						// test
						err := pp.RegisterEndpoint(adminEndpoint.EchoContext, getCFPlugin(pp, "cf").Info)
						dberr := mock.ExpectationsWereMet()

						Convey("there should be no error", func() {
							So(err, ShouldBeNil)
						})

						Convey("there should be no db error", func() {
							So(dberr, ShouldBeNil)
						})
					})
					Convey("create system endpoint over existing system endpoints", func() {
						// mock executions
						mockStratosAuth.
							EXPECT().
							GetUser(gomock.Eq(mockAdmin.ConnectedUser.GUID)).
							Return(mockAdmin.ConnectedUser, nil)

						// return a admin endpoint with same apiurl
						rows := sqlmock.NewRows(rowFieldsForCNSI).AddRow(adminEndpoint.QueryArgs...)
						mock.ExpectQuery(selectAnyFromCNSIs).WithArgs(mockV2Info[0].URL).WillReturnRows(rows)

						// test
						err := pp.RegisterEndpoint(adminEndpoint.EchoContext, getCFPlugin(pp, "cf").Info)
						dberr := mock.ExpectationsWereMet()

						Convey("should fail ", func() {
							So(err, ShouldResemble, interfaces.NewHTTPShadowError(
								http.StatusBadRequest,
								"Can not register same system endpoint multiple times",
								"Can not register same system endpoint multiple times",
							))
						})

						Convey("no insert should be executed", func() {
							So(dberr, ShouldBeNil)
						})
					})
				})
				Convey("with createSystemEndpoint disabled", func() {

					// setup
					adminEndpoint := setupMockEndpointRegisterRequest(t, mockAdmin.ConnectedUser, mockV2Info[0], "CF Cluster 1", false, false)
					systemEndpoint := setupMockEndpointRegisterRequest(t, mockAdmin.ConnectedUser, mockV2Info[0], "CF Cluster 1", false, true)

					if errSession := pp.setSessionValues(adminEndpoint.EchoContext, mockAdmin.SessionValues); errSession != nil {
						t.Error(errors.New("unable to mock/stub user in session object"))
					}

					Convey("register personal endpoint over system endpoint", func() {
						// mock executions
						mockStratosAuth.
							EXPECT().
							GetUser(gomock.Eq(mockAdmin.ConnectedUser.GUID)).
							Return(mockAdmin.ConnectedUser, nil)

						// return a admin endpoint with same apiurl
						rows := sqlmock.NewRows(rowFieldsForCNSI).AddRow(systemEndpoint.QueryArgs...)
						mock.ExpectQuery(selectAnyFromCNSIs).WithArgs(mockV2Info[0].URL).WillReturnRows(rows)

						// save cnsi
						mock.ExpectExec(insertIntoCNSIs).
							WithArgs(adminEndpoint.InsertArgs...).
							WillReturnResult(sqlmock.NewResult(1, 1))

						// test
						err := pp.RegisterEndpoint(adminEndpoint.EchoContext, getCFPlugin(pp, "cf").Info)
						dberr := mock.ExpectationsWereMet()

						Convey("there should be no error", func() {
							So(err, ShouldBeNil)
						})

						Convey("there should be no db error", func() {
							So(dberr, ShouldBeNil)
						})
					})
					Convey("register personal endpoint twice", func() {
						// mock executions
						mockStratosAuth.
							EXPECT().
							GetUser(gomock.Eq(mockAdmin.ConnectedUser.GUID)).
							Return(mockAdmin.ConnectedUser, nil)

						// return a user endpoint with same apiurl
						rows := sqlmock.NewRows(rowFieldsForCNSI).AddRow(adminEndpoint.QueryArgs...)
						mock.ExpectQuery(selectAnyFromCNSIs).WithArgs(mockV2Info[0].URL).WillReturnRows(rows)

						// test
						err := pp.RegisterEndpoint(adminEndpoint.EchoContext, getCFPlugin(pp, "cf").Info)
						dberr := mock.ExpectationsWereMet()

						Convey("there should be no error", func() {
							So(err, ShouldResemble, interfaces.NewHTTPShadowError(
								http.StatusBadRequest,
								"Can not register same endpoint multiple times",
								"Can not register same endpoint multiple times",
							))
						})

						Convey("there should be no db error", func() {
							So(dberr, ShouldBeNil)
						})
					})
				})
			})

			Convey("as user", func() {
				Convey("with createSystemEndpoint enabled", func() {
					// setup
					userEndpoint := setupMockEndpointRegisterRequest(t, mockUser1.ConnectedUser, mockV2Info[0], "CF Cluster 1", true, false)

					if errSession := pp.setSessionValues(userEndpoint.EchoContext, mockUser1.SessionValues); errSession != nil {
						t.Error(errors.New("unable to mock/stub user in session object"))
					}

					Convey("register new endpoint", func() {
						// mock executions
						mockStratosAuth.
							EXPECT().
							GetUser(gomock.Eq(mockUser1.ConnectedUser.GUID)).
							Return(mockUser1.ConnectedUser, nil)

						rows := sqlmock.NewRows(rowFieldsForCNSI)
						mock.ExpectQuery(selectAnyFromCNSIs).WithArgs(mockV2Info[0].URL).WillReturnRows(rows)

						mock.ExpectExec(insertIntoCNSIs).
							WithArgs(userEndpoint.InsertArgs...).
							WillReturnResult(sqlmock.NewResult(1, 1))

						err := pp.RegisterEndpoint(userEndpoint.EchoContext, getCFPlugin(pp, "cf").Info)
						dberr := mock.ExpectationsWereMet()

						Convey("there should be no error", func() {
							So(err, ShouldBeNil)
						})

						Convey("there should be no db error", func() {
							So(dberr, ShouldBeNil)
						})
					})
					Convey("register existing endpoint from different user", func() {
						userEndpoint2 := setupMockEndpointRegisterRequest(t, mockUser2.ConnectedUser, mockV2Info[0], "CF Cluster 2", false, false)

						// mock executions
						mockStratosAuth.
							EXPECT().
							GetUser(gomock.Eq(mockUser1.ConnectedUser.GUID)).
							Return(mockUser1.ConnectedUser, nil)

						rows := sqlmock.NewRows(rowFieldsForCNSI).AddRow(userEndpoint2.QueryArgs...)
						mock.ExpectQuery(selectAnyFromCNSIs).WithArgs(mockV2Info[0].URL).WillReturnRows(rows)

						mock.ExpectExec(insertIntoCNSIs).
							WithArgs(userEndpoint.InsertArgs...).
							WillReturnResult(sqlmock.NewResult(1, 1))

						err := pp.RegisterEndpoint(userEndpoint.EchoContext, getCFPlugin(pp, "cf").Info)
						dberr := mock.ExpectationsWereMet()

						Convey("there should be no error", func() {
							So(err, ShouldBeNil)
						})

						Convey("there should be no db error", func() {
							So(dberr, ShouldBeNil)
						})
					})
					Convey("register existing endpoint from same user", func() {
						// mock executions
						mockStratosAuth.
							EXPECT().
							GetUser(gomock.Eq(mockUser1.ConnectedUser.GUID)).
							Return(mockUser1.ConnectedUser, nil)

						rows := sqlmock.NewRows(rowFieldsForCNSI).AddRow(userEndpoint.QueryArgs...)
						mock.ExpectQuery(selectAnyFromCNSIs).WithArgs(mockV2Info[0].URL).WillReturnRows(rows)

						err := pp.RegisterEndpoint(userEndpoint.EchoContext, getCFPlugin(pp, "cf").Info)
						dberr := mock.ExpectationsWereMet()

						Convey("should fail ", func() {
							So(err, ShouldResemble, interfaces.NewHTTPShadowError(
								http.StatusBadRequest,
								"Can not register same endpoint multiple times",
								"Can not register same endpoint multiple times",
							))
						})

						Convey("there should be no db error", func() {
							So(dberr, ShouldBeNil)
						})
					})
				})
				Convey("with createSystemEndpoint disabled", func() {
					userEndpoint := setupMockEndpointRegisterRequest(t, mockUser1.ConnectedUser, mockV2Info[0], "CF Cluster 1", false, false)

					if errSession := pp.setSessionValues(userEndpoint.EchoContext, mockUser1.SessionValues); errSession != nil {
						t.Error(errors.New("unable to mock/stub user in session object"))
					}
					Convey("register existing endpoint from same user", func() {
						// mock executions
						mockStratosAuth.
							EXPECT().
							GetUser(gomock.Eq(mockUser1.ConnectedUser.GUID)).
							Return(mockUser1.ConnectedUser, nil)

						rows := sqlmock.NewRows(rowFieldsForCNSI).AddRow(userEndpoint.QueryArgs...)
						mock.ExpectQuery(selectAnyFromCNSIs).WithArgs(mockV2Info[0].URL).WillReturnRows(rows)

						err := pp.RegisterEndpoint(userEndpoint.EchoContext, getCFPlugin(pp, "cf").Info)
						dberr := mock.ExpectationsWereMet()

						Convey("should fail ", func() {
							So(err, ShouldResemble, interfaces.NewHTTPShadowError(
								http.StatusBadRequest,
								"Can not register same endpoint multiple times",
								"Can not register same endpoint multiple times",
							))
						})

						Convey("there should be no db error", func() {
							So(dberr, ShouldBeNil)
						})
					})
				})

			})
		})
	})
}

func TestListCNSIsWithUserEndpointsEnabled(t *testing.T) {
	t.Parallel()

	Convey("Request to list endpoints", t, func() {

		// mock StratosAuthService
		ctrl := gomock.NewController(t)
		mockStratosAuth := mock_interfaces.NewMockStratosAuth(ctrl)
		defer ctrl.Finish()

		// setup mock DB, PortalProxy and mock StratosAuthService
		pp, db, mock := setupPortalProxyWithAuthService(mockStratosAuth)
		defer db.Close()

		// setup request

		res := httptest.NewRecorder()
		req := setupMockReq("GET", "", nil)
		_, ctx := setupEchoContext(res, req)

		mockAdmin := setupMockUser(mockAdminGUID, true, []string{})
		mockUser1 := setupMockUser(mockUserGUID+"1", false, []string{"stratos.endpointadmin"})
		mockUser2 := setupMockUser(mockUserGUID+"2", false, []string{"stratos.endpointadmin"})

		adminEndpointArgs := createEndpointRowArgs("CF Endpoint 1", "https://127.0.0.1:50001", mockAuthEndpoint, mockTokenEndpoint, mockAdmin.ConnectedUser.GUID, mockAdmin.ConnectedUser.Admin)
		userEndpoint1Args := createEndpointRowArgs("CF Endpoint 2", "https://127.0.0.1:50002", mockAuthEndpoint, mockTokenEndpoint, mockUser1.ConnectedUser.GUID, mockUser1.ConnectedUser.Admin)
		userEndpoint2Args := createEndpointRowArgs("CF Endpoint 3", "https://127.0.0.1:50003", mockAuthEndpoint, mockTokenEndpoint, mockUser2.ConnectedUser.GUID, mockUser2.ConnectedUser.Admin)

		adminRows := sqlmock.NewRows(rowFieldsForCNSI).
			AddRow(adminEndpointArgs...)
		user1Rows := sqlmock.NewRows(rowFieldsForCNSI).
			AddRow(userEndpoint1Args...)
		allRows := sqlmock.NewRows(rowFieldsForCNSI).
			AddRow(adminEndpointArgs...).
			AddRow(userEndpoint1Args...).
			AddRow(userEndpoint2Args...)

		Convey("as admin", func() {

			if errSession := pp.setSessionValues(ctx, mockAdmin.SessionValues); errSession != nil {
				t.Error(errors.New("unable to mock/stub user in session object"))
			}

			Convey("with UserEndpointsEnabled = enabled", func() {
				//expect list all
				pp.GetConfig().UserEndpointsEnabled = config.UserEndpointsConfigEnum.Enabled

				mockStratosAuth.
					EXPECT().
					GetUser(gomock.Eq(mockAdmin.ConnectedUser.GUID)).
					Return(mockAdmin.ConnectedUser, nil)

				mock.ExpectQuery(selectFromCNSIs).WillReturnRows(allRows)
				err := pp.listCNSIs(ctx)
				dberr := mock.ExpectationsWereMet()

				Convey("there should be no error", func() {
					So(err, ShouldBeNil)
				})

				Convey("there should be no db error", func() {
					So(dberr, ShouldBeNil)
				})
			})
			Convey("with UserEndpointsEnabled = admin_only", func() {
				//expect list all
				pp.GetConfig().UserEndpointsEnabled = config.UserEndpointsConfigEnum.AdminOnly

				mockStratosAuth.
					EXPECT().
					GetUser(gomock.Eq(mockAdmin.ConnectedUser.GUID)).
					Return(mockAdmin.ConnectedUser, nil)

				mock.ExpectQuery(selectFromCNSIs).WillReturnRows(allRows)
				err := pp.listCNSIs(ctx)
				dberr := mock.ExpectationsWereMet()

				Convey("there should be no error", func() {
					So(err, ShouldBeNil)
				})

				Convey("there should be no db error", func() {
					So(dberr, ShouldBeNil)
				})

			})
			Convey("with UserEndpointsEnabled = disabled", func() {
				// expect list creator with ""
				pp.GetConfig().UserEndpointsEnabled = config.UserEndpointsConfigEnum.Disabled

				mock.ExpectQuery(selectCreatorFromCNSIs).WithArgs("").WillReturnRows(adminRows)
				err := pp.listCNSIs(ctx)
				dberr := mock.ExpectationsWereMet()

				Convey("there should be no error", func() {
					So(err, ShouldBeNil)
				})

				Convey("there should be no db error", func() {
					So(dberr, ShouldBeNil)
				})
			})

		})
		Convey("as user", func() {
			if errSession := pp.setSessionValues(ctx, mockUser1.SessionValues); errSession != nil {
				t.Error(errors.New("unable to mock/stub user in session object"))
			}

			Convey("with UserEndpointsEnabled = enabled", func() {
				// expect list creator with "" and own endpoints
				pp.GetConfig().UserEndpointsEnabled = config.UserEndpointsConfigEnum.Enabled

				mockStratosAuth.
					EXPECT().
					GetUser(gomock.Eq(mockUser1.ConnectedUser.GUID)).
					Return(mockUser1.ConnectedUser, nil)

				mock.ExpectQuery(selectCreatorFromCNSIs).WithArgs(mockUser1.ConnectedUser.GUID).WillReturnRows(user1Rows)
				mock.ExpectQuery(selectCreatorFromCNSIs).WithArgs("").WillReturnRows(adminRows)
				err := pp.listCNSIs(ctx)
				dberr := mock.ExpectationsWereMet()

				Convey("there should be no error", func() {
					So(err, ShouldBeNil)
				})

				Convey("there should be no db error", func() {
					So(dberr, ShouldBeNil)
				})

			})
			Convey("with UserEndpointsEnabled = admin_only", func() {
				// expect list creator with ""
				pp.GetConfig().UserEndpointsEnabled = config.UserEndpointsConfigEnum.AdminOnly

				mockStratosAuth.
					EXPECT().
					GetUser(gomock.Eq(mockUser1.ConnectedUser.GUID)).
					Return(mockUser1.ConnectedUser, nil)

				mock.ExpectQuery(selectCreatorFromCNSIs).WithArgs("").WillReturnRows(adminRows)
				err := pp.listCNSIs(ctx)
				dberr := mock.ExpectationsWereMet()

				Convey("there should be no error", func() {
					So(err, ShouldBeNil)
				})

				Convey("there should be no db error", func() {
					So(dberr, ShouldBeNil)
				})

			})
			Convey("with UserEndpointsEnabled = disabled", func() {
				// expect list creator with ""
				pp.GetConfig().UserEndpointsEnabled = config.UserEndpointsConfigEnum.Disabled

				mock.ExpectQuery(selectCreatorFromCNSIs).WithArgs("").WillReturnRows(adminRows)
				err := pp.listCNSIs(ctx)
				dberr := mock.ExpectationsWereMet()

				Convey("there should be no error", func() {
					So(err, ShouldBeNil)
				})

				Convey("there should be no db error", func() {
					So(dberr, ShouldBeNil)
				})
			})

		})
	})
}

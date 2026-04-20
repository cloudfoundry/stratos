package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/api/config"
	mock_api "github.com/cloudfoundry/stratos/src/jetstream/api/mock"
	"github.com/cloudfoundry/stratos/src/jetstream/testutils"
	"github.com/golang/mock/gomock"
	_ "github.com/satori/go.uuid"
	. "github.com/smartystreets/goconvey/convey"
	"gopkg.in/DATA-DOG/go-sqlmock.v1"
)

func TestRegisterCFCluster(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockEndpointServer(t)

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
		WithArgs(sqlmock.AnyArg(), "Some fancy CF Cluster", "cf", mockV2Info.URL, mockAuthEndpoint, mockTokenEndpoint, mockDopplerEndpoint, true, mockClientId, sqlmock.AnyArg(), false, "", sqlmock.AnyArg(), "", "").
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

	mockV2Info := setupMockEndpointServer(t)

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

func getCFPlugin(p *portalProxy, endpointType string) api.EndpointPlugin {

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

	mockV2Info := setupMockEndpointServer(t)

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

	mockV2Info := setupMockEndpointServer(t)

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

	mockV2Info := setupMockEndpointServer(t)

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
	if _, _, err := endpointPlugin.Info(invalidEndpoint, true, ""); err == nil {
		t.Error("getCFv2Info should not return a valid response when the URL is bad.")
	}
}

func TestGetCFv2InfoWithInvalidEndpoint(t *testing.T) {
	t.Parallel()

	cfPlugin := initCFPlugin(&portalProxy{})
	endpointPlugin, _ := cfPlugin.GetEndpointPlugin()

	ep := "http://invalid.net"
	if _, _, err := endpointPlugin.Info(ep, true, ""); err == nil {
		t.Error("getCFv2Info should not return a valid response when the endpoint is invalid.")
	}
}

func TestRegisterEndpointStartsRefreshRoutine(t *testing.T) {
	t.Parallel()

	Convey("Request to register endpoint", t, func() {
		// mock StratosAuthService
		ctrl := gomock.NewController(t)
		mockStratosAuth := mock_api.NewMockStratosAuth(ctrl)
		defer ctrl.Finish()

		// setup mock DB, PortalProxy and mock StratosAuthService
		pp, db, mock := setupPortalProxyWithAuthService(mockStratosAuth)
		defer db.Close()

		pp.Config.AutoRefreshCNSITokens = true

		// mock individual APIEndpoints
		mockV2Info := setupMockEndpointServer(t)
		defer mockV2Info.Close()

		mockUAAResponseModifiedExpiry := mockUAAResponse

		splits := strings.Split(mockUAAResponse.AccessToken, ".")

		decoded, _ := base64.RawStdEncoding.DecodeString(splits[1])

		u := new(api.JWTUserTokenInfo)
		json.Unmarshal(decoded, &u)

		u.TokenExpiry = time.Now().Add(time.Minute * 5).Unix()

		encode, _ := json.Marshal(u)

		splits[1] = base64.RawStdEncoding.EncodeToString(encode)

		mockUAAResponseModifiedExpiry.AccessToken = strings.Join(splits, ".")

		mockUAA := setupMockServer(t,
			msRoute("/oauth/token"),
			msMethod("POST"),
			msStatus(http.StatusOK),
			msBody(jsonMust(mockUAAResponseModifiedExpiry)))

		// mock different users
		mockAdmin := setupMockUser(mockAdminGUID, true, []string{})

		pp.GetConfig().UserEndpointsEnabled = config.UserEndpointsConfigEnum.Enabled

		// setup
		adminEndpoint := setupMockEndpointRegisterRequest(t, mockAdmin.ConnectedUser, mockV2Info, "CF Cluster 1", true, true)

		if errSession := pp.setSessionValues(adminEndpoint.EchoContext, mockAdmin.SessionValues); errSession != nil {
			t.Error(errors.New("unable to mock/stub user in session object"))
		}

		Convey("registering a new endpoint and logging in leads to a refresh routine being started", func() {
			// mock executions
			mockStratosAuth.
				EXPECT().
				GetUser(gomock.Eq(mockAdmin.ConnectedUser.GUID)).
				Return(mockAdmin.ConnectedUser, nil)

			// Production no longer SELECTs before INSERT (duplicate-URL check removed in
			// 9a0207f16d — duplicates now allowed for operator multi-auth scenarios).
			mock.
				ExpectExec(insertIntoCNSIs).
				WillReturnResult(sqlmock.NewResult(1, 1))

			fetchInfo := getCFPlugin(pp, "cf").Info
			err := pp.RegisterEndpoint(adminEndpoint.EchoContext, fetchInfo)

			So(err, ShouldBeNil)

			first := adminEndpoint.QueryArgs[:4]
			newRow := append(first, mockUAA.URL)
			last := adminEndpoint.QueryArgs[5:]
			newRow = append(newRow, last...)

			mock.
				ExpectQuery(selectAnyFromCNSIs).
				WillReturnRows(
					sqlmock.NewRows(
						[]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint", "doppler_logging_endpoint", "skip_ssl_validation", "client_id", "client_secret", "sso_allowed", "sub_type", "meta_data", "creator", "ca_cert"},
					).AddRow(newRow...),
				)

			mock.
				ExpectQuery(selectAnyFromCNSIs).
				WillReturnRows(
					sqlmock.NewRows(
						[]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint", "doppler_logging_endpoint", "skip_ssl_validation", "client_id", "client_secret", "sso_allowed", "sub_type", "meta_data", "creator", "ca_cert"},
					).AddRow(newRow...),
				)

			mock.
				ExpectQuery(selectAnyFromTokens).
				WithArgs(newRow[0], mockAdmin.ConnectedUser.GUID).
				WillReturnRows(sqlmock.NewRows([]string{"count(*)"}).AddRow(0))

			mock.
				ExpectExec(insertIntoTokens).
				WillReturnResult(sqlmock.NewResult(1, 1))

			mock.
				ExpectQuery(selectAnyFromCNSIs).
				WillReturnRows(
					sqlmock.NewRows(
						[]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint", "doppler_logging_endpoint", "skip_ssl_validation", "client_id", "client_secret", "sso_allowed", "sub_type", "meta_data", "creator", "ca_cert"},
					).AddRow(newRow...),
				)

			mock.
				ExpectQuery(selectAnyFromCNSIs).
				WillReturnRows(
					sqlmock.NewRows(
						[]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint", "doppler_logging_endpoint", "skip_ssl_validation", "client_id", "client_secret", "sso_allowed", "sub_type", "meta_data", "creator", "ca_cert"},
					).AddRow(newRow...),
				)

			mockStratosAuth.
				EXPECT().
				GetUser(gomock.Eq(mockAdmin.ConnectedUser.GUID)).
				Return(mockAdmin.ConnectedUser, nil)

			// value are irrelevant, since we mock the reponse from the uaa regardless but the login won't work without them
			formDataForApiLogin := url.Values{}
			formDataForApiLogin.Set("username", "test")
			formDataForApiLogin.Set("password", "test")
			newReq, _ := http.NewRequest(http.MethodPost, "localhost:9999/some/fake/url", bytes.NewBufferString(formDataForApiLogin.Encode()))
			newReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

			newContext := adminEndpoint.EchoContext.Echo().NewContext(newReq, adminEndpoint.EchoContext.Response())
			_, err = pp.DoLoginToCNSI(newContext, adminEndpoint.GUID, true)

			// Asynchronosly wait 5 seconds, then cancel the refresh routines
			go func() {
				time.Sleep(time.Second * 5)
				pp.refreshRoutines.cancel()
			}()

			// Wait until all refresh routines have terminated (portalProxy does the same on graceful shutdown)
			pp.refreshRoutines.wg.Wait()

			So(err, ShouldBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})
	})
}

func TestRegisterWithUserEndpointsEnabled(t *testing.T) {
	// execute this in parallel
	t.Parallel()

	Convey("Request to register endpoint", t, func() {

		// mock StratosAuthService
		ctrl := gomock.NewController(t)
		mockStratosAuth := mock_api.NewMockStratosAuth(ctrl)
		defer ctrl.Finish()

		// setup mock DB, PortalProxy and mock StratosAuthService
		pp, db, mock := setupPortalProxyWithAuthService(mockStratosAuth)
		defer db.Close()

		// mock individual APIEndpoints
		mockV2Info := setupMockEndpointServer(t)
		defer mockV2Info.Close()

		// mock different users
		mockAdmin := setupMockUser(mockAdminGUID, true, []string{})
		mockUser1 := setupMockUser(mockUserGUID+"1", false, []string{"stratos.endpointadmin"})
		mockUser2 := setupMockUser(mockUserGUID+"2", false, []string{"stratos.endpointadmin"})

		Convey("with UserEndpointsEnabled=enabled", func() {

			pp.GetConfig().UserEndpointsEnabled = config.UserEndpointsConfigEnum.Enabled

			Convey("as admin", func() {
				Convey("with createSystemEndpoint enabled", func() {
					// setup
					adminEndpoint := setupMockEndpointRegisterRequest(t, mockAdmin.ConnectedUser, mockV2Info, "CF Cluster 1", true, true)

					if errSession := pp.setSessionValues(adminEndpoint.EchoContext, mockAdmin.SessionValues); errSession != nil {
						t.Error(errors.New("unable to mock/stub user in session object"))
					}
					Convey("register new endpoint", func() {
						// mock executions
						mockStratosAuth.
							EXPECT().
							GetUser(gomock.Eq(mockAdmin.ConnectedUser.GUID)).
							Return(mockAdmin.ConnectedUser, nil)

						// Production no longer SELECTs for duplicates before INSERT (9a0207f16d).
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
						// setup — userEndpoint simulates a pre-existing user registration with
						// same URL; we no longer mock the SELECT that production used to do,
						// but the fixture remains as documentation of the scenario being tested.
						_ = setupMockEndpointRegisterRequest(t, mockUser1.ConnectedUser, mockV2Info, "CF Cluster 1 User", false, false)

						// mock executions
						mockStratosAuth.
							EXPECT().
							GetUser(gomock.Eq(mockAdmin.ConnectedUser.GUID)).
							Return(mockAdmin.ConnectedUser, nil)

						// Production no longer SELECTs for duplicates before INSERT (9a0207f16d).
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
					// Removed sub-case "create system endpoint over existing system endpoints":
					// production no longer rejects duplicate URLs (9a0207f16d); duplicates
					// are allowed under the multi-auth operator scenario FWT-929 unblocked.
				})
				Convey("with createSystemEndpoint disabled", func() {

					// setup
					adminEndpoint := setupMockEndpointRegisterRequest(t, mockAdmin.ConnectedUser, mockV2Info, "CF Cluster 1", false, false)
					systemEndpoint := setupMockEndpointRegisterRequest(t, mockAdmin.ConnectedUser, mockV2Info, "CF Cluster 1", false, true)

					if errSession := pp.setSessionValues(adminEndpoint.EchoContext, mockAdmin.SessionValues); errSession != nil {
						t.Error(errors.New("unable to mock/stub user in session object"))
					}

					Convey("register personal endpoint over system endpoint", func() {
						// mock executions
						mockStratosAuth.
							EXPECT().
							GetUser(gomock.Eq(mockAdmin.ConnectedUser.GUID)).
							Return(mockAdmin.ConnectedUser, nil)

						// Production no longer SELECTs for duplicates before INSERT (9a0207f16d);
						// systemEndpoint fixture kept above as scenario documentation.
						_ = systemEndpoint

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
					// Removed sub-case "register personal endpoint twice": production no longer
					// rejects duplicate registrations (9a0207f16d).
				})
			})

			Convey("as user", func() {
				Convey("with createSystemEndpoint enabled", func() {
					// setup
					userEndpoint := setupMockEndpointRegisterRequest(t, mockUser1.ConnectedUser, mockV2Info, "CF Cluster 1", true, false)

					if errSession := pp.setSessionValues(userEndpoint.EchoContext, mockUser1.SessionValues); errSession != nil {
						t.Error(errors.New("unable to mock/stub user in session object"))
					}

					Convey("register new endpoint", func() {
						// mock executions
						mockStratosAuth.
							EXPECT().
							GetUser(gomock.Eq(mockUser1.ConnectedUser.GUID)).
							Return(mockUser1.ConnectedUser, nil)

						// Production no longer SELECTs for duplicates before INSERT (9a0207f16d).
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
						// userEndpoint2 simulates a pre-existing registration by a different
						// user with the same URL; production no longer checks for it.
						_ = setupMockEndpointRegisterRequest(t, mockUser2.ConnectedUser, mockV2Info, "CF Cluster 2", false, false)

						// mock executions
						mockStratosAuth.
							EXPECT().
							GetUser(gomock.Eq(mockUser1.ConnectedUser.GUID)).
							Return(mockUser1.ConnectedUser, nil)

						// Production no longer SELECTs for duplicates before INSERT (9a0207f16d).
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
					// Removed sub-case "register existing endpoint from same user" (user+system
					// enabled): production no longer rejects duplicate registrations
					// (9a0207f16d).
				})
				Convey("with createSystemEndpoint disabled", func() {
					// Removed sub-case "register existing endpoint from same user" (user+system
					// disabled): production no longer rejects duplicate registrations
					// (9a0207f16d). The wrapping Convey is preserved in case future coverage
					// for this config branch is added.
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
		mockStratosAuth := mock_api.NewMockStratosAuth(ctrl)
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

		adminRows := testutils.GetEmptyCNSIRows().
			AddRow(adminEndpointArgs...)
		user1Rows := testutils.GetEmptyCNSIRows().
			AddRow(userEndpoint1Args...)
		allRows := testutils.GetEmptyCNSIRows().
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

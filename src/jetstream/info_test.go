package main

import (
	"database/sql"
	"errors"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang/mock/gomock"
	"github.com/labstack/echo/v4"
	sqlmock "gopkg.in/DATA-DOG/go-sqlmock.v1"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	mock_api "github.com/cloudfoundry/stratos/src/jetstream/api/mock"
)

func TestPortalConfigIncludesConcurrencyFields(t *testing.T) {
	config := api.PortalConfig{}
	config.EndpointCardConcurrency = 3
	config.EndpointRequestConcurrency = 5

	if config.EndpointCardConcurrency != 3 {
		t.Errorf("EndpointCardConcurrency not set: expected 3, got %d", config.EndpointCardConcurrency)
	}
	if config.EndpointRequestConcurrency != 5 {
		t.Errorf("EndpointRequestConcurrency not set: expected 5, got %d", config.EndpointRequestConcurrency)
	}
}

func TestInfoConfigurationIncludesConcurrencyFields(t *testing.T) {
	info := api.Info{}
	info.Configuration.EndpointCardConcurrency = 2
	info.Configuration.EndpointRequestConcurrency = 3

	if info.Configuration.EndpointCardConcurrency != 2 {
		t.Errorf("EndpointCardConcurrency not set on Info.Configuration: expected 2, got %d", info.Configuration.EndpointCardConcurrency)
	}
	if info.Configuration.EndpointRequestConcurrency != 3 {
		t.Errorf("EndpointRequestConcurrency not set on Info.Configuration: expected 3, got %d", info.Configuration.EndpointRequestConcurrency)
	}
}

// setupGetInfoTest creates a portalProxy with the given concurrency values, a
// mock auth service that returns a non-admin user for GetUser, and an echo
// context with a valid session.  The caller is responsible for closing db.
func setupGetInfoTest(t *testing.T, cardConcurrency, requestConcurrency int) (*portalProxy, echo.Context, *sql.DB, sqlmock.Sqlmock, *gomock.Controller) {
	t.Helper()

	ctrl := gomock.NewController(t)
	mockAuth := mock_api.NewMockStratosAuth(ctrl)

	pp, db, mock := setupPortalProxyWithAuthService(mockAuth)

	pp.Config.EndpointCardConcurrency = cardConcurrency
	pp.Config.EndpointRequestConcurrency = requestConcurrency

	req := setupMockReq("GET", "", map[string]string{})
	res := httptest.NewRecorder()
	_, ctx := setupEchoContext(res, req)

	sessionValues := map[string]interface{}{
		"user_id": mockUserGUID,
		"exp":     time.Now().Add(time.Hour).Unix(),
	}
	if err := pp.setSessionValues(ctx, sessionValues); err != nil {
		t.Error(errors.New("unable to stub session values"))
	}

	// getVersionsData queries goose_db_version
	versionRow := sqlmock.NewRows([]string{"version_id"}).AddRow(mockProxyVersion)
	mock.ExpectQuery(getDbVersion).WillReturnRows(versionRow)

	// getInfo calls buildCNSIList which may query tokens; return empty result
	mock.ExpectQuery(selectAnyFromTokens).WillReturnRows(sqlmock.NewRows([]string{}))

	// getInfo calls StratosAuthService.GetUser
	mockAuth.EXPECT().GetUser(mockUserGUID).Return(&api.ConnectedUser{
		GUID:  mockUserGUID,
		Name:  "admin",
		Admin: false,
	}, nil).AnyTimes()

	return pp, ctx, db, mock, ctrl
}

// TestGetInfoConcurrencyDefaults verifies that when EndpointCardConcurrency and
// EndpointRequestConcurrency are both 0 (unset), getInfo() populates them with
// the built-in defaults of 2 and 3 respectively.
func TestGetInfoConcurrencyDefaults(t *testing.T) {
	t.Parallel()

	pp, ctx, db, _, ctrl := setupGetInfoTest(t, 0, 0)
	defer db.Close()
	defer ctrl.Finish()

	info, err := pp.getInfo(ctx)
	if err != nil {
		t.Fatalf("getInfo() returned unexpected error: %v", err)
	}

	if info.Configuration.EndpointCardConcurrency != 2 {
		t.Errorf("EndpointCardConcurrency default: expected 2, got %d", info.Configuration.EndpointCardConcurrency)
	}
	if info.Configuration.EndpointRequestConcurrency != 3 {
		t.Errorf("EndpointRequestConcurrency default: expected 3, got %d", info.Configuration.EndpointRequestConcurrency)
	}
}

// TestGetInfoConcurrencyExplicitValues verifies that when EndpointCardConcurrency
// and EndpointRequestConcurrency are set to non-zero values, getInfo() preserves
// those values and does not overwrite them with defaults.
func TestGetInfoConcurrencyExplicitValues(t *testing.T) {
	t.Parallel()

	pp, ctx, db, _, ctrl := setupGetInfoTest(t, 5, 10)
	defer db.Close()
	defer ctrl.Finish()

	info, err := pp.getInfo(ctx)
	if err != nil {
		t.Fatalf("getInfo() returned unexpected error: %v", err)
	}

	if info.Configuration.EndpointCardConcurrency != 5 {
		t.Errorf("EndpointCardConcurrency explicit: expected 5, got %d", info.Configuration.EndpointCardConcurrency)
	}
	if info.Configuration.EndpointRequestConcurrency != 10 {
		t.Errorf("EndpointRequestConcurrency explicit: expected 10, got %d", info.Configuration.EndpointRequestConcurrency)
	}
}

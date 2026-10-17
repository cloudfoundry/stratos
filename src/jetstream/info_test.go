package main

import (
	"database/sql"
	"errors"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/labstack/echo/v5"
	"go.uber.org/mock/gomock"
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
func setupGetInfoTest(t *testing.T, cardConcurrency, requestConcurrency int) (*portalProxy, *echo.Context, *sql.DB, sqlmock.Sqlmock, *gomock.Controller) {
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

// TestJobTrackingLimitMins verifies how long the console follows a job: the
// default when unset, at least a minute (0 included), the configured value
// up to a day (with a warning past 6 hours), and 6 hours for anything longer.
func TestJobTrackingLimitMins(t *testing.T) {
	t.Parallel()
	cases := []struct {
		configured int
		want       int
		warn       bool
	}{
		{0, 1, true},
		{-5, 1, true},
		{1, 1, false},
		{90, 90, false},
		{360, 360, false},
		{361, 361, true},
		{1439, 1439, true},
		{1440, 360, true},
		{5000, 360, true},
	}
	for _, c := range cases {
		got, warning := jobTrackingLimitMins(c.configured, true)
		if got != c.want || (warning != "") != c.warn {
			t.Errorf("jobTrackingLimitMins(%d) = %d, %q; want %d, warn %v", c.configured, got, warning, c.want, c.warn)
		}
	}
	if got, warning := jobTrackingLimitMins(0, false); got != 60 || warning != "" {
		t.Errorf("jobTrackingLimitMins unset = %d, %q; want 60, no warning", got, warning)
	}
}

// TestGetInfoJobTrackingLimit verifies /info hands the browser the limit,
// and the default when the config never set one.
func TestGetInfoJobTrackingLimit(t *testing.T) {
	t.Parallel()
	for _, c := range []struct{ configured, want int }{{0, 60}, {90, 90}} {
		pp, ctx, db, _, ctrl := setupGetInfoTest(t, 0, 0)
		pp.Config.AsyncJobTrackingLimitMins = c.configured
		info, err := pp.getInfo(ctx)
		if err != nil {
			t.Fatalf("getInfo() returned unexpected error: %v", err)
		}
		if info.Configuration.JobTrackingLimitMins != c.want {
			t.Errorf("JobTrackingLimitMins for %d: expected %d, got %d", c.configured, c.want, info.Configuration.JobTrackingLimitMins)
		}
		db.Close()
		ctrl.Finish()
	}
}

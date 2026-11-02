package main

import (
	"net/url"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/testutils"
	"github.com/stretchr/testify/require"
)

// Endpoints of different types may share a URL: a Metrics endpoint can be
// registered at the Cloud Foundry API's address. The auto-register login
// hook looked the Cloud Foundry endpoint up by URL alone, found the Metrics
// one, and failed every login trying to connect it with CF credentials.
func TestGetAdminCNSIRecordByEndpointMatchesTheType(t *testing.T) {
	req := setupMockReq("GET", "", nil)
	_, _, _, pp, db, mock := setupHTTPTest(req)
	defer db.Close()

	cf := testutils.GetTestCNSIRecord()
	metrics := testutils.GetTestCNSIRecord()
	metrics.GUID = "metrics-guid"
	metrics.CNSIType = "metrics"

	mock.ExpectQuery(selectFromCNSIs).WillReturnRows(testutils.GetCNSIRows(cf, metrics))
	rec, err := pp.GetAdminCNSIRecordByEndpoint(cf.APIEndpoint.String(), "cf")
	require.NoError(t, err)
	require.Equal(t, cf.GUID, rec.GUID)

	mock.ExpectQuery(selectFromCNSIs).WillReturnRows(testutils.GetCNSIRows(metrics))
	_, err = pp.GetAdminCNSIRecordByEndpoint(cf.APIEndpoint.String(), "cf")
	require.Error(t, err, "a Metrics endpoint alone is not the Cloud Foundry endpoint")

	require.NoError(t, mock.ExpectationsWereMet())
}

// The login hook links the console's token into the endpoint it picks, and a
// refresh sends that token with the endpoint's client. With several endpoints
// at the URL it took the last one the database returned (an edit could move
// one there), so an endpoint using another client got a token it could never
// refresh.
func TestGetAdminCNSIRecordByEndpointPrefersTheConsoleClient(t *testing.T) {
	req := setupMockReq("GET", "", nil)
	_, _, _, pp, db, mock := setupHTTPTest(req)
	defer db.Close()
	pp.Config.CFClient = "console-client"

	console := testutils.GetTestCNSIRecord()
	console.GUID = "console-client-guid"
	console.ClientId = "console-client"
	other := testutils.GetTestCNSIRecord()
	other.GUID = "cf-client-guid"
	other.ClientId = "cf"

	mock.ExpectQuery(selectFromCNSIs).WillReturnRows(testutils.GetCNSIRows(console, other))
	rec, err := pp.GetAdminCNSIRecordByEndpoint(console.APIEndpoint.String(), "cf")
	require.NoError(t, err)
	require.Equal(t, console.GUID, rec.GUID)

	mock.ExpectQuery(selectFromCNSIs).WillReturnRows(testutils.GetCNSIRows(other))
	rec, err = pp.GetAdminCNSIRecordByEndpoint(console.APIEndpoint.String(), "cf")
	require.NoError(t, err, "with no endpoint on the console's client, take the one there is")
	require.Equal(t, other.GUID, rec.GUID)

	require.NoError(t, mock.ExpectationsWereMet())
}

// Linking the console's token into an endpoint on another client gave it a
// token that UAA refuses to refresh for that client ("Authentication
// expired"), and the refused refresh was recorded on the console's own token.
func TestConsoleTokenIsNotLinkedIntoAnotherClientsEndpoint(t *testing.T) {
	req := setupMockReq("GET", "", nil)
	_, _, _, pp, db, mock := setupHTTPTest(req)
	defer db.Close()
	pp.Config.CFClient = "console-client"

	rec := testutils.GetTestCNSIRecord()
	rec.ClientId = "cf"
	err := pp.DoLoginToCNSIwithConsoleUAAtoken(nil, *rec)
	require.ErrorContains(t, err, `"cf"`)
	require.NoError(t, mock.ExpectationsWereMet(), "nothing read or written")
}

// The same address can be written several ways. The lookup compared the
// stored string exactly, so an endpoint registered as https://API.x:443/
// was not found from https://api.x, and the login hook did not connect it.
func TestEndpointURLKey(t *testing.T) {
	t.Parallel()
	cases := []struct {
		a, b string
		same bool
	}{
		{"https://api.example.com", "https://API.Example.com", true},
		{"https://api.example.com", "HTTPS://api.example.com", true},
		{"https://api.example.com", "https://api.example.com:443", true},
		{"http://api.example.com", "http://api.example.com:80", true},
		{"https://github.com/norman-abramovitz", "https://github.com//norman-abramovitz", true},
		{"https://x.example.com", "https://x.example.com/", true},
		{"https://x.example.com/cf", "https://x.example.com/cf/", true},
		{"https://api.example.com", "https://api.example.com?a=b#c", true},
		{"https://[::1]", "https://[::1]:443", true},
		{"https://api.example.com", "https://api.example.com:8443", false},
		{"https://api.example.com:8443", "https://api.example.com:9443", false},
		{"http://api.example.com", "https://api.example.com", false},
		{"https://x.example.com/cf", "https://x.example.com/cf2", false},
		{"https://x.example.com/cf", "https://x.example.com", false},
	}
	for _, tc := range cases {
		a, err := url.Parse(tc.a)
		require.NoError(t, err)
		b, err := url.Parse(tc.b)
		require.NoError(t, err)
		require.Equal(t, tc.same, endpointURLKey(a) == endpointURLKey(b), "%s vs %s", tc.a, tc.b)
	}
}

func TestGetAdminCNSIRecordByEndpointMatchesTheAddressNotTheString(t *testing.T) {
	req := setupMockReq("GET", "", nil)
	_, _, _, pp, db, mock := setupHTTPTest(req)
	defer db.Close()

	other := testutils.GetTestCNSIRecord()
	other.GUID = "other-guid"
	other.APIEndpoint, _ = url.Parse("https://api.other.example.com")
	cf := testutils.GetTestCNSIRecord()
	cf.APIEndpoint, _ = url.Parse("https://API.sys.example.com:443/")

	mock.ExpectQuery(selectFromCNSIs).WillReturnRows(testutils.GetCNSIRows(other, cf))
	rec, err := pp.GetAdminCNSIRecordByEndpoint("https://api.sys.example.com", "cf")
	require.NoError(t, err)
	require.Equal(t, cf.GUID, rec.GUID)
	require.Equal(t, "https://API.sys.example.com:443", rec.APIEndpoint.String(), "the stored address is not rewritten")

	require.NoError(t, mock.ExpectationsWereMet())
}

// Several admin endpoints may share the auto-register URL and the console's
// client (duplicates are allowed). The login hook took whichever one the
// database returned first, so a second endpoint at that address could be
// connected at login instead of the auto-registered one.
func TestGetAdminCNSIRecordByEndpointPrefersTheAutoRegisteredName(t *testing.T) {
	req := setupMockReq("GET", "", nil)
	_, _, _, pp, db, mock := setupHTTPTest(req)
	defer db.Close()
	pp.Config.CFClient = "console-client"

	other := testutils.GetTestCNSIRecord()
	other.GUID = "other-guid"
	other.Name = "norm-lab"
	other.ClientId = "console-client"
	autoReg := testutils.GetTestCNSIRecord()
	autoReg.GUID = "auto-reg-guid"
	autoReg.Name = "Cloud Foundry"
	autoReg.ClientId = "console-client"

	mock.ExpectQuery(selectFromCNSIs).WillReturnRows(testutils.GetCNSIRows(other, autoReg))
	rec, err := pp.GetAdminCNSIRecordByEndpoint(autoReg.APIEndpoint.String(), "cf")
	require.NoError(t, err)
	require.Equal(t, autoReg.GUID, rec.GUID, "the default auto-register name wins a tie")

	pp.Config.AutoRegisterCFName = "norm-lab"
	mock.ExpectQuery(selectFromCNSIs).WillReturnRows(testutils.GetCNSIRows(autoReg, other))
	rec, err = pp.GetAdminCNSIRecordByEndpoint(autoReg.APIEndpoint.String(), "cf")
	require.NoError(t, err)
	require.Equal(t, other.GUID, rec.GUID, "a configured AUTO_REG_CF_NAME wins a tie")

	require.NoError(t, mock.ExpectationsWereMet())
}

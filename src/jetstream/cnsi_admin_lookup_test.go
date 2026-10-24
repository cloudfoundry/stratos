package main

import (
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

	mock.ExpectQuery(selectAnyFromCNSIs).WillReturnRows(testutils.GetCNSIRows(cf, metrics))
	rec, err := pp.GetAdminCNSIRecordByEndpoint(cf.APIEndpoint.String(), "cf")
	require.NoError(t, err)
	require.Equal(t, cf.GUID, rec.GUID)

	mock.ExpectQuery(selectAnyFromCNSIs).WillReturnRows(testutils.GetCNSIRows(metrics))
	_, err = pp.GetAdminCNSIRecordByEndpoint(cf.APIEndpoint.String(), "cf")
	require.Error(t, err, "a Metrics endpoint alone is not the Cloud Foundry endpoint")

	require.NoError(t, mock.ExpectationsWereMet())
}

package testutils

import (
	"net/url"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/crypto"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/tokens"
	"gopkg.in/DATA-DOG/go-sqlmock.v1"
)

var (
	MockCNSIGUID        = "some-guid-1234"
	MockCNSIName        = "mockCF"
	MockCFGUID          = "some-cf-guid-1234"
	MockCFName          = "Some fancy CF Cluster"
	MockHCEGUID         = "some-hce-guid-1234"
	MockHCEName         = "Some fancy HCE Cluster"
	MockAPIEndpoint     = "https://api.127.0.0.1"
	MockAuthEndpoint    = "https://login.127.0.0.1"
	MockDopplerEndpoint = "https://doppler.127.0.0.1"
	MockClientId        = "stratos_clientid"
	MockClientSecret    = "stratos_secret"
	MockAccount         = "asd-gjfg-bob"
	MockTokenGUID       = "mock-token-guid"
	MockUAAToken        = `eyJhbGciOiJSUzI1NiIsImtpZCI6ImxlZ2FjeS10b2tlbi1rZXkiLCJ0eXAiOiJKV1QifQ.eyJqdGkiOiI2ZGIyYTI5NGYyYWE0OGNlYjI1NDgzMDk4ZDNjY2Q3YyIsInN1YiI6Ijg4YmNlYWE1LWJkY2UtNDdiOC04MmYzLTRhZmMxNGYyNjZmOSIsInNjb3BlIjpbIm9wZW5pZCIsInNjaW0ucmVhZCIsImNsb3VkX2NvbnRyb2xsZXIuYWRtaW4iLCJ1YWEudXNlciIsImNsb3VkX2NvbnRyb2xsZXIucmVhZCIsInBhc3N3b3JkLndyaXRlIiwicm91dGluZy5yb3V0ZXJfZ3JvdXBzLnJlYWQiLCJjbG91ZF9jb250cm9sbGVyLndyaXRlIiwiZG9wcGxlci5maXJlaG9zZSIsInNjaW0ud3JpdGUiXSwiY2xpZW50X2lkIjoiY2YiLCJjaWQiOiJjZiIsImF6cCI6ImNmIiwiZ3JhbnRfdHlwZSI6InBhc3N3b3JkIiwidXNlcl9pZCI6Ijg4YmNlYWE1LWJkY2UtNDdiOC04MmYzLTRhZmMxNGYyNjZmOSIsIm9yaWdpbiI6InVhYSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbiIsImF1dGhfdGltZSI6MTQ2Nzc2OTgxNiwicmV2X3NpZyI6IjE0MGUwMjZiIiwiaWF0IjoxNDY3NzY5ODE2LCJleHAiOjE0Njc3NzA0MTYsImlzcyI6Imh0dHBzOi8vdWFhLmV4YW1wbGUuY29tL29hdXRoL3Rva2VuIiwiemlkIjoidWFhIiwiYXVkIjpbImNmIiwib3BlbmlkIiwic2NpbSIsImNsb3VkX2NvbnRyb2xsZXIiLCJ1YWEiLCJwYXNzd29yZCIsInJvdXRpbmcucm91dGVyX2dyb3VwcyIsImRvcHBsZXIiXX0.q2u0JX42Qiwr0ZsBU5Y6bF74_0URWmmBYTLf8l7of_6huFoMkyqvirEYcbYbATt6Hz2zcN6xlXcInALxQ6nt6Jk01kZHRNYfuu6QziLHHw2o_dJWk9iipiermUze7BvSGtU_JXx45BSBNVFxvRxG9Yv54Lwa9FvyhMSmK3CI5S8NtVDchzrsH3sMsIjlTAb-L7sch-OOQ7ncWH1JoGMtw8sTbiaHvfNJQclSq8Ro11NUtRHiWeGFFxYIerzKO-TrSpDojFJrYVuK1m0YPmBDa_dY3cneRuppagRIn8oI0VFHF8BckrIqNCHvOMoVz6uzHebo9LK7H5z5SluxJ2vYUgPiHE_Tyo-7gELnNSy8qL4Bk9yTxNseeGiq13TSTGOtNnbrv1eq4ZeW7eafseLceKIZH2QZlXVzwd_aWbuKRv9ApDwy4AcSbpM0XtU89IjUEDoOf3IDWV2YZTZkEaXZ52Mhztb1O_IVpHyyks88P67RoANFt83MnCai9U3stCX45LEsg9oz2djrVnfHDzRNQVlg9hKJYbxsa2R5tpnftjhz-hfpsoPRxBkJDKM2islyd-gLqHtsERiZEoifu93VRE0Jvk6vaCNdStw7y4mq73Co6ykNUYA78SlT9lCwDJRQHTJiDWg33EeKpXne8joZbElwrKNcv93X1qxxvmp1wXQ bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImxlZ2FjeS10b2tlbi1rZXkiLCJ0eXAiOiJKV1QifQ.eyJqdGkiOiI2ZGIyYTI5NGYyYWE0OGNlYjI1NDgzMDk4ZDNjY2Q3Yy1yIiwic3ViIjoiODhiY2VhYTUtYmRjZS00N2I4LTgyZjMtNGFmYzE0ZjI2NmY5Iiwic2NvcGUiOlsib3BlbmlkIiwic2NpbS5yZWFkIiwiY2xvdWRfY29udHJvbGxlci5hZG1pbiIsInVhYS51c2VyIiwiY2xvdWRfY29udHJvbGxlci5yZWFkIiwicGFzc3dvcmQud3JpdGUiLCJyb3V0aW5nLnJvdXRlcl9ncm91cHMucmVhZCIsImNsb3VkX2NvbnRyb2xsZXIud3JpdGUiLCJkb3BwbGVyLmZpcmVob3NlIiwic2NpbS53cml0ZSJdLCJpYXQiOjE0Njc3Njk4MTYsImV4cCI6MTQ3MDM2MTgxNiwiY2lkIjoiY2YiLCJjbGllbnRfaWQiOiJjZiIsImlzcyI6Imh0dHBzOi8vdWFhLmV4YW1wbGUuY29tL29hdXRoL3Rva2VuIiwiemlkIjoidWFhIiwiZ3JhbnRfdHlwZSI6InBhc3N3b3JkIiwidXNlcl9uYW1lIjoiYWRtaW4iLCJvcmlnaW4iOiJ1YWEiLCJ1c2VyX2lkIjoiODhiY2VhYTUtYmRjZS00N2I4LTgyZjMtNGFmYzE0ZjI2NmY5IiwicmV2X3NpZyI6IjE0MGUwMjZiIiwiYXVkIjpbImNmIiwib3BlbmlkIiwic2NpbSIsImNsb3VkX2NvbnRyb2xsZXIiLCJ1YWEiLCJwYXNzd29yZCIsInJvdXRpbmcucm91dGVyX2dyb3VwcyIsImRvcHBsZXIiXX0.K5M_isGkEBAN_MaXqkVvJfHG86rGIUkDgsHaFnoKOA1x5FNC4APDvhImWJZ8zbFHhXT3PYHTyeSf_HQaFDFUHFvGZUhSSry2ID4kdU5kRyZ-y3ydkv2mq32BlUQBSC9ap0r5vFTv7BY1yf2EcDaKGe4v4ODMhTm2SIkdTyk2ZcLXHIucS0xgSZdjgxNqh3pnKtmcFkw72-CyREW4_2Nbvn_7U2UNUCb2SeAuWmYaNAOkuGveB8jAhg9ftTrxn5GNtNe1sdVycm51X1O0dGPt_rLbwkRDCdNpm0La_xzLqZEl60_YUqwo33eOChFgqXB5y_0Pzs9gD__uExrIXYIgMsltFELXryyRUDKTTHZEEw1bnLTbQfF-GAnS0E0CaTU_kcDVqDYcqfh0TCcr7nGCEozExMPm3J0OGUSP3FQAD5mDICsKKcSIi_kIjggkJ87tuNAY6QOW1WzBoRizXJVS4jb3QOnrii2LmH786qBYJMX0nH__JRYEU-HWLi_OGXVTo03Pe9QcB8qJvbu2DGRfQdBfjhvgt2AItY4voJnZcjwT29q144C5wvJ2_W8cUzNY-Xw_tN_fWK4LWCu6KRNLVLO2MNbl0aOfkvb1U5NZJUpUUC2jG3cZM2c8232YNFKVjdjbf-Mlx17OxOYQ5XtG5BiSEj7BA6s5hWftUXEUchg`
	MockTokenExpiry     = time.Now().AddDate(0, 0, 1).Unix()
	MockAdminGUID       = tokens.SystemSharedUserGuid

	MockEncryptionKey = make([]byte, 32)

	MockCipherClientSecret = make([]byte, 0)
)

func ExpectNoRows() *sqlmock.Rows {
	return sqlmock.NewRows([]string{"COUNT(*)"}).AddRow("0")
}

func ExpectOneRow() *sqlmock.Rows {
	return sqlmock.NewRows([]string{"COUNT(*)"}).AddRow("1")
}

func init() {
	MockCipherClientSecret, _ = crypto.EncryptToken(MockEncryptionKey, MockClientSecret)
}

// Gets an empty sqlmock.Rows with all the columns of the cnsis table, except the ones passed as exclude
func GetEmptyCNSIRows(exclude ...string) *sqlmock.Rows {
	return sqlmock.NewRows(datastore.GetColumnNamesForCSNIs(exclude...))
}

// Gets the default CNSI Record for testing
func GetTestCNSIRecord() *api.CNSIRecord {
	u, _ := url.Parse(MockAPIEndpoint)

	return &api.CNSIRecord{
		GUID:                   MockCNSIGUID,
		Name:                   MockCNSIName,
		CNSIType:               "cf",
		APIEndpoint:            u,
		AuthorizationEndpoint:  MockAuthEndpoint,
		TokenEndpoint:          MockAuthEndpoint,
		DopplerLoggingEndpoint: MockDopplerEndpoint,
		SkipSSLValidation:      true,
		ClientId:               MockClientId,
		ClientSecret:           MockClientSecret,
		SSOAllowed:             false,
		SubType:                "",
		Metadata:               "",
		Local:                  false,
		Creator:                "",
		CACert:                 "",
	}
}

// Gets a prefilled sqlmock.Rows with all the columns of the cnsis table. It contains entries corresponding to the records passed in
func GetCNSIRows(records ...*api.CNSIRecord) *sqlmock.Rows {
	rows := sqlmock.NewRows(datastore.GetColumnNames("cnsis"))

	for _, record := range records {
		rows.AddRow(
			/* guid */ record.GUID,
			/* name */ record.Name,
			/* cnsi_type */ record.CNSIType,
			/* api_endpoint */ record.APIEndpoint.String(),
			/* auth_endpoint */ record.AuthorizationEndpoint,
			/* token_endpoint */ record.TokenEndpoint,
			/* doppler_logging_endpoint */ record.DopplerLoggingEndpoint,
			/* skip_ssl_validation */ record.SkipSSLValidation,
			/* client_id */ record.ClientId,
			/* client_secret */ MockCipherClientSecret,
			/* allow_sso */ record.SSOAllowed,
			/* sub_type */ record.SubType,
			/* meta_data */ record.Metadata,
			/* creator */ record.Creator,
			/* ca_cert */ record.CACert,
		)
	}

	return rows
}

// Gets an empty sqlmock.Rows with all the columns of the cnsis + token (connected endpoints) table, except the ones passed as exclude
func GetEmptyConnectedEndpointsRows(exclude ...string) *sqlmock.Rows {
	return sqlmock.NewRows(datastore.GetColumnNamesForConnectedEndpoints(exclude...))
}

// Gets a prefilled sqlmock.Rows with all the columns of the cnsis + tokens (connected endpoints) table. It contains entries corresponding to the records passed in
func GetConnectedEndpointsRows(records ...*api.ConnectedEndpoint) *sqlmock.Rows {
	rows := GetEmptyConnectedEndpointsRows(
		"auth_endpoint",
		"token_endpoint",
		"client_id",
		"client_secret",
		"allow_sso",
		"token_guid",
		"auth_token",
		"refresh_token",
		"auth_type",
		"user_guid",
		"linked_token",
		"enabled",
	)

	for _, record := range records {
		rows.AddRow(
			/* guid */ record.GUID,
			/* name */ record.Name,
			/* cnsi_type */ record.CNSIType,
			/* api_endpoint */ record.APIEndpoint.String(),
			/* doppler_logging_endpoint */ record.DopplerLoggingEndpoint,
			/* account */ record.Account,
			/* token_expiry */ record.TokenExpiry,
			/* skip_ssl_validation */ record.SkipSSLValidation,
			/* disconnected */ false,
			/* meta_data */ record.TokenMetadata,
			/* sub_type */ record.SubType,
			/* ca_cert */ record.CACert,
			/* endpoint_metadata */ record.EndpointMetadata,
			/* creator */ record.Creator,
		)
	}

	return rows
}

// Gets the default Connected Enpoint Record for testing
func GetTestConnectedEndpoint() *api.ConnectedEndpoint {
	u, _ := url.Parse(MockAPIEndpoint)

	return &api.ConnectedEndpoint{
		GUID:                   MockCFGUID,
		Name:                   MockCFName,
		CNSIType:               "cf",
		APIEndpoint:            u,
		Account:                MockAccount,
		TokenExpiry:            MockTokenExpiry,
		DopplerLoggingEndpoint: MockDopplerEndpoint,
		AuthorizationEndpoint:  "",
		SkipSSLValidation:      true,
		TokenMetadata:          "",
		SubType:                "",
		EndpointMetadata:       "",
		Local:                  false,
		Creator:                "",
		CACert:                 "",
	}
}

func GetEmptyTokenRows(exclude ...string) *sqlmock.Rows {
	return sqlmock.NewRows(datastore.GetColumnNamesForTokens(exclude...))
}

func GetTokenRows(encriptionKey []byte) *sqlmock.Rows {
	rows := GetEmptyTokenRows()

	encryptedToken, _ := crypto.EncryptToken(encriptionKey, MockUAAToken)

	rows.AddRow(MockTokenGUID, encryptedToken, encryptedToken, MockTokenExpiry, false, "OAuth2", "", MockAccount, nil, true)

	return rows
}

func GetTokenRowsWithExpiredToken(encriptionKey []byte) *sqlmock.Rows {
	rows := GetEmptyTokenRows()

	encryptedToken, _ := crypto.EncryptToken(encriptionKey, MockUAAToken)

	rows.AddRow(MockTokenGUID, encryptedToken, encryptedToken, time.Now().AddDate(0, 0, -1).Unix(), false, "OAuth2", "", MockAccount, nil, true)

	return rows
}

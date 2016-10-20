package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"gopkg.in/DATA-DOG/go-sqlmock.v1"

	"github.com/gorilla/securecookie"
	"github.com/gorilla/sessions"
	"github.com/hpcloud/portal-proxy/repository/tokens"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
)

type mockServer struct {
	Route  string
	Status int
	Method string
	Body   string
}

type mockPGStore struct {
	Codecs        []securecookie.Codec
	Options       *sessions.Options
	Path          string
	DbPool        *sql.DB
	StoredSession *sessions.Session
}

func (m *mockPGStore) Save(r *http.Request, w http.ResponseWriter, session *sessions.Session) error {
	m.StoredSession = session
	return nil
}

func (m *mockPGStore) Get(r *http.Request, name string) (*sessions.Session, error) {

	if m.StoredSession == nil {
		m.StoredSession = &sessions.Session{}
	}
	if m.StoredSession.Values == nil {
		m.StoredSession.Values = make(map[interface{}]interface{})
	}
	if m.StoredSession.Options == nil {
		m.StoredSession.Options = &sessions.Options{}
	}

	return m.StoredSession, nil
}

type mockServerFunc func(*mockServer)

const mockCNSIGUID = "some-guid-1234"
const mockHCFGUID = "some-hcf-guid-1234"
const mockHCEGUID = "some-hce-guid-1234"
const mockUserGUID = "asd-gjfg-bob"

const mockURLString = "http://localhost:9999/some/fake/url/"

func setupEchoContext(res http.ResponseWriter, req *http.Request) (*echo.Echo, echo.Context) {
	e := echo.New()
	ctx := e.NewContext(standard.NewRequest(req, nil), standard.NewResponse(res, nil))

	return e, ctx
}

func setupMockReq(method string, urlString string, formValues map[string]string) *http.Request {
	if urlString == "" {
		urlString = mockURLString
	}

	if formValues == nil {
		req, err := http.NewRequest(method, urlString, nil)
		if err != nil {
			panic(err)
		}
		return req
	}

	form := url.Values{}

	for key, value := range formValues {
		form.Set(key, value)
	}
	req, err := http.NewRequest(method, urlString, strings.NewReader(form.Encode()))
	if err != nil {
		panic(err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	return req
}

func setupMockPGStore(db *sql.DB) *mockPGStore {
	pgs := &mockPGStore{
		Options: &sessions.Options{},
		DbPool:  db,
	}

	return pgs
}

func setupPortalProxy(db *sql.DB) *portalProxy {

	//_, _ = rand.Read(key)

	pc := portalConfig{
		ConsoleClient:        "console",
		ConsoleClientSecret:  "",
		HCPIdentityHost:      "login.52.38.188.107.nip.io",
		HCPIdentityScheme:    "https",
		HCPIdentityPort:      "50450",
		SessionStoreSecret:   "hiddenraisinsohno!",
		EncryptionKeyInBytes: mockEncryptionKey,
	}

	pp := newPortalProxy(pc, db, nil)
	pp.SessionStore = setupMockPGStore(db)

	return pp
}

func expectNoRows() sqlmock.Rows {
	return sqlmock.NewRows([]string{"COUNT(*)"}).AddRow("0")
}

func expectOneRow() sqlmock.Rows {
	return sqlmock.NewRows([]string{"COUNT(*)"}).AddRow("1")
}

func expectHCFRow() sqlmock.Rows {
	return sqlmock.NewRows(rowFieldsForCNSI).
		AddRow(mockHCFGUID, "Some fancy HCF Cluster", "hcf", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, mockDopplerEndpoint)
}

func expectHCERow() sqlmock.Rows {
	return sqlmock.NewRows(rowFieldsForCNSI).
		AddRow(mockHCEGUID, "Some fancy HCE Cluster", "hce", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, "")
}

func expectHCFAndHCERows() sqlmock.Rows {
	return sqlmock.NewRows(rowFieldsForCNSI).
		AddRow(mockHCFGUID, "Some fancy HCF Cluster", "hcf", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, mockDopplerEndpoint).
		AddRow(mockHCEGUID, "Some fancy HCE Cluster", "hce", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, "")
}

func expectTokenRow() sqlmock.Rows {
	return sqlmock.NewRows([]string{"auth_token", "refresh_token", "token_expiry"}).
		AddRow(mockUAAToken, mockUAAToken, mockTokenExpiry)
}

func setupHTTPTest(req *http.Request) (*httptest.ResponseRecorder, *echo.Echo, echo.Context, *portalProxy, *sql.DB, sqlmock.Sqlmock) {
	res := httptest.NewRecorder()
	e, ctx := setupEchoContext(res, req)
	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		fmt.Printf("an error '%s' was not expected when opening a stub database connection", dberr)
	}
	pp := setupPortalProxy(db)

	pp.DatabaseConnectionPool = db

	return res, e, ctx, pp, db, mock
}

func msRoute(route string) mockServerFunc {
	return func(ms *mockServer) {
		ms.Route = route
	}
}

func msStatus(status int) mockServerFunc {
	return func(ms *mockServer) {
		ms.Status = status
	}
}

func msMethod(method string) mockServerFunc {
	return func(ms *mockServer) {
		ms.Method = method
	}
}

func msBody(body string) mockServerFunc {
	return func(ms *mockServer) {
		ms.Body = body
	}
}

func setupMockServer(t *testing.T, modifiers ...mockServerFunc) *httptest.Server {
	mServer := &mockServer{}
	for _, mod := range modifiers {
		mod(mServer)
	}

	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if mServer.Route != r.URL.Path {
			t.Errorf("Wanted path '%s', got path '%s'", mServer.Route, r.URL.Path)
		}
		if mServer.Method != r.Method {
			t.Errorf("Wanted method '%s', got method '%s'", mServer.Method, r.Method)
		}
		w.WriteHeader(mServer.Status)
		w.Write([]byte(mServer.Body))
	}))

	return server
}

func urlMust(i string) *url.URL {
	b, err := url.Parse(i)
	if err != nil {
		panic(err)
	}
	return b
}

// const mockUAAToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsInVzZXJfaWQiOiJhc2QtZ2pmZy1ib2IiLCJleHAiOjEyMzQ1Njd9.gO9WDYNEfMsnbz7-sICTNygzkqvWgMP2nm9BStJvvCw`
// const mockCNSIToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsInVzZXJfaWQiOiJhc2QtZ2pmZy1ib2IiLCJleHAiOjEyMzQ1Njd9.gO9WDYNEfMsnbz7-sICTNygzkqvWgMP2nm9BStJvvCw`

// `eyJhbGciOiJSUzI1NiIsImtpZCI6ImxlZ2FjeS10b2tlbi1rZXkiLCJ0eXAiOiJKV1QifQ.eyJqdGkiOiI2ZGIyYTI5NGYyYWE0OGNlYjI1NDgzMDk4ZDNjY2Q3YyIsInN1YiI6Ijg4YmNlYWE1LWJkY2UtNDdiOC04MmYzLTRhZmMxNGYyNjZmOSIsInNjb3BlIjpbIm9wZW5pZCIsInNjaW0ucmVhZCIsImNsb3VkX2NvbnRyb2xsZXIuYWRtaW4iLCJ1YWEudXNlciIsImNsb3VkX2NvbnRyb2xsZXIucmVhZCIsInBhc3N3b3JkLndyaXRlIiwicm91dGluZy5yb3V0ZXJfZ3JvdXBzLnJlYWQiLCJjbG91ZF9jb250cm9sbGVyLndyaXRlIiwiZG9wcGxlci5maXJlaG9zZSIsInNjaW0ud3JpdGUiXSwiY2xpZW50X2lkIjoiY2YiLCJjaWQiOiJjZiIsImF6cCI6ImNmIiwiZ3JhbnRfdHlwZSI6InBhc3N3b3JkIiwidXNlcl9pZCI6Ijg4YmNlYWE1LWJkY2UtNDdiOC04MmYzLTRhZmMxNGYyNjZmOSIsIm9yaWdpbiI6InVhYSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbiIsImF1dGhfdGltZSI6MTQ2Nzc2OTgxNiwicmV2X3NpZyI6IjE0MGUwMjZiIiwiaWF0IjoxNDY3NzY5ODE2LCJleHAiOjE0Njc3NzA0MTYsImlzcyI6Imh0dHBzOi8vdWFhLmV4YW1wbGUuY29tL29hdXRoL3Rva2VuIiwiemlkIjoidWFhIiwiYXVkIjpbImNmIiwib3BlbmlkIiwic2NpbSIsImNsb3VkX2NvbnRyb2xsZXIiLCJ1YWEiLCJwYXNzd29yZCIsInJvdXRpbmcucm91dGVyX2dyb3VwcyIsImRvcHBsZXIiXX0.q2u0JX42Qiwr0ZsBU5Y6bF74_0URWmmBYTLf8l7of_6huFoMkyqvirEYcbYbATt6Hz2zcN6xlXcInALxQ6nt6Jk01kZHRNYfuu6QziLHHw2o_dJWk9iipiermUze7BvSGtU_JXx45BSBNVFxvRxG9Yv54Lwa9FvyhMSmK3CI5S8NtVDchzrsH3sMsIjlTAb-L7sch-OOQ7ncWH1JoGMtw8sTbiaHvfNJQclSq8Ro11NUtRHiWeGFFxYIerzKO-TrSpDojFJrYVuK1m0YPmBDa_dY3cneRuppagRIn8oI0VFHF8BckrIqNCHvOMoVz6uzHebo9LK7H5z5SluxJ2vYUgPiHE_Tyo-7gELnNSy8qL4Bk9yTxNseeGiq13TSTGOtNnbrv1eq4ZeW7eafseLceKIZH2QZlXVzwd_aWbuKRv9ApDwy4AcSbpM0XtU89IjUEDoOf3IDWV2YZTZkEaXZ52Mhztb1O_IVpHyyks88P67RoANFt83MnCai9U3stCX45LEsg9oz2djrVnfHDzRNQVlg9hKJYbxsa2R5tpnftjhz-hfpsoPRxBkJDKM2islyd-gLqHtsERiZEoifu93VRE0Jvk6vaCNdStw7y4mq73Co6ykNUYA78SlT9lCwDJRQHTJiDWg33EeKpXne8joZbElwrKNcv93X1qxxvmp1wXQ bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImxlZ2FjeS10b2tlbi1rZXkiLCJ0eXAiOiJKV1QifQ.eyJqdGkiOiI2ZGIyYTI5NGYyYWE0OGNlYjI1NDgzMDk4ZDNjY2Q3Yy1yIiwic3ViIjoiODhiY2VhYTUtYmRjZS00N2I4LTgyZjMtNGFmYzE0ZjI2NmY5Iiwic2NvcGUiOlsib3BlbmlkIiwic2NpbS5yZWFkIiwiY2xvdWRfY29udHJvbGxlci5hZG1pbiIsInVhYS51c2VyIiwiY2xvdWRfY29udHJvbGxlci5yZWFkIiwicGFzc3dvcmQud3JpdGUiLCJyb3V0aW5nLnJvdXRlcl9ncm91cHMucmVhZCIsImNsb3VkX2NvbnRyb2xsZXIud3JpdGUiLCJkb3BwbGVyLmZpcmVob3NlIiwic2NpbS53cml0ZSJdLCJpYXQiOjE0Njc3Njk4MTYsImV4cCI6MTQ3MDM2MTgxNiwiY2lkIjoiY2YiLCJjbGllbnRfaWQiOiJjZiIsImlzcyI6Imh0dHBzOi8vdWFhLmV4YW1wbGUuY29tL29hdXRoL3Rva2VuIiwiemlkIjoidWFhIiwiZ3JhbnRfdHlwZSI6InBhc3N3b3JkIiwidXNlcl9uYW1lIjoiYWRtaW4iLCJvcmlnaW4iOiJ1YWEiLCJ1c2VyX2lkIjoiODhiY2VhYTUtYmRjZS00N2I4LTgyZjMtNGFmYzE0ZjI2NmY5IiwicmV2X3NpZyI6IjE0MGUwMjZiIiwiYXVkIjpbImNmIiwib3BlbmlkIiwic2NpbSIsImNsb3VkX2NvbnRyb2xsZXIiLCJ1YWEiLCJwYXNzd29yZCIsInJvdXRpbmcucm91dGVyX2dyb3VwcyIsImRvcHBsZXIiXX0.K5M_isGkEBAN_MaXqkVvJfHG86rGIUkDgsHaFnoKOA1x5FNC4APDvhImWJZ8zbFHhXT3PYHTyeSf_HQaFDFUHFvGZUhSSry2ID4kdU5kRyZ-y3ydkv2mq32BlUQBSC9ap0r5vFTv7BY1yf2EcDaKGe4v4ODMhTm2SIkdTyk2ZcLXHIucS0xgSZdjgxNqh3pnKtmcFkw72-CyREW4_2Nbvn_7U2UNUCb2SeAuWmYaNAOkuGveB8jAhg9ftTrxn5GNtNe1sdVycm51X1O0dGPt_rLbwkRDCdNpm0La_xzLqZEl60_YUqwo33eOChFgqXB5y_0Pzs9gD__uExrIXYIgMsltFELXryyRUDKTTHZEEw1bnLTbQfF-GAnS0E0CaTU_kcDVqDYcqfh0TCcr7nGCEozExMPm3J0OGUSP3FQAD5mDICsKKcSIi_kIjggkJ87tuNAY6QOW1WzBoRizXJVS4jb3QOnrii2LmH786qBYJMX0nH__JRYEU-HWLi_OGXVTo03Pe9QcB8qJvbu2DGRfQdBfjhvgt2AItY4voJnZcjwT29q144C5wvJ2_W8cUzNY-Xw_tN_fWK4LWCu6KRNLVLO2MNbl0aOfkvb1U5NZJUpUUC2jG3cZM2c8232YNFKVjdjbf-Mlx17OxOYQ5XtG5BiSEj7BA6s5hWftUXEUchg`
const mockUAAToken = `eyJhbGciOiJSUzI1NiIsImtpZCI6ImxlZ2FjeS10b2tlbi1rZXkiLCJ0eXAiOiJKV1QifQ.eyJqdGkiOiI2ZGIyYTI5NGYyYWE0OGNlYjI1NDgzMDk4ZDNjY2Q3YyIsInN1YiI6Ijg4YmNlYWE1LWJkY2UtNDdiOC04MmYzLTRhZmMxNGYyNjZmOSIsInNjb3BlIjpbIm9wZW5pZCIsInNjaW0ucmVhZCIsImNsb3VkX2NvbnRyb2xsZXIuYWRtaW4iLCJ1YWEudXNlciIsImNsb3VkX2NvbnRyb2xsZXIucmVhZCIsInBhc3N3b3JkLndyaXRlIiwicm91dGluZy5yb3V0ZXJfZ3JvdXBzLnJlYWQiLCJjbG91ZF9jb250cm9sbGVyLndyaXRlIiwiZG9wcGxlci5maXJlaG9zZSIsInNjaW0ud3JpdGUiXSwiY2xpZW50X2lkIjoiY2YiLCJjaWQiOiJjZiIsImF6cCI6ImNmIiwiZ3JhbnRfdHlwZSI6InBhc3N3b3JkIiwidXNlcl9pZCI6Ijg4YmNlYWE1LWJkY2UtNDdiOC04MmYzLTRhZmMxNGYyNjZmOSIsIm9yaWdpbiI6InVhYSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbiIsImF1dGhfdGltZSI6MTQ2Nzc2OTgxNiwicmV2X3NpZyI6IjE0MGUwMjZiIiwiaWF0IjoxNDY3NzY5ODE2LCJleHAiOjE0Njc3NzA0MTYsImlzcyI6Imh0dHBzOi8vdWFhLmV4YW1wbGUuY29tL29hdXRoL3Rva2VuIiwiemlkIjoidWFhIiwiYXVkIjpbImNmIiwib3BlbmlkIiwic2NpbSIsImNsb3VkX2NvbnRyb2xsZXIiLCJ1YWEiLCJwYXNzd29yZCIsInJvdXRpbmcucm91dGVyX2dyb3VwcyIsImRvcHBsZXIiXX0.q2u0JX42Qiwr0ZsBU5Y6bF74_0URWmmBYTLf8l7of_6huFoMkyqvirEYcbYbATt6Hz2zcN6xlXcInALxQ6nt6Jk01kZHRNYfuu6QziLHHw2o_dJWk9iipiermUze7BvSGtU_JXx45BSBNVFxvRxG9Yv54Lwa9FvyhMSmK3CI5S8NtVDchzrsH3sMsIjlTAb-L7sch-OOQ7ncWH1JoGMtw8sTbiaHvfNJQclSq8Ro11NUtRHiWeGFFxYIerzKO-TrSpDojFJrYVuK1m0YPmBDa_dY3cneRuppagRIn8oI0VFHF8BckrIqNCHvOMoVz6uzHebo9LK7H5z5SluxJ2vYUgPiHE_Tyo-7gELnNSy8qL4Bk9yTxNseeGiq13TSTGOtNnbrv1eq4ZeW7eafseLceKIZH2QZlXVzwd_aWbuKRv9ApDwy4AcSbpM0XtU89IjUEDoOf3IDWV2YZTZkEaXZ52Mhztb1O_IVpHyyks88P67RoANFt83MnCai9U3stCX45LEsg9oz2djrVnfHDzRNQVlg9hKJYbxsa2R5tpnftjhz-hfpsoPRxBkJDKM2islyd-gLqHtsERiZEoifu93VRE0Jvk6vaCNdStw7y4mq73Co6ykNUYA78SlT9lCwDJRQHTJiDWg33EeKpXne8joZbElwrKNcv93X1qxxvmp1wXQ bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImxlZ2FjeS10b2tlbi1rZXkiLCJ0eXAiOiJKV1QifQ.eyJqdGkiOiI2ZGIyYTI5NGYyYWE0OGNlYjI1NDgzMDk4ZDNjY2Q3Yy1yIiwic3ViIjoiODhiY2VhYTUtYmRjZS00N2I4LTgyZjMtNGFmYzE0ZjI2NmY5Iiwic2NvcGUiOlsib3BlbmlkIiwic2NpbS5yZWFkIiwiY2xvdWRfY29udHJvbGxlci5hZG1pbiIsInVhYS51c2VyIiwiY2xvdWRfY29udHJvbGxlci5yZWFkIiwicGFzc3dvcmQud3JpdGUiLCJyb3V0aW5nLnJvdXRlcl9ncm91cHMucmVhZCIsImNsb3VkX2NvbnRyb2xsZXIud3JpdGUiLCJkb3BwbGVyLmZpcmVob3NlIiwic2NpbS53cml0ZSJdLCJpYXQiOjE0Njc3Njk4MTYsImV4cCI6MTQ3MDM2MTgxNiwiY2lkIjoiY2YiLCJjbGllbnRfaWQiOiJjZiIsImlzcyI6Imh0dHBzOi8vdWFhLmV4YW1wbGUuY29tL29hdXRoL3Rva2VuIiwiemlkIjoidWFhIiwiZ3JhbnRfdHlwZSI6InBhc3N3b3JkIiwidXNlcl9uYW1lIjoiYWRtaW4iLCJvcmlnaW4iOiJ1YWEiLCJ1c2VyX2lkIjoiODhiY2VhYTUtYmRjZS00N2I4LTgyZjMtNGFmYzE0ZjI2NmY5IiwicmV2X3NpZyI6IjE0MGUwMjZiIiwiYXVkIjpbImNmIiwib3BlbmlkIiwic2NpbSIsImNsb3VkX2NvbnRyb2xsZXIiLCJ1YWEiLCJwYXNzd29yZCIsInJvdXRpbmcucm91dGVyX2dyb3VwcyIsImRvcHBsZXIiXX0.K5M_isGkEBAN_MaXqkVvJfHG86rGIUkDgsHaFnoKOA1x5FNC4APDvhImWJZ8zbFHhXT3PYHTyeSf_HQaFDFUHFvGZUhSSry2ID4kdU5kRyZ-y3ydkv2mq32BlUQBSC9ap0r5vFTv7BY1yf2EcDaKGe4v4ODMhTm2SIkdTyk2ZcLXHIucS0xgSZdjgxNqh3pnKtmcFkw72-CyREW4_2Nbvn_7U2UNUCb2SeAuWmYaNAOkuGveB8jAhg9ftTrxn5GNtNe1sdVycm51X1O0dGPt_rLbwkRDCdNpm0La_xzLqZEl60_YUqwo33eOChFgqXB5y_0Pzs9gD__uExrIXYIgMsltFELXryyRUDKTTHZEEw1bnLTbQfF-GAnS0E0CaTU_kcDVqDYcqfh0TCcr7nGCEozExMPm3J0OGUSP3FQAD5mDICsKKcSIi_kIjggkJ87tuNAY6QOW1WzBoRizXJVS4jb3QOnrii2LmH786qBYJMX0nH__JRYEU-HWLi_OGXVTo03Pe9QcB8qJvbu2DGRfQdBfjhvgt2AItY4voJnZcjwT29q144C5wvJ2_W8cUzNY-Xw_tN_fWK4LWCu6KRNLVLO2MNbl0aOfkvb1U5NZJUpUUC2jG3cZM2c8232YNFKVjdjbf-Mlx17OxOYQ5XtG5BiSEj7BA6s5hWftUXEUchg`
const mockCNSIToken = `eyJhbGciOiJSUzI1NiIsImtpZCI6ImxlZ2FjeS10b2tlbi1rZXkiLCJ0eXAiOiJKV1QifQ.eyJqdGkiOiI2ZGIyYTI5NGYyYWE0OGNlYjI1NDgzMDk4ZDNjY2Q3YyIsInN1YiI6Ijg4YmNlYWE1LWJkY2UtNDdiOC04MmYzLTRhZmMxNGYyNjZmOSIsInNjb3BlIjpbIm9wZW5pZCIsInNjaW0ucmVhZCIsImNsb3VkX2NvbnRyb2xsZXIuYWRtaW4iLCJ1YWEudXNlciIsImNsb3VkX2NvbnRyb2xsZXIucmVhZCIsInBhc3N3b3JkLndyaXRlIiwicm91dGluZy5yb3V0ZXJfZ3JvdXBzLnJlYWQiLCJjbG91ZF9jb250cm9sbGVyLndyaXRlIiwiZG9wcGxlci5maXJlaG9zZSIsInNjaW0ud3JpdGUiXSwiY2xpZW50X2lkIjoiY2YiLCJjaWQiOiJjZiIsImF6cCI6ImNmIiwiZ3JhbnRfdHlwZSI6InBhc3N3b3JkIiwidXNlcl9pZCI6Ijg4YmNlYWE1LWJkY2UtNDdiOC04MmYzLTRhZmMxNGYyNjZmOSIsIm9yaWdpbiI6InVhYSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbiIsImF1dGhfdGltZSI6MTQ2Nzc2OTgxNiwicmV2X3NpZyI6IjE0MGUwMjZiIiwiaWF0IjoxNDY3NzY5ODE2LCJleHAiOjE0Njc3NzA0MTYsImlzcyI6Imh0dHBzOi8vdWFhLmV4YW1wbGUuY29tL29hdXRoL3Rva2VuIiwiemlkIjoidWFhIiwiYXVkIjpbImNmIiwib3BlbmlkIiwic2NpbSIsImNsb3VkX2NvbnRyb2xsZXIiLCJ1YWEiLCJwYXNzd29yZCIsInJvdXRpbmcucm91dGVyX2dyb3VwcyIsImRvcHBsZXIiXX0.q2u0JX42Qiwr0ZsBU5Y6bF74_0URWmmBYTLf8l7of_6huFoMkyqvirEYcbYbATt6Hz2zcN6xlXcInALxQ6nt6Jk01kZHRNYfuu6QziLHHw2o_dJWk9iipiermUze7BvSGtU_JXx45BSBNVFxvRxG9Yv54Lwa9FvyhMSmK3CI5S8NtVDchzrsH3sMsIjlTAb-L7sch-OOQ7ncWH1JoGMtw8sTbiaHvfNJQclSq8Ro11NUtRHiWeGFFxYIerzKO-TrSpDojFJrYVuK1m0YPmBDa_dY3cneRuppagRIn8oI0VFHF8BckrIqNCHvOMoVz6uzHebo9LK7H5z5SluxJ2vYUgPiHE_Tyo-7gELnNSy8qL4Bk9yTxNseeGiq13TSTGOtNnbrv1eq4ZeW7eafseLceKIZH2QZlXVzwd_aWbuKRv9ApDwy4AcSbpM0XtU89IjUEDoOf3IDWV2YZTZkEaXZ52Mhztb1O_IVpHyyks88P67RoANFt83MnCai9U3stCX45LEsg9oz2djrVnfHDzRNQVlg9hKJYbxsa2R5tpnftjhz-hfpsoPRxBkJDKM2islyd-gLqHtsERiZEoifu93VRE0Jvk6vaCNdStw7y4mq73Co6ykNUYA78SlT9lCwDJRQHTJiDWg33EeKpXne8joZbElwrKNcv93X1qxxvmp1wXQ bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImxlZ2FjeS10b2tlbi1rZXkiLCJ0eXAiOiJKV1QifQ.eyJqdGkiOiI2ZGIyYTI5NGYyYWE0OGNlYjI1NDgzMDk4ZDNjY2Q3Yy1yIiwic3ViIjoiODhiY2VhYTUtYmRjZS00N2I4LTgyZjMtNGFmYzE0ZjI2NmY5Iiwic2NvcGUiOlsib3BlbmlkIiwic2NpbS5yZWFkIiwiY2xvdWRfY29udHJvbGxlci5hZG1pbiIsInVhYS51c2VyIiwiY2xvdWRfY29udHJvbGxlci5yZWFkIiwicGFzc3dvcmQud3JpdGUiLCJyb3V0aW5nLnJvdXRlcl9ncm91cHMucmVhZCIsImNsb3VkX2NvbnRyb2xsZXIud3JpdGUiLCJkb3BwbGVyLmZpcmVob3NlIiwic2NpbS53cml0ZSJdLCJpYXQiOjE0Njc3Njk4MTYsImV4cCI6MTQ3MDM2MTgxNiwiY2lkIjoiY2YiLCJjbGllbnRfaWQiOiJjZiIsImlzcyI6Imh0dHBzOi8vdWFhLmV4YW1wbGUuY29tL29hdXRoL3Rva2VuIiwiemlkIjoidWFhIiwiZ3JhbnRfdHlwZSI6InBhc3N3b3JkIiwidXNlcl9uYW1lIjoiYWRtaW4iLCJvcmlnaW4iOiJ1YWEiLCJ1c2VyX2lkIjoiODhiY2VhYTUtYmRjZS00N2I4LTgyZjMtNGFmYzE0ZjI2NmY5IiwicmV2X3NpZyI6IjE0MGUwMjZiIiwiYXVkIjpbImNmIiwib3BlbmlkIiwic2NpbSIsImNsb3VkX2NvbnRyb2xsZXIiLCJ1YWEiLCJwYXNzd29yZCIsInJvdXRpbmcucm91dGVyX2dyb3VwcyIsImRvcHBsZXIiXX0.K5M_isGkEBAN_MaXqkVvJfHG86rGIUkDgsHaFnoKOA1x5FNC4APDvhImWJZ8zbFHhXT3PYHTyeSf_HQaFDFUHFvGZUhSSry2ID4kdU5kRyZ-y3ydkv2mq32BlUQBSC9ap0r5vFTv7BY1yf2EcDaKGe4v4ODMhTm2SIkdTyk2ZcLXHIucS0xgSZdjgxNqh3pnKtmcFkw72-CyREW4_2Nbvn_7U2UNUCb2SeAuWmYaNAOkuGveB8jAhg9ftTrxn5GNtNe1sdVycm51X1O0dGPt_rLbwkRDCdNpm0La_xzLqZEl60_YUqwo33eOChFgqXB5y_0Pzs9gD__uExrIXYIgMsltFELXryyRUDKTTHZEEw1bnLTbQfF-GAnS0E0CaTU_kcDVqDYcqfh0TCcr7nGCEozExMPm3J0OGUSP3FQAD5mDICsKKcSIi_kIjggkJ87tuNAY6QOW1WzBoRizXJVS4jb3QOnrii2LmH786qBYJMX0nH__JRYEU-HWLi_OGXVTo03Pe9QcB8qJvbu2DGRfQdBfjhvgt2AItY4voJnZcjwT29q144C5wvJ2_W8cUzNY-Xw_tN_fWK4LWCu6KRNLVLO2MNbl0aOfkvb1U5NZJUpUUC2jG3cZM2c8232YNFKVjdjbf-Mlx17OxOYQ5XtG5BiSEj7BA6s5hWftUXEUchg`

var mockTokenExpiry = time.Now().AddDate(0, 0, 1).Unix()

var mockUAAResponse = UAAResponse{
	AccessToken:  mockUAAToken,
	RefreshToken: mockUAAToken,
}

const (
	mockAPIEndpoint     = "https://api.127.0.0.1"
	mockAuthEndpoint    = "https://login.127.0.0.1"
	mockTokenEndpoint   = "https://uaa.127.0.0.1"
	mockDopplerEndpoint = "https://doppler.127.0.0.1"

	stringHCFType = "hcf"
	stringHCEType = "hce"

	selectAnyFromTokens = `SELECT .+ FROM tokens WHERE .+`
	insertIntoTokens    = `INSERT INTO tokens`
	updateTokens        = `UPDATE tokens`
	selectAnyFromCNSIs  = `SELECT (.+) FROM cnsis WHERE (.+)`
	insertIntoCNSIs     = `INSERT INTO cnsis`
)

var rowFieldsForToken = []string{"auth_token", "refresh_token", "token_expiry"}
var rowFieldsForCNSI = []string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint", "doppler_logging_endpoint"}

var mockEncryptionKey = make([]byte, 32)
var mockEncryptedToken, _ = tokens.EncryptToken(mockEncryptionKey, mockUAAToken)

var mockV2InfoResponse = v2Info{
	AuthorizationEndpoint: mockAuthEndpoint,
	TokenEndpoint:         mockTokenEndpoint,
}

var mockInfoResponse = v2Info{
	AuthorizationEndpoint: mockAuthEndpoint,
	TokenEndpoint:         mockTokenEndpoint,
}

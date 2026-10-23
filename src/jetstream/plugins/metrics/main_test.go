package metrics

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/labstack/echo/v5"
	. "github.com/smartystreets/goconvey/convey"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// httpClientProxy satisfies api.PortalProxy for Connect and Info by
// embedding the interface; only GetHttpClient is implemented.
type httpClientProxy struct {
	api.PortalProxy
}

func (p *httpClientProxy) GetHttpClient(_ bool, _ string) http.Client {
	return *http.DefaultClient
}

// unreachableURL returns the URL of a server that has already stopped, so
// a request to it fails without a response.
func unreachableURL(t *testing.T) *url.URL {
	t.Helper()
	server := httptest.NewServer(http.NotFoundHandler())
	server.Close()
	u, err := url.Parse(server.URL)
	require.NoError(t, err)
	return u
}

func newConnectContext() *echo.Context {
	form := url.Values{"connect_type": {api.AuthConnectTypeNone}}
	req := httptest.NewRequest(http.MethodPost, "/pp/v1/auth/login/cnsi", strings.NewReader(form.Encode()))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationForm)
	return echo.New().NewContext(req, httptest.NewRecorder())
}

func TestConnectReportsAnUnreachableEndpoint(t *testing.T) {
	t.Parallel()

	m := &MetricsSpecification{portalProxy: &httpClientProxy{}}
	cnsi := api.CNSIRecord{APIEndpoint: unreachableURL(t)}

	var err error
	require.NotPanics(t, func() {
		_, _, err = m.Connect(newConnectContext(), cnsi, "user-1")
	})
	require.Error(t, err)
	var shadow api.ErrHTTPShadow
	require.True(t, errors.As(err, &shadow), "got %T: %v", err, err)
	assert.Equal(t, "Could not connect to the endpoint", shadow.UserFacingError)
}

func TestUrlComparision(t *testing.T) {
	t.Parallel()

	Convey("URL Comparision", t, func() {

		So(compareURL("https://test.com", "https://test.com"), ShouldBeTrue)
		So(compareURL("http://test.com", "http://test.com"), ShouldBeTrue)
		So(compareURL("http://test3.com", "http://test.com"), ShouldBeFalse)
		So(compareURL("https://test.com", "https://test.com:443"), ShouldBeTrue)
		So(compareURL("http://test.com", "https://test.com:443"), ShouldBeFalse)
		So(compareURL("http://test.com", "http://test.com:80"), ShouldBeTrue)
		So(compareURL("http://test.com:80", "http://test.com:80"), ShouldBeTrue)
		So(compareURL("http://test.com:80", "http://test.com"), ShouldBeTrue)
		So(compareURL("http://test.com", "http://test2.com"), ShouldBeFalse)
		So(compareURL("http://test.com/a", "http://test.com/a"), ShouldBeTrue)
		So(compareURL("http://test.com/a?one=two", "http://test.com/a?two=one"), ShouldBeTrue)

		// Should ignore trailing slashes
		So(compareURL("http://test.com/", "http://test.com"), ShouldBeTrue)

	})

}

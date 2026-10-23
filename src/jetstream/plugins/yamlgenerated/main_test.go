package yamlgenerated

import (
	"errors"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/labstack/echo/v5"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// proxyAnswering is a PortalProxy that records the token requests it is
// asked to make and gives a set result. Any other method panics.
type proxyAnswering struct {
	api.PortalProxy
	response *api.CNSIRequest
	asked    *[]tokenRequest
}

type tokenRequest struct {
	cnsiGUID, method, url string
	token                 api.TokenRecord
}

func (p proxyAnswering) DoProxySingleRequestWithToken(cnsiGUID string, token *api.TokenRecord, method, requestURL string, _ http.Header, _ []byte) (*api.CNSIRequest, error) {
	*p.asked = append(*p.asked, tokenRequest{cnsiGUID: cnsiGUID, method: method, url: requestURL, token: *token})
	return p.response, nil
}

// gitPlugin is the git endpoint type as plugins.yaml declares it.
func gitPlugin(proxy api.PortalProxy) GeneratedEndpointPlugin {
	return GeneratedEndpointPlugin{
		portalProxy:  proxy,
		endpointType: "git",
		subTypes: map[string]pluginConfig{
			"github": {Name: "git", SubType: "github", AuthType: "Token", UserInfoAPI: "/user", UserInfoPath: "login"},
			"gitlab": {Name: "git", SubType: "gitlab", AuthType: "Bearer", UserInfoAPI: "/user", UserInfoPath: "username"},
		},
	}
}

var connectTypes = map[string]string{"github": api.AuthConnectTypeToken, "gitlab": api.AuthConnectTypeBearer}

func connectContext(subType string) *echo.Context {
	form := url.Values{"connect_type": {connectTypes[subType]}, "token": {"the-token"}}
	req := httptest.NewRequest(http.MethodPost, "/api/v1/tokens", strings.NewReader(form.Encode()))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationForm)
	return echo.New().NewContext(req, httptest.NewRecorder())
}

// connectWith runs Connect and then, if it succeeded, Validate, as the
// connect handler (DoLoginToCNSI) does.
func connectWith(t *testing.T, subType string, response *api.CNSIRequest) (*api.TokenRecord, []tokenRequest, error) {
	t.Helper()
	var asked []tokenRequest
	plugin := gitPlugin(proxyAnswering{response: response, asked: &asked})
	cnsi := api.CNSIRecord{GUID: "git-endpoint", SubType: subType}
	token, _, err := plugin.Connect(connectContext(subType), cnsi, "user")
	if err == nil {
		err = plugin.Validate("user", cnsi, *token)
	}
	return token, asked, err
}

func TestConnectChecksTheTokenOnceAndKeepsTheUsername(t *testing.T) {
	for subType, body := range map[string]string{"github": `{"login":"jo"}`, "gitlab": `{"username":"jo"}`} {
		t.Run(subType, func(t *testing.T) {
			token, asked, err := connectWith(t, subType, &api.CNSIRequest{StatusCode: http.StatusOK, Response: []byte(body)})
			if err != nil {
				t.Fatalf("expected a token the API accepts to connect, got %v", err)
			}
			if len(asked) != 1 {
				t.Fatalf("expected one user info request, got %d: %+v", len(asked), asked)
			}
			if asked[0].cnsiGUID != "git-endpoint" || asked[0].method != "GET" || asked[0].url != "/user" {
				t.Errorf("asked %+v, want GET /user on git-endpoint", asked[0])
			}
			if asked[0].token.AuthToken != "dGhlLXRva2Vu" { // base64 of the-token
				t.Errorf("expected the request to use the new token, got %+v", asked[0].token)
			}
			if token.RefreshToken != "jo" {
				t.Errorf("username = %q, want %q", token.RefreshToken, "jo")
			}
		})
	}
}

func TestConnectRejectsATokenTheAPIRefuses(t *testing.T) {
	body := `{"message":"Bad credentials","documentation_url":"https://docs.github.com/rest"}`
	_, _, err := connectWith(t, "github", &api.CNSIRequest{StatusCode: http.StatusUnauthorized, Status: "401 Unauthorized", Response: []byte(body)})

	var answered api.ErrHTTPRequest
	if !errors.As(err, &answered) {
		t.Fatalf("expected the error to carry the API's answer, got %T: %v", err, err)
	}
	if answered.Status != http.StatusUnauthorized || answered.Response != body {
		t.Errorf("got status %d body %q, want 401 and the API's body", answered.Status, answered.Response)
	}
}

func TestConnectReportsAnUnreachableAPI(t *testing.T) {
	server := httptest.NewServer(http.NotFoundHandler())
	address := server.URL
	server.Close()
	_, requestErr := http.Get(address)
	if requestErr == nil {
		t.Fatal("expected a request to a closed server to fail")
	}

	_, _, err := connectWith(t, "gitlab", &api.CNSIRequest{StatusCode: http.StatusInternalServerError,
		Status: "Error proxying request", Response: []byte(requestErr.Error()), Error: requestErr})

	var netErr net.Error
	if !errors.As(err, &netErr) {
		t.Errorf("expected the error to wrap the request failure, got %T: %v", err, err)
	}
}

func TestConnectKeepsTheDefaultNameWhenTheAnswerHasNone(t *testing.T) {
	token, _, err := connectWith(t, "github", &api.CNSIRequest{StatusCode: http.StatusOK, Response: []byte(`{"id":1}`)})
	if err != nil {
		t.Fatalf("expected an accepted token to connect, got %v", err)
	}
	if token.RefreshToken != defaultTokenUsername {
		t.Errorf("username = %q, want %q", token.RefreshToken, defaultTokenUsername)
	}
}

func TestConnectAcceptsASubTypeWithNoUserAPI(t *testing.T) {
	var asked []tokenRequest
	plugin := GeneratedEndpointPlugin{
		portalProxy:  proxyAnswering{asked: &asked},
		endpointType: "git",
		subTypes:     map[string]pluginConfig{"github": {AuthType: "Token"}},
	}
	cnsi := api.CNSIRecord{SubType: "github"}
	token, _, err := plugin.Connect(connectContext("github"), cnsi, "user")
	if err == nil {
		err = plugin.Validate("user", cnsi, *token)
	}
	if err != nil || len(asked) != 0 || token.RefreshToken != defaultTokenUsername {
		t.Errorf("got err %v, %d requests, name %q; want no check and %q", err, len(asked), token.RefreshToken, defaultTokenUsername)
	}
}

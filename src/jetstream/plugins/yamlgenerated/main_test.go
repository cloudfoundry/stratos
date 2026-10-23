package yamlgenerated

import (
	"errors"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// proxyAnswering is a PortalProxy that records the token request it is
// asked to make and gives a set result. Any other method panics.
type proxyAnswering struct {
	api.PortalProxy
	response *api.CNSIRequest
	asked    *tokenRequest
}

type tokenRequest struct {
	cnsiGUID, method, url string
	token                 *api.TokenRecord
}

func (p proxyAnswering) DoProxySingleRequestWithToken(cnsiGUID string, token *api.TokenRecord, method, requestURL string, _ http.Header, _ []byte) (*api.CNSIRequest, error) {
	*p.asked = tokenRequest{cnsiGUID: cnsiGUID, method: method, url: requestURL, token: token}
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

func validateWith(t *testing.T, subType string, response *api.CNSIRequest) (tokenRequest, error) {
	t.Helper()
	asked := tokenRequest{}
	token := api.TokenRecord{AuthType: api.AuthTypeToken, AuthToken: "dG9rZW4="}
	err := gitPlugin(proxyAnswering{response: response, asked: &asked}).
		Validate("user", api.CNSIRecord{GUID: "git-endpoint", SubType: subType}, token)
	return asked, err
}

func TestValidateChecksTheTokenWithTheUserAPI(t *testing.T) {
	for _, subType := range []string{"github", "gitlab"} {
		t.Run(subType, func(t *testing.T) {
			asked, err := validateWith(t, subType, &api.CNSIRequest{StatusCode: http.StatusOK, Response: []byte(`{"login":"jo"}`)})
			if err != nil {
				t.Errorf("expected a token the API accepts to pass, got %v", err)
			}
			if asked.cnsiGUID != "git-endpoint" || asked.method != "GET" || asked.url != "/user" {
				t.Errorf("asked %+v, want GET /user on git-endpoint", asked)
			}
			if asked.token == nil || asked.token.AuthToken != "dG9rZW4=" {
				t.Errorf("expected the request to use the new token, got %+v", asked.token)
			}
		})
	}
}

func TestValidateRejectsATokenTheAPIRefuses(t *testing.T) {
	body := `{"message":"Bad credentials","documentation_url":"https://docs.github.com/rest"}`
	_, err := validateWith(t, "github", &api.CNSIRequest{StatusCode: http.StatusUnauthorized, Status: "401 Unauthorized", Response: []byte(body)})

	var answered api.ErrHTTPRequest
	if !errors.As(err, &answered) {
		t.Fatalf("expected the error to carry the API's answer, got %T: %v", err, err)
	}
	if answered.Status != http.StatusUnauthorized || answered.Response != body {
		t.Errorf("got status %d body %q, want 401 and the API's body", answered.Status, answered.Response)
	}
}

func TestValidateReportsAnUnreachableAPI(t *testing.T) {
	server := httptest.NewServer(http.NotFoundHandler())
	address := server.URL
	server.Close()
	_, requestErr := http.Get(address)
	if requestErr == nil {
		t.Fatal("expected a request to a closed server to fail")
	}

	_, err := validateWith(t, "gitlab", &api.CNSIRequest{StatusCode: http.StatusInternalServerError,
		Status: "Error proxing request", Response: []byte(requestErr.Error()), Error: requestErr})

	var netErr net.Error
	if !errors.As(err, &netErr) {
		t.Errorf("expected the error to wrap the request failure, got %T: %v", err, err)
	}
}

func TestValidateAcceptsASubTypeWithNoUserAPI(t *testing.T) {
	plugin := GeneratedEndpointPlugin{endpointType: "git", subTypes: map[string]pluginConfig{"other": {AuthType: "Token"}}}
	if err := plugin.Validate("user", api.CNSIRecord{SubType: "other"}, api.TokenRecord{}); err != nil {
		t.Errorf("expected no check without a user info API, got %v", err)
	}
}

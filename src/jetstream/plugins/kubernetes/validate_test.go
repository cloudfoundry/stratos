package kubernetes

import (
	"errors"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// proxyAnswering is a PortalProxy whose DoProxySingleRequest gives a set
// result. Any other method panics: Validate must not need them.
type proxyAnswering struct {
	api.PortalProxy
	response *api.CNSIRequest
}

func (p proxyAnswering) DoProxySingleRequest(string, string, string, string, http.Header, []byte) (*api.CNSIRequest, error) {
	return p.response, nil
}

func validateWith(response *api.CNSIRequest) error {
	kube := &KubernetesSpecification{portalProxy: proxyAnswering{response: response}}
	return kube.Validate("user", api.CNSIRecord{GUID: "kube"}, api.TokenRecord{})
}

func TestValidateKeepsTheStatusTheClusterAnswered(t *testing.T) {
	body := `{"kind":"Status","message":"pods is forbidden: User \"jo\" cannot list resource \"pods\""}`
	err := validateWith(&api.CNSIRequest{StatusCode: http.StatusForbidden, Status: "403 Forbidden", Response: []byte(body)})

	var answered api.ErrHTTPRequest
	if !errors.As(err, &answered) {
		t.Fatalf("expected the error to carry the cluster's answer, got %T: %v", err, err)
	}
	if answered.Status != http.StatusForbidden || answered.Response != body {
		t.Errorf("got status %d body %q, want 403 and the cluster's body", answered.Status, answered.Response)
	}
}

func TestValidateKeepsTheRequestFailure(t *testing.T) {
	server := httptest.NewServer(http.NotFoundHandler())
	address := server.URL
	server.Close()
	_, requestErr := http.Get(address)
	if requestErr == nil {
		t.Fatal("expected a request to a closed server to fail")
	}

	err := validateWith(&api.CNSIRequest{StatusCode: http.StatusInternalServerError, Status: "Error proxing request",
		Response: []byte(requestErr.Error()), Error: requestErr})

	var netErr net.Error
	if !errors.As(err, &netErr) {
		t.Errorf("expected the error to wrap the request failure, got %T: %v", err, err)
	}
	if err == nil || !strings.Contains(err.Error(), requestErr.Error()) {
		t.Errorf("expected the message to keep %q, got %v", requestErr, err)
	}
}

func TestValidateAcceptsAnAnswer(t *testing.T) {
	if err := validateWith(&api.CNSIRequest{StatusCode: http.StatusOK, Response: []byte(`{"items":[]}`)}); err != nil {
		t.Errorf("expected no error, got %v", err)
	}
}

package kubernetes

import (
	"fmt"
	"net/http"
	"sync"

	// Import the OIDC auth plugin
	_ "k8s.io/client-go/plugin/pkg/client/auth/oidc"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// KubeProxyError is an endpoint's failure, in the per-endpoint error
// shape the passthrough proxy uses (jetstream passthrough.go), so the
// frontend reads it the same way:
//
//	{"error": {"statusCode": 500, "status": "..."}, "errorResponse": "..."}
type KubeProxyError struct {
	Error         KubeProxyErrorStatus `json:"error"`
	ErrorResponse string               `json:"errorResponse"`
}

// KubeProxyErrorStatus is the status part of a KubeProxyError
type KubeProxyErrorStatus struct {
	StatusCode int    `json:"statusCode"`
	Status     string `json:"status"`
}

// failedKubeProxyResponse reports that an endpoint's request failed:
// status says what failed, err why.
func failedKubeProxyResponse(endpointGUID, status string, err error) KubeProxyResponse {
	return KubeProxyResponse{
		Endpoint: endpointGUID,
		Error: &KubeProxyError{
			Error:         KubeProxyErrorStatus{StatusCode: http.StatusInternalServerError, Status: status},
			ErrorResponse: err.Error(),
		},
	}
}

// KubeProxyFunc represents a function to proxy to the Kube API
type KubeProxyFunc func(*api.ConnectedEndpoint, chan KubeProxyResponse)

// KubeProxyResponse represents a response from a proxy request to the Kube API
type KubeProxyResponse struct {
	Endpoint string
	Result   interface{}
	Error    *KubeProxyError
}

// KubeProxyResponses represents response from multiple proxy requests to the Kube API
type KubeProxyResponses map[string]interface{}

// ProxyKubernetesAPI proxies an API request to all of the user's connected Kubernetes endpoints
func (c *KubernetesSpecification) ProxyKubernetesAPI(userID string, f KubeProxyFunc) (KubeProxyResponses, error) {

	var p = c.portalProxy
	k8sList := make([]*api.ConnectedEndpoint, 0)
	eps, err := p.ListEndpointsByUser(userID)
	if err != nil {
		return nil, fmt.Errorf("Could not get endpints Client for endpoint: %v+", err)
	}

	// Get all connected k8s endpoints for the user
	for _, endpoint := range eps {
		if endpoint.CNSIType == "k8s" {
			k8sList = append(k8sList, endpoint)
		}
	}

	mapMutex := sync.RWMutex{}

	// Check that we actually have some
	// TODO
	done := make(chan KubeProxyResponse)
	for _, endpoint := range k8sList {
		go f(endpoint, done)
	}

	responses := make(KubeProxyResponses)
	for range k8sList {
		res := <-done
		mapMutex.RLock()
		if res.Error == nil {
			responses[res.Endpoint] = res.Result
		} else {
			responses[res.Endpoint] = res.Error
		}
		mapMutex.RUnlock()
	}

	return responses, nil
}

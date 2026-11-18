package kubernetes

import (
	"encoding/json"
	"errors"
	"testing"
)

// A failed endpoint must reach the frontend in the per-endpoint error
// shape the passthrough proxy uses, with its reason, not as a null.
func TestFailedKubeProxyResponseUsesTheProxyErrorShape(t *testing.T) {
	res := failedKubeProxyResponse("kube-1", "Could not list the Helm releases", errors.New("Kubernetes cluster unreachable"))

	if res.Endpoint != "kube-1" || res.Result != nil || res.Error == nil {
		t.Fatalf("want an error response for kube-1, got %+v", res)
	}
	got, err := json.Marshal(KubeProxyResponses{res.Endpoint: res.Error})
	if err != nil {
		t.Fatal(err)
	}
	want := `{"kube-1":{"error":{"statusCode":500,"status":"Could not list the Helm releases"},"errorResponse":"Kubernetes cluster unreachable"}}`
	if string(got) != want {
		t.Fatalf("got  %s\nwant %s", got, want)
	}
}

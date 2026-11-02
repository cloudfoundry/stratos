package autoscaler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

// cfDomain is the domain an autoscaler or CF API URL sits on: the host
// without its first label, port and path ignored. It follows the
// autoscaler CLI plugin's getDomain (api/endpoint.go), which only accepts
// an autoscaler on the Cloud Foundry's own domain. A host with no dot has
// no domain ("").
func cfDomain(raw string) string {
	if raw == "" {
		return ""
	}
	if !strings.Contains(raw, "://") {
		raw = "https://" + raw
	}
	u, err := url.Parse(raw)
	if err != nil {
		return ""
	}
	parts := strings.SplitN(u.Hostname(), ".", 2)
	if len(parts) < 2 {
		return ""
	}
	return parts[1]
}

// sameDomain reports whether two URLs share a domain. A URL without one
// matches nothing, so a CF user's token never goes to such a host.
func sameDomain(a, b string) bool {
	d := cfDomain(a)
	return d != "" && d == cfDomain(b)
}

// checkAutoscaler checks a URL the way the autoscaler CLI does: GET /health
// must return 200. GET /v1/info (15.3.1 and later) adds the build; older
// autoscalers lack it, which is not an error.
func checkAutoscaler(client http.Client, baseURL string) (string, error) {
	base := strings.TrimRight(baseURL, "/")

	res, err := client.Get(base + "/health")
	if err != nil {
		return "", fmt.Errorf("could not reach %s: %w", base, err)
	}
	_, _ = io.Copy(io.Discard, res.Body)
	_ = res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("%s/health returned %d", base, res.StatusCode)
	}

	res, err = client.Get(base + "/v1/info")
	if err != nil {
		return "", nil
	}
	defer func() { _ = res.Body.Close() }()
	if res.StatusCode != http.StatusOK {
		return "", nil
	}
	var info struct {
		Build string `json:"build"`
	}
	if err := json.NewDecoder(res.Body).Decode(&info); err != nil {
		return "", nil
	}
	return info.Build, nil
}

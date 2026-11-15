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
// an autoscaler on the Cloud Foundry's own domain. Host names compare in lower case. A host with
// no dot has no domain ("").
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
	parts := strings.SplitN(strings.ToLower(u.Hostname()), ".", 2)
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

// checkAutoscaler checks that a URL is an autoscaler: GET /health must
// return 200, as the autoscaler CLI checks, and the answer must come from
// an autoscaler: /health's {"alive": …} or a /v1/info with a name or build.
// A status check alone passes any web app that answers every path with
// 200 and its HTML page, the console included. GET /v1/info (15.3.1 and
// later) adds the build; older autoscalers lack it, which is not an error.
func checkAutoscaler(client http.Client, baseURL string) (string, error) {
	base := strings.TrimRight(baseURL, "/")

	res, err := client.Get(base + "/health")
	if err != nil {
		return "", fmt.Errorf("could not reach %s: %w", base, err)
	}
	var health struct {
		Alive *json.RawMessage `json:"alive"`
	}
	healthErr := json.NewDecoder(io.LimitReader(res.Body, 64<<10)).Decode(&health)
	_ = res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("%s/health returned %d", base, res.StatusCode)
	}
	alive := healthErr == nil && health.Alive != nil

	var info struct {
		Name  string `json:"name"`
		Build string `json:"build"`
	}
	if res, err = client.Get(base + "/v1/info"); err == nil {
		if res.StatusCode == http.StatusOK {
			_ = json.NewDecoder(io.LimitReader(res.Body, 64<<10)).Decode(&info)
		}
		_ = res.Body.Close()
	}
	if !alive && info.Name == "" && info.Build == "" {
		return "", fmt.Errorf("%s/health did not answer as an autoscaler", base)
	}
	return info.Build, nil
}

// src/jetstream/plugins/cloudfoundry/native_uri_probe.go
package cloudfoundry

import (
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"github.com/labstack/echo/v5"
)

// Operator-triggered probe of an endpoint's composite URI-length ceiling
// (#5579). The limit cannot be derived from configuration — it is the min
// across every hop in the chain (edge proxy, gorouter, CC nginx, puma,
// plus whatever middleboxes the deployment inserts) — so the only reliable
// measurement is empirical. The probe works unauthenticated: a request
// that passes every hop's length check reaches CC and draws a CF-shaped
// 401; one that doesn't draws 414. No automatic probing anywhere — this
// runs only when an operator clicks the button on the diagnostics page.

const (
	// probeLoBytes is assumed-safe: every chain in the wild accepts 2KB.
	probeLoBytes = 2048
	// probeHiBytes caps the search; gorouter's own ceiling is ~1MB but
	// chunk sizing gains nothing above 128KB.
	probeHiBytes = 131072
	// probeGranularityBytes stops the bisection — finer resolution does
	// not change the recommended chunk meaningfully.
	probeGranularityBytes = 256
	// guidFilterBytesPerGuid: a 36-byte guid plus an encoded comma.
	guidFilterBytesPerGuid = 39
	// probeReserveBytes is held back from the probed limit for the path,
	// other query params, and safety margin when deriving the recommended
	// chunk width.
	probeReserveBytes = 1024
)

// StURILimitProbe is the probe result DTO for the diagnostics page.
type StURILimitProbe struct {
	// ProbedLimitBytes is the measured composite request-target ceiling.
	// When the chain accepted even probeHiBytes, this reports probeHiBytes
	// and CappedAtMax is true.
	ProbedLimitBytes int  `json:"probedLimitBytes"`
	CappedAtMax      bool `json:"cappedAtMax"`
	// ConfiguredChunk / ConfiguredBytes describe the active setting and
	// the request width it produces; EffectiveChunk differs from
	// ConfiguredChunk only in adaptive mode after a runtime 414 adapted it.
	ConfiguredChunk int  `json:"configuredChunk"`
	EffectiveChunk  int  `json:"effectiveChunk"`
	ConfiguredBytes int  `json:"configuredBytes"`
	Adaptive        bool `json:"adaptive"`
	// RecommendedChunk is the width that would use the probed ceiling
	// (minus reserve). Matches ConfiguredChunk when the setting already
	// fits; lower when the configured budget silently overshoots.
	RecommendedChunk int `json:"recommendedChunk"`
	Requests         int `json:"probeRequests"`
}

// probeURILimit bisects the endpoint's request-target ceiling between
// probeLoBytes and probeHiBytes. Returns the largest length that passed,
// whether the search was capped at probeHiBytes, and how many requests it
// took.
func probeURILimit(httpClient *http.Client, apiBase string, doProbe func(client *http.Client, base string, targetLen int) (bool, error)) (limit int, capped bool, requests int, err error) {
	lo, hi := probeLoBytes, probeHiBytes

	ok, err := doProbe(httpClient, apiBase, lo)
	requests++
	if err != nil {
		return 0, false, requests, err
	}
	if !ok {
		// Even the floor bounced — report the floor as "less than".
		return 0, false, requests, fmt.Errorf("endpoint rejected even a %d-byte request-target with 414", lo)
	}

	ok, err = doProbe(httpClient, apiBase, hi)
	requests++
	if err != nil {
		return 0, false, requests, err
	}
	if ok {
		return hi, true, requests, nil
	}

	for hi-lo > probeGranularityBytes {
		mid := (lo + hi) / 2
		ok, err = doProbe(httpClient, apiBase, mid)
		requests++
		if err != nil {
			return 0, false, requests, err
		}
		if ok {
			lo = mid
		} else {
			hi = mid
		}
	}
	return lo, false, requests, nil
}

// probeURITargetLen issues one unauthenticated GET whose request-target
// (path + query) is exactly targetLen bytes. Any HTTP answer other than
// 414 means every hop accepted the length (unauthenticated requests that
// reach CC draw 401); 414 means some hop rejected it.
func probeURITargetLen(client *http.Client, apiBase string, targetLen int) (bool, error) {
	base := strings.TrimSuffix(apiBase, "/")
	path := "/v3/organizations"
	prefix := path + "?guids="
	fill := targetLen - len(prefix)
	if fill < 1 {
		fill = 1
	}
	u := base + prefix + strings.Repeat("a", fill)
	resp, err := client.Get(u)
	if err != nil {
		return false, err
	}
	defer func() { _ = resp.Body.Close() }()
	return resp.StatusCode != http.StatusRequestURITooLong, nil
}

// probeEndpointURILimit handles GET /pp/v1/cf/diag/urilimit/:cnsiGuid —
// the diagnostics-page button. Reports probed vs configured and the
// recommended STRATOS_CF_GUID_CHUNK for this endpoint's chain.
func (c *CloudFoundrySpecification) probeEndpointURILimit(ctx *echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	record, err := c.nativeProxy().GetCNSIRecord(cnsiGUID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "endpoint not found")
	}

	httpClient := c.nativeProxy().GetHttpClient(record.SkipSSLValidation, record.CACert)
	limit, capped, requests, perr := probeURILimit(&httpClient, record.APIEndpoint.String(), probeURITargetLen)
	if perr != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "probe failed: "+perr.Error())
	}

	configured := guidChunkSize()
	effective := effectiveGuidChunkSize()
	recommended := (limit - probeReserveBytes) / guidFilterBytesPerGuid
	if recommended < 1 {
		recommended = 1
	}

	result := StURILimitProbe{
		ProbedLimitBytes: limit,
		CappedAtMax:      capped,
		ConfiguredChunk:  configured,
		EffectiveChunk:   effective,
		ConfiguredBytes:  configured * guidFilterBytesPerGuid,
		Adaptive:         guidChunkAdaptive(),
		RecommendedChunk: recommended,
		Requests:         requests,
	}
	slog.Info("URI-limit probe",
		"cnsi", cnsiGUID, "accepts_bytes", limit, "capped", capped, "requests", requests,
		"setting", guidChunkEnv, "configured", configured, "configured_bytes", result.ConfiguredBytes,
		"recommended", recommended)
	return ctx.JSON(http.StatusOK, result)
}

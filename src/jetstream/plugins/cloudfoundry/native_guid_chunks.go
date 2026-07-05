// src/jetstream/plugins/cloudfoundry/native_guid_chunks.go
package cloudfoundry

import (
	"os"
	"strconv"
	"strings"

	log "github.com/sirupsen/logrus"
)

// CF v3 list requests take guid-list filters (space_guids=, guids=,
// user_guids=, ...). Nothing in the API bounds how wide those lists may be,
// but the request line traverses a chain of proxies (deployment edge nginx,
// gorouter, CC nginx, puma) and the effective URI ceiling is the minimum
// across every hop — commonly 8KB, unmeasurable from config alone because
// middleboxes (VPNs, corporate proxies) also participate. A 500-guid filter
// is ~19.5KB encoded and the platform answers 414; the enrichment callers
// treat errors as lazy-non-fatal, so the UI silently loses counts (#5579).
//
// Fix: every unbounded guid-list call site runs through forEachGuidChunk,
// which splits the list into chunks sized well under every default limit
// observed in the wild. Precedent: the cf CLI hit the same bug
// (cloudfoundry/cli#2220) and batches at a fixed 200.

// guidChunkDefault is the chunk width used when STRATOS_CF_GUID_CHUNK is
// unset. 150 guids ≈ 5.7KB encoded (36-byte guid + %2C separator) — enough
// headroom under an 8KB chain for the path, remaining query params, and
// headers that share nginx's large_client_header_buffers.
const guidChunkDefault = 150

// guidChunkEnv is the operator knob. Accepts a positive integer (fixed
// chunk width) or "auto" (adaptive: on a runtime 414 the backend may
// re-probe the endpoint's composite limit and retry — see #5579 addendum 2).
const guidChunkEnv = "STRATOS_CF_GUID_CHUNK"

var guidChunkSetting = os.Getenv(guidChunkEnv)

// guidChunkAdaptive reports whether the operator opted into adaptive mode.
func guidChunkAdaptive() bool {
	return strings.EqualFold(strings.TrimSpace(guidChunkSetting), "auto")
}

// guidChunkSize returns the configured fixed chunk width. In adaptive mode
// (or when the knob is unset/invalid) this is the default; the adaptive
// path only departs from it after a runtime 414 triggers a re-probe.
func guidChunkSize() int {
	s := strings.TrimSpace(guidChunkSetting)
	if s == "" || guidChunkAdaptive() {
		return guidChunkDefault
	}
	if v, err := strconv.Atoi(s); err == nil && v > 0 {
		return v
	}
	log.Warnf("%s=%q is not a positive integer or \"auto\"; using default %d", guidChunkEnv, guidChunkSetting, guidChunkDefault)
	return guidChunkDefault
}

// chunkGuids splits guids into slices of at most guidChunkSize() elements.
// A nil/empty input yields no chunks.
func chunkGuids(guids []string) [][]string {
	size := guidChunkSize()
	if len(guids) == 0 {
		return nil
	}
	chunks := make([][]string, 0, (len(guids)+size-1)/size)
	for start := 0; start < len(guids); start += size {
		end := start + size
		if end > len(guids) {
			end = len(guids)
		}
		chunks = append(chunks, guids[start:end])
	}
	return chunks
}

// forEachGuidChunk runs fn once per chunk of guids and stops on the first
// error. fn accumulates into captured state (a counts map, a resource
// slice), so results merge naturally across chunks.
//
// A 414 from fn means the configured chunk width exceeds what this
// platform's proxy chain accepts *right now* — chains shrink unannounced
// (config reloads are hot; enterprise middleboxes appear). The WARN is
// unconditional so a stale-high setting is self-announcing instead of
// silently dropping counts again. filterKey only labels the log line.
func forEachGuidChunk(filterKey string, guids []string, fn func(chunk []string) error) error {
	for _, chunk := range chunkGuids(guids) {
		if err := fn(chunk); err != nil {
			warnOnURITooLarge(err, filterKey, len(chunk))
			return err
		}
	}
	return nil
}

// warnOnURITooLarge emits the operator-facing WARN when a guid-filter
// request bounced off the platform's URI-length ceiling.
func warnOnURITooLarge(err error, filterKey string, chunkLen int) {
	if upstreamStatusOf(err) != 414 {
		return
	}
	log.Warnf("guid-filter request (%s, %d guids) rejected with 414: configured %s (%d) exceeds what the platform chain accepts — re-run the endpoint probe on the diagnostics page and lower the setting",
		filterKey, chunkLen, guidChunkEnv, guidChunkSize())
}

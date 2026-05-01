// src/jetstream/plugins/cloudfoundry/restage_translator.go
//
// RestageJobTranslator drives the v3 restage state machine via the Stratos
// async-job contract. The handler creates a tracked job with a *RestageRef
// payload; on each frontend poll, Tracker.Refresh calls Fetch which advances
// the state machine by one stage.
//
// See native_apps_restage_v3.go for the state-machine primitives and the
// design rationale documented in
//   stratos/docs/2026-04-30-A8-restage-orchestration-design.md
package cloudfoundry

import (
	"context"
	"fmt"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
)

// RestageJobKind is the stable Kind string used for restage jobs in the
// tracker. The frontend uses this to route diagnostics; not load-bearing
// for state-machine routing (the translator is passed explicitly at
// Create).
const RestageJobKind = "cf.app.restage"

// RestageJobTranslator implements stratosjobs.JobTranslator for the v3
// restage state machine. Each Fetch builds a capi client for the
// (cnsi,user) pair stored in the ref and calls advanceRestage to advance
// the state machine by one stage.
//
// The translator stores the proxy provider as a closure rather than a
// reference to the CloudFoundrySpecification so tests can supply a fake
// proxy without constructing a full plugin instance.
type RestageJobTranslator struct {
	proxyProvider func() nativeCFProxy
}

// NewRestageJobTranslator constructs the translator wired to the plugin's
// portal proxy. The plugin's main.go registers this with the Stratos
// tracker at startup (see slice 9).
func NewRestageJobTranslator(cf *CloudFoundrySpecification) *RestageJobTranslator {
	return &RestageJobTranslator{proxyProvider: cf.nativeProxy}
}

// Kind returns the stable kind prefix for restage jobs.
func (t *RestageJobTranslator) Kind() string { return RestageJobKind }

// Fetch advances the restage state machine by one stage and translates
// the orchestrator's outcome onto the Stratos job tuple.
//
// Concurrency: the tracker calls Fetch without holding the per-job lock
// (Refresh RUnlocks before invoking the translator). With the in-memory
// tracker that's tolerable — frontend polls a single job sequentially —
// but slice 9's handler must guarantee one in-flight Refresh per job to
// avoid concurrent advanceRestage calls mutating the same *RestageRef.
//
// Result payload:
//   - COMPLETE: {appGuid, strategy, stages} so the frontend has the
//     final timeline + entity GUIDs without a second roundtrip.
//   - PROCESSING / FAILED: nil — failure context is in `errors`; for
//     in-flight progress the handler exposes ref.Stages via a dedicated
//     status endpoint (slice 9 decides the wire shape).
func (t *RestageJobTranslator) Fetch(ctx context.Context, ref interface{}) (
	stratosjobs.JobState,
	[]stratosjobs.StratosError,
	interface{},
	error,
) {
	rRef, ok := ref.(*RestageRef)
	if !ok {
		return "", nil, nil, fmt.Errorf("restage translator: unexpected ref type %T", ref)
	}

	proxy := t.proxyProvider()
	if proxy == nil {
		return "", nil, nil, fmt.Errorf("restage translator: native proxy unavailable")
	}

	client, err := newCapiClient(ctx, proxy, rRef.CNSIGuid, rRef.UserGuid)
	if err != nil {
		return "", nil, nil, fmt.Errorf("restage translator: build capi client: %w", err)
	}

	state, errs, advanceErr := advanceRestage(ctx, client, rRef, nil)
	if advanceErr != nil {
		return "", nil, nil, advanceErr
	}

	var result interface{}
	if state == stratosjobs.JobStateComplete {
		result = map[string]interface{}{
			"appGuid":  rRef.AppGuid,
			"strategy": string(rRef.Strategy),
			"stages":   rRef.Stages,
		}
	}
	return state, errs, result, nil
}

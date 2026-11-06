// src/jetstream/plugins/cloudfoundry/restage_translator.go
//
// RestageJobTranslator drives the v3 restage state machine via the Stratos
// async-job contract. The handler creates a tracked job with a *RestageRef
// payload; on each frontend poll, Tracker.Refresh calls Fetch which advances
// the state machine by one stage.
//
// See native_apps_restage_v3.go for the state-machine primitives and the
// design rationale documented in
//
//	stratos/docs/2026-04-30-A8-restage-orchestration-design.md
package cloudfoundry

import (
	"context"
	"fmt"
	"strings"
	"time"

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

// CurrentStage implements stratosjobs.StageEmittingTranslator. It maps the
// last RestageStageRecord in ref.Stages to a JobStage for the tracker's
// progress timeline.
//
// Of is always 0 ("unknown") because the total step count is strategy-
// dependent (downtime: 7, rolling: 6, canary: 6) and is only known after the
// ref.Strategy is resolved mid-flight. Using 0 avoids emitting a wrong total
// that the frontend might display as "step 1 of 7" when the app ends up on
// the rolling path. This is a known gap — see feedback_research_provisional.md.
//
// Returns (JobStage{}, false) for wrong ref type or empty stage history.
func (t *RestageJobTranslator) CurrentStage(ref interface{}) (stratosjobs.JobStage, bool) {
	rRef, ok := ref.(*RestageRef)
	if !ok || len(rRef.Stages) == 0 {
		return stratosjobs.JobStage{}, false
	}

	last := rRef.Stages[len(rRef.Stages)-1]

	var enteredAt time.Time
	if !last.StartedAt.IsZero() {
		enteredAt = last.StartedAt
	}

	return stratosjobs.JobStage{
		Code:      restageStageCode(last.Stage),
		Label:     restageStageLabel(last.Stage),
		Index:     restageStageIndex(last.Stage),
		Of:        0, // unknown — strategy determines total; see doc above
		EnteredAt: enteredAt,
	}, true
}

// restageStageCode returns the stable wire Code for a RestageStage.
// The Code is part of the wire contract — the frontend dedups by it
// and pattern-matches on it for label localization. Listed explicitly
// (not derived from the const value) so refactoring the internal const
// names cannot silently change the wire shape.
func restageStageCode(s RestageStage) string {
	switch s {
	case StageRestagePackageLookup:
		return "PACKAGE_LOOKUP"
	case StageRestageBuildCreate:
		return "BUILD_CREATE"
	case StageRestageBuildPoll:
		return "BUILD_POLL"
	case StageRestageSetDroplet:
		return "SET_DROPLET"
	case StageRestageStop:
		return "STOP"
	case StageRestageStart:
		return "START"
	case StageRestageInstancePoll:
		return "INSTANCE_POLL"
	case StageRestageDeploymentCreate:
		return "DEPLOYMENT_CREATE"
	case StageRestageDeploymentPoll:
		return "DEPLOYMENT_POLL"
	default:
		return strings.ToUpper(string(s))
	}
}

// restageStageIndex returns the canonical 1-based position of a stage
// within the restage path. Tied to stage identity rather than to the
// number of records appended so far, so retries that produce duplicate
// records (rare) do not advance the displayed step. Of is left 0 because
// the strategy-conditional total is not represented here.
func restageStageIndex(s RestageStage) int {
	switch s {
	case StageRestagePackageLookup:
		return 1
	case StageRestageBuildCreate:
		return 2
	case StageRestageBuildPoll:
		return 3
	case StageRestageSetDroplet:
		return 4
	case StageRestageStop:
		return 5
	case StageRestageStart:
		return 6
	case StageRestageInstancePoll:
		return 7
	case StageRestageDeploymentCreate:
		// Rolling/canary skip set_droplet/stop/start; this is step 4
		// in those paths.
		return 4
	case StageRestageDeploymentPoll:
		return 5
	default:
		return 0
	}
}

// restageStageLabel returns the human-readable label for a RestageStage.
// Labels are presentational only — they may change without breaking
// frontend logic that keys on Code.
func restageStageLabel(s RestageStage) string {
	switch s {
	case StageRestagePackageLookup:
		return "Resolving package"
	case StageRestageBuildCreate:
		return "Creating build"
	case StageRestageBuildPoll:
		return "Staging"
	case StageRestageSetDroplet:
		return "Setting droplet"
	case StageRestageStop:
		return "Stopping app"
	case StageRestageStart:
		return "Starting app"
	case StageRestageInstancePoll:
		return "Waiting for instances"
	case StageRestageDeploymentCreate:
		return "Creating deployment"
	case StageRestageDeploymentPoll:
		return "Deploying"
	default:
		return string(s)
	}
}

package stratosjobs

import (
	"context"
	"time"
)

// FastPathResult reports the outcome of RunFastPath. Exactly one of the
// terminal fields (Result / Errors) is populated when Resolved is true,
// matching the State. When Resolved is false the caller should return
// 202 + HandoffJob to the client and expect the frontend to poll.
type FastPathResult struct {
	Resolved   bool          // true if backend reached terminal within window
	State      JobState      // terminal state, valid when Resolved
	Result     interface{}   // backend result, valid when State == COMPLETE
	Errors     []StratosError // backend errors, valid when State == FAILED
	HandoffJob *StratosJob   // the tracked job to surface as 202 body when !Resolved
}

// FastPathOptions tunes the bounded poll loop. Zero values pick defaults
// suitable for write operations (3s window / 500ms interval); read-side
// consumers should pass shorter values.
type FastPathOptions struct {
	Kind         string        // job kind (e.g. "cf.app.delete"); stored in the tracked job
	Window       time.Duration // total time to poll before handoff. Default: 3s.
	PollInterval time.Duration // per-iteration sleep. Default: 500ms.
}

// RunFastPath wraps a backend ref with the hybrid fast-path / handoff
// behavior described in the async-job contract. It polls the translator
// for up to Options.Window; if a terminal state is reached, returns
// Resolved=true and the caller returns 200 with Result (or 4xx with
// Errors). If the window elapses first, a job is registered in the
// tracker and returned via HandoffJob — caller returns 202.
//
// The tracker is driven by Refresh on each frontend poll; RunFastPath
// does not schedule its own background refresh for handed-off jobs.
// This keeps lifetime simple: no goroutines survive the handler.
func RunFastPath(
	ctx context.Context,
	tracker Tracker,
	translator JobTranslator,
	ref interface{},
	opts FastPathOptions,
) FastPathResult {
	window := opts.Window
	if window == 0 {
		window = 3 * time.Second
	}
	interval := opts.PollInterval
	if interval == 0 {
		interval = 500 * time.Millisecond
	}
	deadline := time.Now().Add(window)

	for {
		state, errs, result, err := translator.Fetch(ctx, ref)
		if err == nil && state.IsTerminal() {
			return FastPathResult{
				Resolved: true,
				State:    state,
				Result:   result,
				Errors:   errs,
			}
		}

		remaining := time.Until(deadline)
		if remaining <= 0 {
			// Window exhausted — hand off via the tracker.
			id := tracker.Create(opts.Kind, translator, ref)
			job, _ := tracker.Get(id)
			return FastPathResult{Resolved: false, HandoffJob: job}
		}

		sleep := interval
		if sleep > remaining {
			sleep = remaining
		}
		select {
		case <-ctx.Done():
			// Client disconnected — still hand off so other observers can
			// poll. The job may resolve fine even though this request went
			// away.
			id := tracker.Create(opts.Kind, translator, ref)
			job, _ := tracker.Get(id)
			return FastPathResult{Resolved: false, HandoffJob: job}
		case <-time.After(sleep):
		}
	}
}

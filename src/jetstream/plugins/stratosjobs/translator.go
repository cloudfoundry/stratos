package stratosjobs

import "context"

// JobTranslator maps a backend-specific async primitive (CF v3 job,
// k8s reconciliation, BOSH task) onto the Stratos job state machine.
//
// Implementations are registered per backend. The Tracker stores the
// opaque `ref` supplied at Create() and hands it back to Fetch() whenever
// the state needs refreshing; translators own the ref's interpretation.
//
// Fetch's (error) return is for transport / IO failures only. Backend
// failures (e.g., CF responded 422) are modeled as State=FAILED with
// populated errors. Returning State=PROCESSING with err=nil is correct
// for "still running" — the tracker leaves the job alone until a later
// poll reveals a terminal state.
type JobTranslator interface {
	Fetch(ctx context.Context, ref interface{}) (
		state JobState,
		errors []StratosError,
		result interface{},
		err error,
	)

	// Kind is the prefix the translator produces for job kinds it owns
	// (e.g. "cf" for CFJobTranslator). Used for diagnostics / filtering;
	// not load-bearing for routing, since each consumer passes the
	// translator explicitly when creating a job.
	Kind() string
}

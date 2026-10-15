package stratosjobs

import (
	"context"
	"errors"
)

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
// poll reveals a terminal state. The one error the tracker acts on is
// ErrJobNotFound.
type JobTranslator interface {
	Fetch(ctx context.Context, ref interface{}) (
		state JobState,
		errors []StratosError,
		result interface{},
		err error,
	)

	// Kind is the prefix the translator produces for job kinds it owns
	// (e.g. "cf" for CFJobTranslator). Used for diagnostics / filtering,
	// and as the id prefix that routes an id to a JobIDCodec.
	Kind() string
}

// ErrJobNotFound is what Fetch returns (wrapped) when the backend reports
// that the job does not exist. The tracker drops the job and the poll
// answers 404, which the frontend reads as a terminal "status unknown".
var ErrJobNotFound = errors.New("job not found")

// JobIDCodec is an optional capability for a translator whose ref can be
// rebuilt from the job id alone. The tracker then mints the job id with
// EncodeID instead of a random one, so any Jetstream replica — another
// pod, or this one after a restart or redeploy — can resolve a poll for a
// job it never saw. Translators whose ref holds state that only exists in
// the process that created the job (a state machine Jetstream drives
// itself) must not implement it.
//
// An encoded id must start with the translator's Kind() and a ".", which
// is how the tracker routes an id to its codec, and must use only
// URL-unreserved characters so it travels as a single path segment.
//
// The id never carries the user. DecodeID receives the polling session's
// user and builds the ref for that user, returning ok=false when the id is
// malformed or the user cannot reach the backend the id names (no
// endpoint, no token), so an unresolvable id reads as an unknown job.
type JobIDCodec interface {
	EncodeID(kind string, ref interface{}) (id string, ok bool)
	DecodeID(id string, userGUID string) (kind string, ref interface{}, ok bool)
}

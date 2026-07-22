// Package stratosjobs provides the Stratos-native async-job contract.
//
// Many backing systems (CF v3, future k8s operators, BOSH tasks) complete
// state-changing operations asynchronously. Stratos consumers see a single
// normalized job resource regardless of which backend produced it; this
// package owns that resource's shape, tracker, translator registry, and
// polling endpoint.
//
// Design doc: KS stratos/docs/2026-04-22-async-job-contract.md
package stratosjobs

import "time"

// JobState is the normalized Stratos lifecycle for an async operation.
type JobState string

const (
	// JobStateProcessing — backend is still working. Non-terminal.
	JobStateProcessing JobState = "PROCESSING"
	// JobStateComplete — backend finished successfully. Terminal.
	JobStateComplete JobState = "COMPLETE"
	// JobStateFailed — backend reported failure. Terminal.
	JobStateFailed JobState = "FAILED"
)

// IsTerminal reports whether the state is sticky (COMPLETE or FAILED).
func (s JobState) IsTerminal() bool {
	return s == JobStateComplete || s == JobStateFailed
}

// StratosError is the normalized error shape for failed jobs. `Detail`
// passes through the underlying backend's raw error when useful.
type StratosError struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Detail  interface{} `json:"detail,omitempty"`
}

// JobStage is one transition in an operation's progress timeline.
// Translators emit stages via Tracker.AppendStage; the tracker dedups
// by Code and appends. Frontend renders done/current/pending from
// the resulting Stages slice.
type JobStage struct {
	Code      string    `json:"code"`  // e.g. "STAGING", "STARTING"
	Label     string    `json:"label"` // human-readable
	Index     int       `json:"index"` // 1-based step; 0 if unknown
	Of        int       `json:"of"`    // total steps; 0 if unknown
	EnteredAt time.Time `json:"enteredAt"`
}

// StratosJob is the wire shape returned from GET /pp/v1/stratos/jobs/{id}
// and also the 202 handoff body. `Result` carries the final backend payload
// only when State == COMPLETE. `Errors` is populated only when State == FAILED.
// `Stages` accumulates the progress timeline via Tracker.AppendStage; omitted
// from the wire when empty so old clients are unaffected.
type StratosJob struct {
	ID        string         `json:"id"`
	Kind      string         `json:"kind"`
	State     JobState       `json:"state"`
	StartedAt time.Time      `json:"startedAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	Errors    []StratosError `json:"errors,omitempty"`
	Result    interface{}    `json:"result,omitempty"`
	Stages    []JobStage     `json:"stages,omitempty"`
}

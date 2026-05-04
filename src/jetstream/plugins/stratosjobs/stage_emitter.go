package stratosjobs

// StageEmittingTranslator is an optional capability interface that a
// JobTranslator may implement to push progress stages into the tracker
// without receiving a handle to the tracker itself. The tracker's Refresh
// method type-asserts tj.translator to this interface after each successful
// Fetch call; if the assertion succeeds it queries the current stage and
// appends it via the internal deduplicated helper.
//
// Using a capability interface keeps the translator dependency-free: plain
// translators that have no concept of stages continue to compile and work
// without change. Only translators with richer state machines (restage,
// rolling-deploy) need to implement this interface.
type StageEmittingTranslator interface {
	// CurrentStage maps the opaque ref stored in the tracker back to a
	// JobStage for the most recently active stage. The ref value is the
	// same pointer the caller supplied to Tracker.Create.
	//
	// Returns (stage, true) when a meaningful stage can be derived from the
	// current ref state. Returns (JobStage{}, false) when the ref is the
	// wrong type, the ref's stage history is empty, or the stage cannot be
	// meaningfully mapped.
	CurrentStage(ref interface{}) (stage JobStage, has bool)
}

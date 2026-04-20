package diagnostics

// Counter is an aggregated count for a diagnostic code at a given dimension
// bucket. FirstAt / LastAt bracket the observation window.
type Counter struct {
	Code       string            `json:"code"`
	Dimensions map[string]string `json:"dimensions"`
	Count      int64             `json:"count"`
	FirstAt    int64             `json:"firstAt"`
	LastAt     int64             `json:"lastAt"`
}

// Sample is a single point-in-time observation for a diagnostic code. Value
// is a pointer so "counted but unvalued" events can be distinguished from
// zero-valued ones.
type Sample struct {
	Code       string            `json:"code"`
	At         int64             `json:"at"`
	Dimensions map[string]string `json:"dimensions"`
	Value      *float64          `json:"value,omitempty"`
}

// SnapshotEnvelope is the versioned JSON wire shape returned from the diagnostics
// HTTP endpoint. Mirrors the frontend's DiagnosticsSnapshotEnvelope so a single
// consumer can read both surfaces uniformly.
type SnapshotEnvelope struct {
	Version    int                  `json:"version"`
	CapturedAt int64                `json:"capturedAt"`
	Counters   map[string][]Counter `json:"counters"`
	Samples    map[string][]Sample  `json:"samples"`
}

// BufferConfig controls ring-buffer caps. PerFamilyCap is the max samples kept
// per code family; TotalCap is a global upper bound (not yet enforced — the
// per-family cap is sufficient for current traffic).
type BufferConfig struct {
	PerFamilyCap int
	TotalCap     int
}

func DefaultBufferConfig() BufferConfig {
	return BufferConfig{PerFamilyCap: 10000, TotalCap: 100000}
}

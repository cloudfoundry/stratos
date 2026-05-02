package stratosjobs

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"
)

// Tracker owns the lifecycle of tracked jobs. The interface keeps the
// implementation pluggable: in-memory for CF-deployed Stratos (which already
// requires session affinity), and — later — DB-backed for pure-k8s deploys
// where a frontend poll may land on a different replica than the creator.
//
// Methods are safe for concurrent use.
type Tracker interface {
	// Create registers a new tracked job with a Translator-owned reference.
	// Returns the generated Stratos job id. Initial state is PROCESSING.
	Create(kind string, translator JobTranslator, ref interface{}) string

	// Get returns the job by id. Returns (nil, false) if unknown / evicted.
	Get(id string) (*StratosJob, bool)

	// Refresh asks the translator for the current underlying state and
	// updates the tracked job. Called by the poll handler on each GET, so
	// frontends see progress without the translator being driven by a timer.
	// Returns the refreshed job, or (nil, false) if unknown.
	Refresh(ctx context.Context, id string) (*StratosJob, bool)

	// AppendStage adds a stage to the job's progress timeline. The tracker
	// dedups by Code against the last existing stage, so translators may
	// call this on every poll without checking themselves. No-op for unknown
	// job ids.
	AppendStage(id string, stage JobStage)
}

// trackedJob is the internal tracker row — adds bookkeeping the wire shape
// doesn't need (translator, ref, terminal timestamp for TTL eviction).
type trackedJob struct {
	job        StratosJob
	translator JobTranslator
	ref        interface{}
	terminalAt *time.Time
}

// InMemoryTracker holds all jobs in a map guarded by a RWMutex. Suitable
// when the frontend's poll is guaranteed to land on the replica that created
// the job (CF deploy session affinity, or a single-replica k8s deploy).
type InMemoryTracker struct {
	mu        sync.RWMutex
	jobs      map[string]*trackedJob
	ttl       time.Duration
	clock     func() time.Time
	sweepTick time.Duration

	stopOnce sync.Once
	stopCh   chan struct{}
}

// InMemoryTrackerConfig tunes the tracker. Zero values pick sensible defaults.
type InMemoryTrackerConfig struct {
	// TTL is how long a terminal job stays retrievable after completion.
	// Default: 10 minutes.
	TTL time.Duration
	// SweepInterval is how often the eviction sweeper runs.
	// Default: 1 minute.
	SweepInterval time.Duration
	// Clock is overridable for tests.
	Clock func() time.Time
}

// NewInMemoryTracker constructs a tracker and starts its eviction sweeper
// goroutine. Call Stop() to release the sweeper on shutdown.
func NewInMemoryTracker(cfg InMemoryTrackerConfig) *InMemoryTracker {
	if cfg.TTL == 0 {
		cfg.TTL = 10 * time.Minute
	}
	if cfg.SweepInterval == 0 {
		cfg.SweepInterval = time.Minute
	}
	if cfg.Clock == nil {
		cfg.Clock = time.Now
	}
	t := &InMemoryTracker{
		jobs:      make(map[string]*trackedJob),
		ttl:       cfg.TTL,
		clock:     cfg.Clock,
		sweepTick: cfg.SweepInterval,
		stopCh:    make(chan struct{}),
	}
	go t.sweepLoop()
	return t
}

// Stop halts the eviction sweeper. Safe to call multiple times.
func (t *InMemoryTracker) Stop() {
	t.stopOnce.Do(func() { close(t.stopCh) })
}

// Create generates an opaque job id and registers a PROCESSING job.
func (t *InMemoryTracker) Create(kind string, translator JobTranslator, ref interface{}) string {
	now := t.clock()
	id := newJobID()
	t.mu.Lock()
	t.jobs[id] = &trackedJob{
		job: StratosJob{
			ID:        id,
			Kind:      kind,
			State:     JobStateProcessing,
			StartedAt: now,
			UpdatedAt: now,
		},
		translator: translator,
		ref:        ref,
	}
	t.mu.Unlock()
	return id
}

// Get returns a snapshot of the job by id.
func (t *InMemoryTracker) Get(id string) (*StratosJob, bool) {
	t.mu.RLock()
	defer t.mu.RUnlock()
	tj, ok := t.jobs[id]
	if !ok {
		return nil, false
	}
	snap := tj.job
	return &snap, true
}

// Refresh drives the translator once and updates the stored job. If the job
// is already terminal, Refresh is a no-op — terminal states are sticky until
// TTL eviction.
func (t *InMemoryTracker) Refresh(ctx context.Context, id string) (*StratosJob, bool) {
	t.mu.RLock()
	tj, ok := t.jobs[id]
	t.mu.RUnlock()
	if !ok {
		return nil, false
	}
	if tj.job.State.IsTerminal() {
		snap := tj.job
		return &snap, true
	}

	state, errs, result, err := tj.translator.Fetch(ctx, tj.ref)
	if err != nil {
		// Transport failure — leave current state; caller retries next poll.
		snap := tj.job
		return &snap, true
	}

	now := t.clock()
	t.mu.Lock()
	tj.job.State = state
	tj.job.UpdatedAt = now
	if state == JobStateFailed {
		tj.job.Errors = errs
	}
	if state == JobStateComplete {
		tj.job.Result = result
	}
	if state.IsTerminal() {
		tTerminal := now
		tj.terminalAt = &tTerminal
	}
	// Optional capability: if the translator knows its current stage,
	// append it to the timeline under the same lock — no external call,
	// no risk of deadlock.
	if se, ok := tj.translator.(StageEmittingTranslator); ok {
		if stage, has := se.CurrentStage(tj.ref); has {
			t.appendStageLocked(tj, stage)
		}
	}
	snap := tj.job
	t.mu.Unlock()
	return &snap, true
}

// appendStageLocked appends a stage to tj's timeline when its Code
// differs from the last existing stage. Must be called with t.mu held.
func (t *InMemoryTracker) appendStageLocked(tj *trackedJob, stage JobStage) {
	n := len(tj.job.Stages)
	if n > 0 && tj.job.Stages[n-1].Code == stage.Code {
		return // dedup: same code as last stage
	}
	tj.job.Stages = append(tj.job.Stages, stage)
	tj.job.UpdatedAt = t.clock()
}

// AppendStage adds a stage to the job's history if its Code differs from
// the last existing stage. Dedup-by-Code makes it safe for translators
// to call on every poll without checking themselves.
func (t *InMemoryTracker) AppendStage(id string, stage JobStage) {
	t.mu.Lock()
	defer t.mu.Unlock()

	tj, ok := t.jobs[id]
	if !ok {
		return // unknown job — no-op
	}
	t.appendStageLocked(tj, stage)
}

// sweepLoop periodically evicts jobs whose terminalAt + ttl has elapsed.
func (t *InMemoryTracker) sweepLoop() {
	ticker := time.NewTicker(t.sweepTick)
	defer ticker.Stop()
	for {
		select {
		case <-t.stopCh:
			return
		case <-ticker.C:
			t.sweep()
		}
	}
}

func (t *InMemoryTracker) sweep() {
	cutoff := t.clock().Add(-t.ttl)
	t.mu.Lock()
	for id, tj := range t.jobs {
		if tj.terminalAt != nil && tj.terminalAt.Before(cutoff) {
			delete(t.jobs, id)
		}
	}
	t.mu.Unlock()
}

// newJobID produces an opaque 128-bit hex id. No backend information is
// encoded — the tracker resolves (translator, ref) internally.
func newJobID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		// crypto/rand on linux/darwin cannot fail in practice; fall back to
		// a time-based id so we never return an empty string.
		return "job-" + time.Now().UTC().Format("20060102150405.000000000")
	}
	return hex.EncodeToString(b[:])
}

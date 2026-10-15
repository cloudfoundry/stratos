package stratosjobs

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"sync"
	"time"
)

// Tracker owns the lifecycle of tracked jobs. The interface keeps the
// implementation pluggable.
//
// A frontend poll may land on a replica that did not create the job
// (multi-replica k8s without session affinity, a restart, a redeploy).
// Jobs whose translator implements JobIDCodec survive that: their id
// carries what the translator needs to rebuild the job, and Resolve
// rebuilds it from the backend. Jobs with random ids resolve only on the
// replica that created them.
//
// Methods are safe for concurrent use.
type Tracker interface {
	// Create registers a new tracked job with a Translator-owned reference.
	// Returns the Stratos job id: encoded by the translator when it
	// implements JobIDCodec, random otherwise. Initial state is PROCESSING.
	Create(kind string, translator JobTranslator, ref interface{}) string

	// Register makes a translator's ids resolvable on this replica even
	// when the job was created elsewhere. A no-op for translators that do
	// not implement JobIDCodec.
	Register(translator JobTranslator)

	// Resolve is the poll entry point: it refreshes the job like Refresh,
	// first rebuilding it from its id for userGUID when this replica does
	// not hold it. Returns (nil, false) when the id is unknown and cannot
	// be rebuilt, the job belongs to another user (see
	// OwnedRefTranslator), or the backend reports the job does not exist.
	Resolve(ctx context.Context, id string, userGUID string) (*StratosJob, bool)

	// Get returns the job by id. Returns (nil, false) if unknown / evicted.
	Get(id string) (*StratosJob, bool)

	// Refresh asks the translator for the current underlying state and
	// updates the tracked job, so frontends see progress without the
	// translator being driven by a timer. Returns the refreshed job, or
	// (nil, false) if unknown or the backend reports the job does not
	// exist (the job is then dropped).
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
	owner      string // Stratos user the ref polls as; "" when unknown
	terminalAt *time.Time
}

// InMemoryTracker holds all jobs in a map guarded by a RWMutex. A job with
// a random id resolves only on the replica that created it; one with an
// encoded id (JobIDCodec) resolves on any replica that registered its
// translator.
type InMemoryTracker struct {
	mu        sync.RWMutex
	jobs      map[string]*trackedJob
	codecs    map[string]JobTranslator // Kind() -> translator implementing JobIDCodec
	ttl       time.Duration
	clock     func() time.Time
	sweepTick time.Duration
	metrics   *Metrics // optional; nil-safe everywhere

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
	// Metrics, if non-nil, receives ActiveJobs gauge + StageCountTotal
	// counter updates as jobs come and go and stages are appended.
	Metrics *Metrics
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
		codecs:    make(map[string]JobTranslator),
		ttl:       cfg.TTL,
		clock:     cfg.Clock,
		sweepTick: cfg.SweepInterval,
		metrics:   cfg.Metrics,
		stopCh:    make(chan struct{}),
	}
	go t.sweepLoop()
	return t
}

// Stop halts the eviction sweeper. Safe to call multiple times.
func (t *InMemoryTracker) Stop() {
	t.stopOnce.Do(func() { close(t.stopCh) })
}

// Register records a JobIDCodec translator under its Kind() so Resolve
// can rebuild its jobs.
func (t *InMemoryTracker) Register(translator JobTranslator) {
	if _, ok := translator.(JobIDCodec); !ok {
		return
	}
	t.mu.Lock()
	t.codecs[translator.Kind()] = translator
	t.mu.Unlock()
}

// Create registers a PROCESSING job under the translator's encoded id, or
// a random one when the translator has no codec or declines the ref.
func (t *InMemoryTracker) Create(kind string, translator JobTranslator, ref interface{}) string {
	id := newJobID()
	if codec, ok := translator.(JobIDCodec); ok {
		if encoded, ok := codec.EncodeID(kind, ref); ok && strings.HasPrefix(encoded, translator.Kind()+".") {
			id = encoded
		}
	}
	t.insert(id, kind, translator, ref)
	return id
}

// insert adds a PROCESSING job under id unless one is already there (an
// encoded id names one backend job, so a second insert is the same job).
func (t *InMemoryTracker) insert(id, kind string, translator JobTranslator, ref interface{}) {
	now := t.clock()
	t.mu.Lock()
	if _, exists := t.jobs[id]; exists {
		t.mu.Unlock()
		return
	}
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
		owner:      refOwner(translator, ref),
	}
	t.mu.Unlock()
	if t.metrics != nil {
		t.metrics.ActiveJobs.Inc()
	}
}

// refOwner names the user ref polls as, or "" when the translator cannot.
func refOwner(translator JobTranslator, ref interface{}) string {
	if o, ok := translator.(OwnedRefTranslator); ok {
		return o.RefOwner(ref)
	}
	return ""
}

// Resolve refreshes the job for its owner, rebuilding it from its id
// first when this replica does not hold it. Another user's job reads as
// unknown, the same answer as an id that never existed.
func (t *InMemoryTracker) Resolve(ctx context.Context, id string, userGUID string) (*StratosJob, bool) {
	owner, ok := t.ownerOf(id)
	if !ok {
		if !t.rebuild(id, userGUID) {
			return nil, false
		}
		// Re-read: a concurrent poll may have inserted the job first.
		owner, ok = t.ownerOf(id)
	}
	if !ok || owner == "" || owner != userGUID {
		return nil, false
	}
	return t.Refresh(ctx, id)
}

// ownerOf returns the owner of the job held under id.
func (t *InMemoryTracker) ownerOf(id string) (string, bool) {
	t.mu.RLock()
	defer t.mu.RUnlock()
	tj, ok := t.jobs[id]
	if !ok {
		return "", false
	}
	return tj.owner, true
}

// rebuild decodes id with the codec registered for its prefix and inserts
// the job as PROCESSING for userGUID; the caller's Refresh then asks the
// backend for its real state. Decoding happens outside the lock; insert
// re-checks under it, so concurrent polls for one id track one job.
func (t *InMemoryTracker) rebuild(id, userGUID string) bool {
	prefix, _, found := strings.Cut(id, ".")
	if !found || userGUID == "" {
		return false
	}
	t.mu.RLock()
	translator := t.codecs[prefix]
	t.mu.RUnlock()
	if translator == nil {
		return false
	}
	kind, ref, ok := translator.(JobIDCodec).DecodeID(id, userGUID)
	if !ok {
		return false
	}
	t.insert(id, kind, translator, ref)
	return true
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
	// Snapshot under the lock: concurrent polls for one job may be
	// writing it below.
	t.mu.RLock()
	tj, ok := t.jobs[id]
	var current StratosJob
	if ok {
		current = tj.job
	}
	t.mu.RUnlock()
	if !ok {
		return nil, false
	}
	if current.State.IsTerminal() {
		return &current, true
	}

	state, errs, result, err := tj.translator.Fetch(ctx, tj.ref)
	if errors.Is(err, ErrJobNotFound) {
		// The backend has no such job: the outcome is unknowable, which
		// the poll reports as 404.
		t.remove(id, tj)
		return nil, false
	}
	if err != nil {
		// Transport failure — leave current state; caller retries next poll.
		return &current, true
	}

	now := t.clock()
	t.mu.Lock()
	if tj.job.State.IsTerminal() {
		// A concurrent poll reached terminal first; terminal is sticky.
		snap := tj.job
		t.mu.Unlock()
		return &snap, true
	}
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

// remove drops tj from the tracker if it is still the job held under id.
func (t *InMemoryTracker) remove(id string, tj *trackedJob) {
	t.mu.Lock()
	removed := t.jobs[id] == tj
	if removed {
		delete(t.jobs, id)
	}
	t.mu.Unlock()
	if removed && t.metrics != nil {
		t.metrics.ActiveJobs.Dec()
	}
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
	if t.metrics != nil {
		t.metrics.StageCountTotal.WithLabelValues(tj.job.Kind).Inc()
	}
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
	var evicted int
	t.mu.Lock()
	for id, tj := range t.jobs {
		if tj.terminalAt != nil && tj.terminalAt.Before(cutoff) {
			delete(t.jobs, id)
			evicted++
		}
	}
	t.mu.Unlock()
	if t.metrics != nil && evicted > 0 {
		t.metrics.ActiveJobs.Sub(float64(evicted))
	}
}

// newJobID produces an opaque 128-bit hex id for translators without a
// JobIDCodec. No backend information is encoded — the tracker resolves
// (translator, ref) internally. It contains no ".", so it never routes to
// a codec.
func newJobID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		// crypto/rand on linux/darwin cannot fail in practice; fall back to
		// a time-based id so we never return an empty string.
		return "job-" + time.Now().UTC().Format("20060102150405.000000000")
	}
	return hex.EncodeToString(b[:])
}

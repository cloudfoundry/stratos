package stratosjobs

import (
	"context"
	"errors"
	"testing"
	"time"
)

// stubTranslator lets tests script the sequence of Fetch responses.
type stubTranslator struct {
	kind  string
	calls int
	fn    func(call int) (JobState, []StratosError, interface{}, error)
}

func (s *stubTranslator) Fetch(_ context.Context, _ interface{}) (JobState, []StratosError, interface{}, error) {
	s.calls++
	return s.fn(s.calls)
}

func (s *stubTranslator) Kind() string {
	if s.kind == "" {
		return "stub"
	}
	return s.kind
}

// constantClock gives tests deterministic timestamps.
func constantClock(ts time.Time) func() time.Time {
	return func() time.Time { return ts }
}

func newTestTracker(t *testing.T, clock func() time.Time) *InMemoryTracker {
	t.Helper()
	// Very long sweep interval so tests drive eviction deterministically by
	// calling tr.sweep() directly instead of racing the goroutine.
	tr := NewInMemoryTracker(InMemoryTrackerConfig{
		TTL:           10 * time.Minute,
		SweepInterval: time.Hour,
		Clock:         clock,
	})
	t.Cleanup(tr.Stop)
	return tr
}

func TestCreate_ReturnsNonEmptyIDAndProcessingState(t *testing.T) {
	tr := newTestTracker(t, time.Now)
	tl := &stubTranslator{fn: func(int) (JobState, []StratosError, interface{}, error) {
		return JobStateProcessing, nil, nil, nil
	}}

	id := tr.Create("cf.app.delete", tl, "ref-x")
	if id == "" {
		t.Fatal("expected non-empty job id")
	}

	job, ok := tr.Get(id)
	if !ok {
		t.Fatalf("expected job %q to be retrievable", id)
	}
	if job.State != JobStateProcessing {
		t.Errorf("expected initial state PROCESSING, got %q", job.State)
	}
	if job.Kind != "cf.app.delete" {
		t.Errorf("expected kind cf.app.delete, got %q", job.Kind)
	}
	if job.StartedAt.IsZero() {
		t.Error("expected StartedAt to be populated")
	}
}

func TestGet_UnknownIDReturnsFalse(t *testing.T) {
	tr := newTestTracker(t, time.Now)
	if _, ok := tr.Get("nope"); ok {
		t.Error("expected unknown id to report not-found")
	}
}

func TestRefresh_TerminalCompletePopulatesResult(t *testing.T) {
	tr := newTestTracker(t, time.Now)
	tl := &stubTranslator{fn: func(int) (JobState, []StratosError, interface{}, error) {
		return JobStateComplete, nil, map[string]string{"guid": "abc"}, nil
	}}
	id := tr.Create("cf.app.delete", tl, "ref")

	job, ok := tr.Refresh(context.Background(), id)
	if !ok {
		t.Fatal("expected refresh to find the job")
	}
	if job.State != JobStateComplete {
		t.Errorf("expected COMPLETE, got %q", job.State)
	}
	if job.Result == nil {
		t.Error("expected result payload on COMPLETE")
	}
	if len(job.Errors) != 0 {
		t.Errorf("expected no errors on COMPLETE, got %+v", job.Errors)
	}
}

func TestRefresh_TerminalFailedPopulatesErrors(t *testing.T) {
	tr := newTestTracker(t, time.Now)
	wantErr := StratosError{Code: "cf.v3.x", Message: "nope"}
	tl := &stubTranslator{fn: func(int) (JobState, []StratosError, interface{}, error) {
		return JobStateFailed, []StratosError{wantErr}, nil, nil
	}}
	id := tr.Create("cf.app.delete", tl, "ref")

	job, _ := tr.Refresh(context.Background(), id)
	if job.State != JobStateFailed {
		t.Fatalf("expected FAILED, got %q", job.State)
	}
	if len(job.Errors) != 1 || job.Errors[0] != wantErr {
		t.Errorf("expected single error %+v, got %+v", wantErr, job.Errors)
	}
	if job.Result != nil {
		t.Errorf("expected nil result on FAILED, got %+v", job.Result)
	}
}

func TestRefresh_TerminalIsSticky(t *testing.T) {
	tr := newTestTracker(t, time.Now)
	// Translator returns COMPLETE on first call, then would flip to FAILED
	// on any subsequent call — but Refresh should never call it again
	// because the job is terminal.
	tl := &stubTranslator{fn: func(n int) (JobState, []StratosError, interface{}, error) {
		if n == 1 {
			return JobStateComplete, nil, "done", nil
		}
		return JobStateFailed, []StratosError{{Code: "x"}}, nil, nil
	}}
	id := tr.Create("k", tl, "r")

	_, _ = tr.Refresh(context.Background(), id)
	if tl.calls != 1 {
		t.Fatalf("expected 1 fetch call after first terminal refresh, got %d", tl.calls)
	}

	// Second refresh must not re-drive the translator.
	job2, _ := tr.Refresh(context.Background(), id)
	if tl.calls != 1 {
		t.Errorf("expected translator to stay uncalled on sticky terminal, got %d calls", tl.calls)
	}
	if job2.State != JobStateComplete {
		t.Errorf("expected state to remain COMPLETE, got %q", job2.State)
	}
}

func TestRefresh_TransportErrorPreservesState(t *testing.T) {
	tr := newTestTracker(t, time.Now)
	tl := &stubTranslator{fn: func(int) (JobState, []StratosError, interface{}, error) {
		return "", nil, nil, errors.New("network down")
	}}
	id := tr.Create("k", tl, "r")

	job, ok := tr.Refresh(context.Background(), id)
	if !ok {
		t.Fatal("expected job still present after transport failure")
	}
	if job.State != JobStateProcessing {
		t.Errorf("expected PROCESSING preserved, got %q", job.State)
	}
}

func TestRefresh_UnknownIDReturnsFalse(t *testing.T) {
	tr := newTestTracker(t, time.Now)
	if _, ok := tr.Refresh(context.Background(), "nope"); ok {
		t.Error("expected unknown id to return not-found")
	}
}

func TestSweep_EvictsTerminalAfterTTL(t *testing.T) {
	now := time.Date(2026, 4, 22, 20, 0, 0, 0, time.UTC)
	clock := now
	tr := NewInMemoryTracker(InMemoryTrackerConfig{
		TTL:           5 * time.Minute,
		SweepInterval: time.Hour, // effectively disabled; we call sweep() directly
		Clock:         func() time.Time { return clock },
	})
	t.Cleanup(tr.Stop)

	tl := &stubTranslator{fn: func(int) (JobState, []StratosError, interface{}, error) {
		return JobStateComplete, nil, "r", nil
	}}
	id := tr.Create("k", tl, "r")
	if _, _ = tr.Refresh(context.Background(), id); tl.calls != 1 {
		t.Fatalf("expected translator called once to terminalize; got %d", tl.calls)
	}

	// Before TTL — sweep should keep the job.
	tr.sweep()
	if _, ok := tr.Get(id); !ok {
		t.Fatal("expected job still present before TTL elapses")
	}

	// Advance clock past TTL — sweep should evict.
	clock = now.Add(6 * time.Minute)
	tr.sweep()
	if _, ok := tr.Get(id); ok {
		t.Error("expected job evicted after TTL")
	}
}

func TestInMemoryTracker_AppendStage_Dedups(t *testing.T) {
	tr := NewInMemoryTracker(InMemoryTrackerConfig{})
	defer tr.Stop()

	id := tr.Create("test-kind", nil, nil)

	s1 := JobStage{Code: "STAGING", Label: "Staging", Index: 1, Of: 3, EnteredAt: time.Now()}
	tr.AppendStage(id, s1)
	tr.AppendStage(id, s1) // duplicate by Code — must no-op

	job, ok := tr.Get(id)
	if !ok {
		t.Fatal("job missing")
	}
	if got := len(job.Stages); got != 1 {
		t.Fatalf("expected 1 stage after dedup, got %d", got)
	}

	s2 := JobStage{Code: "STARTING", Label: "Starting", Index: 2, Of: 3, EnteredAt: time.Now()}
	tr.AppendStage(id, s2)
	job, _ = tr.Get(id)
	if got := len(job.Stages); got != 2 {
		t.Fatalf("expected 2 stages after distinct-Code append, got %d", got)
	}
	if job.Stages[1].Code != "STARTING" {
		t.Errorf("expected last stage code=STARTING, got %s", job.Stages[1].Code)
	}
}

func TestInMemoryTracker_AppendStage_UnknownJob_NoOp(t *testing.T) {
	tr := NewInMemoryTracker(InMemoryTrackerConfig{})
	defer tr.Stop()

	// Should not panic on unknown id
	tr.AppendStage("nonexistent", JobStage{Code: "X"})
}

// stageEmittingStub extends stubTranslator with the StageEmittingTranslator
// capability so tests can exercise the Refresh hook without needing a real
// translator.
type stageEmittingStub struct {
	stubTranslator
	// stageFn is called by CurrentStage; the ref arg is whatever was
	// passed to Tracker.Create.
	stageFn func(ref interface{}) (JobStage, bool)
}

func (s *stageEmittingStub) CurrentStage(ref interface{}) (JobStage, bool) {
	if s.stageFn == nil {
		return JobStage{}, false
	}
	return s.stageFn(ref)
}

// TestRefresh_StageEmittingTranslator_AppendsStageOnEachPoll verifies that
// Refresh calls CurrentStage and appends the returned stage when the
// translator implements StageEmittingTranslator.
func TestRefresh_StageEmittingTranslator_AppendsStageOnEachPoll(t *testing.T) {
	tr := newTestTracker(t, time.Now)

	// Translator always returns PROCESSING so multiple Refresh calls proceed.
	call := 0
	stages := []JobStage{
		{Code: "STAGE_A", Label: "Stage A", Index: 1, Of: 0},
		{Code: "STAGE_B", Label: "Stage B", Index: 2, Of: 0},
	}
	tl := &stageEmittingStub{
		stubTranslator: stubTranslator{
			fn: func(int) (JobState, []StratosError, interface{}, error) {
				return JobStateProcessing, nil, nil, nil
			},
		},
		stageFn: func(_ interface{}) (JobStage, bool) {
			if call < len(stages) {
				return stages[call], true
			}
			return JobStage{}, false
		},
	}

	id := tr.Create("test-kind", tl, "ref")

	// First poll — should append STAGE_A.
	call = 0
	job, ok := tr.Refresh(context.Background(), id)
	if !ok {
		t.Fatal("expected job present")
	}
	if got := len(job.Stages); got != 1 {
		t.Fatalf("expected 1 stage after first poll, got %d", got)
	}
	if job.Stages[0].Code != "STAGE_A" {
		t.Errorf("expected STAGE_A, got %s", job.Stages[0].Code)
	}

	// Second poll with same stage code — dedup must suppress.
	call = 0
	_, _ = tr.Refresh(context.Background(), id)
	job, _ = tr.Get(id)
	if got := len(job.Stages); got != 1 {
		t.Fatalf("expected 1 stage after dedup poll, got %d", got)
	}

	// Third poll with a new stage code — should append STAGE_B.
	call = 1
	_, _ = tr.Refresh(context.Background(), id)
	job, _ = tr.Get(id)
	if got := len(job.Stages); got != 2 {
		t.Fatalf("expected 2 stages after new-code poll, got %d", got)
	}
	if job.Stages[1].Code != "STAGE_B" {
		t.Errorf("expected STAGE_B, got %s", job.Stages[1].Code)
	}
}

// TestRefresh_PlainTranslator_NoStagesAppended verifies that a translator
// that does NOT implement StageEmittingTranslator leaves Stages untouched.
func TestRefresh_PlainTranslator_NoStagesAppended(t *testing.T) {
	tr := newTestTracker(t, time.Now)
	tl := &stubTranslator{fn: func(int) (JobState, []StratosError, interface{}, error) {
		return JobStateProcessing, nil, nil, nil
	}}

	id := tr.Create("test-kind", tl, "ref")
	job, _ := tr.Refresh(context.Background(), id)
	if len(job.Stages) != 0 {
		t.Errorf("expected no stages from plain translator, got %d", len(job.Stages))
	}
}

// TestRefresh_StageEmittingTranslator_HasFalse_NoStage verifies that when
// CurrentStage returns (_, false) no stage is appended.
func TestRefresh_StageEmittingTranslator_HasFalse_NoStage(t *testing.T) {
	tr := newTestTracker(t, time.Now)
	tl := &stageEmittingStub{
		stubTranslator: stubTranslator{
			fn: func(int) (JobState, []StratosError, interface{}, error) {
				return JobStateProcessing, nil, nil, nil
			},
		},
		stageFn: func(_ interface{}) (JobStage, bool) { return JobStage{}, false },
	}

	id := tr.Create("test-kind", tl, "ref")
	job, _ := tr.Refresh(context.Background(), id)
	if len(job.Stages) != 0 {
		t.Errorf("expected no stage when CurrentStage returns false, got %d", len(job.Stages))
	}
}

func TestSweep_LeavesNonTerminalAlone(t *testing.T) {
	now := time.Date(2026, 4, 22, 20, 0, 0, 0, time.UTC)
	clock := now
	tr := NewInMemoryTracker(InMemoryTrackerConfig{
		TTL:           5 * time.Minute,
		SweepInterval: time.Hour,
		Clock:         func() time.Time { return clock },
	})
	t.Cleanup(tr.Stop)

	tl := &stubTranslator{fn: func(int) (JobState, []StratosError, interface{}, error) {
		return JobStateProcessing, nil, nil, nil
	}}
	id := tr.Create("k", tl, "r")

	// Advance clock well past what would be TTL if the job were terminal.
	clock = now.Add(24 * time.Hour)
	tr.sweep()
	if _, ok := tr.Get(id); !ok {
		t.Error("non-terminal job should never be evicted by TTL sweep")
	}
}

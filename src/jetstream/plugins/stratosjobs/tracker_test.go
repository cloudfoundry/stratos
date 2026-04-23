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

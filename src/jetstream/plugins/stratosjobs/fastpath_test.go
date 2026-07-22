package stratosjobs

import (
	"context"
	"errors"
	"testing"
	"time"
)

func newFastPathTracker(t *testing.T) *InMemoryTracker {
	t.Helper()
	tr := NewInMemoryTracker(InMemoryTrackerConfig{
		TTL:           time.Hour,
		SweepInterval: time.Hour,
	})
	t.Cleanup(tr.Stop)
	return tr
}

func TestFastPath_ResolvesImmediatelyOnComplete(t *testing.T) {
	tr := newFastPathTracker(t)
	tl := &stubTranslator{fn: func(int) (JobState, []StratosError, interface{}, error) {
		return JobStateComplete, nil, map[string]string{"guid": "x"}, nil
	}}

	res := RunFastPath(context.Background(), tr, tl, "ref", FastPathOptions{
		Kind:         "cf.app.delete",
		Window:       2 * time.Second,
		PollInterval: 10 * time.Millisecond,
	})

	if !res.Resolved {
		t.Fatal("expected Resolved=true when translator returns terminal immediately")
	}
	if res.State != JobStateComplete {
		t.Errorf("expected COMPLETE, got %q", res.State)
	}
	if res.Result == nil {
		t.Error("expected result payload on COMPLETE")
	}
	if res.HandoffJob != nil {
		t.Error("expected no handoff when resolved synchronously")
	}
}

func TestFastPath_ResolvesOnFailedWithErrors(t *testing.T) {
	tr := newFastPathTracker(t)
	wantErr := StratosError{Code: "cf.v3.invalid", Message: "nope"}
	tl := &stubTranslator{fn: func(int) (JobState, []StratosError, interface{}, error) {
		return JobStateFailed, []StratosError{wantErr}, nil, nil
	}}

	res := RunFastPath(context.Background(), tr, tl, "ref", FastPathOptions{
		Kind:   "cf.app.delete",
		Window: time.Second,
	})

	if !res.Resolved {
		t.Fatal("expected Resolved=true on FAILED terminal within window")
	}
	if res.State != JobStateFailed {
		t.Errorf("expected FAILED, got %q", res.State)
	}
	if len(res.Errors) != 1 || res.Errors[0] != wantErr {
		t.Errorf("expected single error, got %+v", res.Errors)
	}
}

func TestFastPath_HandsOffWhenWindowExhausted(t *testing.T) {
	tr := newFastPathTracker(t)
	tl := &stubTranslator{fn: func(int) (JobState, []StratosError, interface{}, error) {
		return JobStateProcessing, nil, nil, nil
	}}

	start := time.Now()
	res := RunFastPath(context.Background(), tr, tl, "ref", FastPathOptions{
		Kind:         "cf.app.delete",
		Window:       150 * time.Millisecond,
		PollInterval: 30 * time.Millisecond,
	})
	elapsed := time.Since(start)

	if res.Resolved {
		t.Fatal("expected handoff, got Resolved=true")
	}
	if res.HandoffJob == nil {
		t.Fatal("expected HandoffJob populated on window exhaustion")
	}
	if res.HandoffJob.State != JobStateProcessing {
		t.Errorf("expected handoff job PROCESSING, got %q", res.HandoffJob.State)
	}
	if res.HandoffJob.Kind != "cf.app.delete" {
		t.Errorf("expected kind cf.app.delete on handoff job, got %q", res.HandoffJob.Kind)
	}
	if elapsed < 150*time.Millisecond {
		t.Errorf("expected elapsed >= window; got %s", elapsed)
	}
	// Tracker should have stored it.
	if _, ok := tr.Get(res.HandoffJob.ID); !ok {
		t.Error("expected handoff job to be retrievable from tracker")
	}
}

func TestFastPath_HandsOffOnContextCancel(t *testing.T) {
	tr := newFastPathTracker(t)
	tl := &stubTranslator{fn: func(int) (JobState, []StratosError, interface{}, error) {
		return JobStateProcessing, nil, nil, nil
	}}

	ctx, cancel := context.WithCancel(context.Background())
	// Cancel shortly after the first poll.
	go func() {
		time.Sleep(50 * time.Millisecond)
		cancel()
	}()

	res := RunFastPath(ctx, tr, tl, "ref", FastPathOptions{
		Kind:         "cf.app.delete",
		Window:       5 * time.Second,
		PollInterval: 30 * time.Millisecond,
	})

	if res.Resolved {
		t.Fatal("expected handoff on ctx cancel, got Resolved=true")
	}
	if res.HandoffJob == nil {
		t.Fatal("expected HandoffJob populated on ctx cancel")
	}
	if _, ok := tr.Get(res.HandoffJob.ID); !ok {
		t.Error("expected handoff job registered in tracker even on ctx cancel")
	}
}

func TestFastPath_TransportErrorKeepsPolling(t *testing.T) {
	tr := newFastPathTracker(t)
	// First two calls error out; third returns COMPLETE. Loop should
	// tolerate transport failures and keep trying until window or success.
	tl := &stubTranslator{fn: func(n int) (JobState, []StratosError, interface{}, error) {
		if n < 3 {
			return "", nil, nil, errors.New("network blip")
		}
		return JobStateComplete, nil, "ok", nil
	}}

	res := RunFastPath(context.Background(), tr, tl, "ref", FastPathOptions{
		Kind:         "cf.app.delete",
		Window:       time.Second,
		PollInterval: 20 * time.Millisecond,
	})

	if !res.Resolved {
		t.Fatalf("expected Resolved=true after transient errors, got handoff=%+v", res.HandoffJob)
	}
	if res.State != JobStateComplete {
		t.Errorf("expected COMPLETE, got %q", res.State)
	}
	if tl.calls != 3 {
		t.Errorf("expected 3 translator calls (2 errored + 1 terminal), got %d", tl.calls)
	}
}

func TestFastPath_UsesDefaultsWhenZero(t *testing.T) {
	tr := newFastPathTracker(t)
	// Return terminal immediately — we just want to confirm zero-valued
	// options are accepted and don't deadlock.
	tl := &stubTranslator{fn: func(int) (JobState, []StratosError, interface{}, error) {
		return JobStateComplete, nil, "r", nil
	}}

	done := make(chan FastPathResult, 1)
	go func() {
		done <- RunFastPath(context.Background(), tr, tl, "ref", FastPathOptions{Kind: "k"})
	}()

	select {
	case res := <-done:
		if !res.Resolved {
			t.Error("expected default-options run to resolve immediately on terminal")
		}
	case <-time.After(4 * time.Second):
		t.Fatal("RunFastPath with default options deadlocked")
	}
}

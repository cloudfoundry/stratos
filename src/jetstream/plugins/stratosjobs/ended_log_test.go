package stratosjobs

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"testing"
	"time"
)

// captureEnded swaps the default logger for one writing text into a buffer
// and returns a func listing the "job ended" lines logged so far.
func captureEnded(t *testing.T) func() []string {
	t.Helper()
	var buf bytes.Buffer
	previous := slog.Default()
	slog.SetDefault(slog.New(slog.NewTextHandler(&buf, nil)))
	t.Cleanup(func() { slog.SetDefault(previous) })
	return func() []string {
		var lines []string
		for _, l := range strings.Split(buf.String(), "\n") {
			if strings.Contains(l, `msg="job ended"`) {
				lines = append(lines, l)
			}
		}
		return lines
	}
}

func expectEnded(t *testing.T, lines []string, want ...string) {
	t.Helper()
	if len(lines) != 1 {
		t.Fatalf("expected one job ended line, got %d: %q", len(lines), lines)
	}
	for _, w := range want {
		if !strings.Contains(lines[0], w) {
			t.Errorf("expected %q in %q", w, lines[0])
		}
	}
}

func TestEndedLog_TerminalStatesLogOnceWithDuration(t *testing.T) {
	for _, tc := range []struct {
		state   JobState
		outcome string
	}{
		{JobStateComplete, "outcome=complete"},
		{JobStateFailed, "outcome=failed"},
	} {
		t.Run(string(tc.state), func(t *testing.T) {
			ended := captureEnded(t)
			now := time.Date(2026, 10, 17, 15, 0, 0, 0, time.UTC)
			clock := now
			tr := newTestTracker(t, func() time.Time { return clock })
			tl := &stubTranslator{fn: func(call int) (JobState, []StratosError, interface{}, error) {
				if call == 1 {
					return JobStateProcessing, nil, nil, nil
				}
				return tc.state, nil, nil, nil
			}}
			id := tr.Create("cf.service_instance.create", tl, "ref")

			tr.Refresh(context.Background(), id)
			if got := ended(); len(got) != 0 {
				t.Fatalf("expected nothing logged while running, got %q", got)
			}
			clock = now.Add(90 * time.Second)
			tr.Refresh(context.Background(), id)
			tr.Refresh(context.Background(), id) // terminal is sticky: no second line
			expectEnded(t, ended(), "kind=cf.service_instance.create", tc.outcome, "seconds=90", "rebuilt=false")
		})
	}
}

func TestEndedLog_BackendJobNotFound(t *testing.T) {
	ended := captureEnded(t)
	tr := newTestTracker(t, time.Now)
	tl := &stubTranslator{fn: func(int) (JobState, []StratosError, interface{}, error) {
		return "", nil, nil, fmt.Errorf("gone: %w", ErrJobNotFound)
	}}
	id := tr.Create("cf.app.delete", tl, "ref")
	tr.Refresh(context.Background(), id)
	expectEnded(t, ended(), "kind=cf.app.delete", "outcome=not_found")
}

// A job nobody polls any more (the browser stopped at its tracking limit,
// or closed) is logged when the sweep drops it, with how long it was
// followed: the operation ran at least that long.
func TestEndedLog_AbandonedJobLogsHowLongItWasFollowed(t *testing.T) {
	ended := captureEnded(t)
	now := time.Date(2026, 10, 17, 15, 0, 0, 0, time.UTC)
	clock := now
	tr := NewInMemoryTracker(InMemoryTrackerConfig{
		MaxIdle:       time.Hour,
		SweepInterval: time.Hour,
		Clock:         func() time.Time { return clock },
	})
	t.Cleanup(tr.Stop)
	tl := &stubTranslator{fn: func(int) (JobState, []StratosError, interface{}, error) {
		return "", nil, nil, errors.New("network down")
	}}
	id := tr.Create("cf.service_instance.create", tl, "ref")
	clock = now.Add(60 * time.Minute)
	tr.Refresh(context.Background(), id) // the last poll

	clock = now.Add(121 * time.Minute)
	tr.sweep()
	expectEnded(t, ended(), "kind=cf.service_instance.create", "outcome=abandoned", "seconds=3600")
}

// A job rebuilt on another replica starts its clock at the rebuild, so its
// duration is a lower bound; the line says so.
func TestEndedLog_RebuiltJobIsMarked(t *testing.T) {
	ended := captureEnded(t)
	tl := newCodecTranslator()
	tl.set("job-1", JobStateProcessing)
	creator := newTestTracker(t, time.Now)
	id := creator.Create("fake.thing.create", tl, backendRef{JobID: "job-1", User: "user-a"})

	replica := newTestTracker(t, time.Now)
	replica.Register(tl)
	replica.Resolve(context.Background(), id, "user-a")
	tl.set("job-1", JobStateComplete)
	replica.Resolve(context.Background(), id, "user-a")
	expectEnded(t, ended(), "kind=fake.thing.create", "outcome=complete", "rebuilt=true")
}

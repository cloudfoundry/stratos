package cloudfoundry

import (
	"errors"
	"fmt"
	"testing"
)

func mkGuids(n int) []string {
	guids := make([]string, n)
	for i := range guids {
		guids[i] = fmt.Sprintf("guid-%04d", i)
	}
	return guids
}

func TestChunkGuids(t *testing.T) {
	t.Parallel()

	cases := []struct {
		n          int
		wantChunks int
		wantLast   int
	}{
		{0, 0, 0},
		{1, 1, 1},
		{guidChunkDefault, 1, guidChunkDefault},
		{guidChunkDefault + 1, 2, 1},
		{500, 4, 500 - 3*guidChunkDefault},
	}
	for _, c := range cases {
		chunks := chunkGuids(mkGuids(c.n))
		if len(chunks) != c.wantChunks {
			t.Errorf("chunkGuids(%d): got %d chunks, want %d", c.n, len(chunks), c.wantChunks)
			continue
		}
		total := 0
		for i, ch := range chunks {
			if len(ch) > guidChunkDefault {
				t.Errorf("chunkGuids(%d): chunk %d has %d guids (> %d)", c.n, i, len(ch), guidChunkDefault)
			}
			total += len(ch)
		}
		if total != c.n {
			t.Errorf("chunkGuids(%d): chunks cover %d guids, want all %d", c.n, total, c.n)
		}
		if c.wantChunks > 0 && len(chunks[len(chunks)-1]) != c.wantLast {
			t.Errorf("chunkGuids(%d): last chunk has %d guids, want %d", c.n, len(chunks[len(chunks)-1]), c.wantLast)
		}
	}
}

func TestForEachGuidChunkMergesAndStopsOnError(t *testing.T) {
	t.Parallel()

	// All chunks visited, in order, covering every guid exactly once.
	seen := []string{}
	calls := 0
	err := forEachGuidChunk("space_guids", mkGuids(320), func(chunk []string) error {
		calls++
		seen = append(seen, chunk...)
		return nil
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if calls != 3 || len(seen) != 320 {
		t.Errorf("expected 3 calls covering 320 guids, got %d calls / %d guids", calls, len(seen))
	}
	if seen[0] != "guid-0000" || seen[319] != "guid-0319" {
		t.Errorf("chunk order not preserved: first=%s last=%s", seen[0], seen[319])
	}

	// First error stops the iteration and propagates.
	boom := errors.New("boom")
	calls = 0
	err = forEachGuidChunk("space_guids", mkGuids(320), func(chunk []string) error {
		calls++
		return boom
	})
	if !errors.Is(err, boom) {
		t.Errorf("expected the fn error to propagate, got %v", err)
	}
	if calls != 1 {
		t.Errorf("expected iteration to stop after the first error, got %d calls", calls)
	}
}

func TestGuidChunkSizeKnobParsing(t *testing.T) {
	// Not parallel — mutates the package-level setting.
	orig := guidChunkSetting
	defer func() { guidChunkSetting = orig }()

	cases := []struct {
		setting  string
		want     int
		adaptive bool
	}{
		{"", guidChunkDefault, false},
		{"200", 200, false},
		{"auto", guidChunkDefault, true},
		{"AUTO", guidChunkDefault, true},
		{"nonsense", guidChunkDefault, false},
		{"-5", guidChunkDefault, false},
		{"0", guidChunkDefault, false},
	}
	for _, c := range cases {
		guidChunkSetting = c.setting
		if got := guidChunkSize(); got != c.want {
			t.Errorf("guidChunkSize() with %q = %d, want %d", c.setting, got, c.want)
		}
		if got := guidChunkAdaptive(); got != c.adaptive {
			t.Errorf("guidChunkAdaptive() with %q = %v, want %v", c.setting, got, c.adaptive)
		}
	}
}

func TestForEachGuidChunkAdaptiveHalvesOn414(t *testing.T) {
	// Not parallel — mutates the package-level setting + adapted width.
	orig := guidChunkSetting
	defer func() {
		guidChunkSetting = orig
		adaptedChunkSize.Store(0)
	}()
	guidChunkSetting = "auto"
	adaptedChunkSize.Store(0)

	err414 := errors.New("capi: request failed (status 414): Request-URI Too Large")

	// The chain accepts <=80 guids: reject wider chunks with 414.
	var widths []int
	err := forEachGuidChunk("space_guids", mkGuids(300), func(chunk []string) error {
		widths = append(widths, len(chunk))
		if len(chunk) > 80 {
			return err414
		}
		return nil
	})
	if err != nil {
		t.Fatalf("adaptive mode should have ridden through the 414s, got: %v", err)
	}
	// 150 fails → 75 passes; every guid still covered exactly once.
	covered := 0
	for _, w := range widths {
		if w <= 80 {
			covered += w
		}
	}
	if covered != 300 {
		t.Errorf("adaptive retries should cover all 300 guids, covered %d (widths: %v)", covered, widths)
	}
	if adaptedChunkSize.Load() != 75 {
		t.Errorf("expected adapted width 75, got %d", adaptedChunkSize.Load())
	}
	// A later drain starts at the learned width.
	if got := effectiveGuidChunkSize(); got != 75 {
		t.Errorf("effectiveGuidChunkSize() = %d, want the adapted 75", got)
	}
}

func TestForEachGuidChunkFixedModeStopsOn414(t *testing.T) {
	// Not parallel — asserts against the default (fixed) mode.
	orig := guidChunkSetting
	defer func() { guidChunkSetting = orig }()
	guidChunkSetting = ""

	err414 := errors.New("capi: request failed (status 414): Request-URI Too Large")
	calls := 0
	err := forEachGuidChunk("space_guids", mkGuids(300), func(chunk []string) error {
		calls++
		return err414
	})
	if !errors.Is(err, err414) {
		t.Errorf("fixed mode must propagate the 414, got %v", err)
	}
	if calls != 1 {
		t.Errorf("fixed mode must not retry, got %d calls", calls)
	}
}

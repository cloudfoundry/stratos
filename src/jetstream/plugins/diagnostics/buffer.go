package diagnostics

import (
	"sort"
	"strings"
	"sync"
	"time"
)

// Buffer accumulates counters and samples in memory, keyed by code family and
// dimension bucket. Thread-safe; designed for many emit callers and one
// snapshot reader.
type Buffer struct {
	cfg      BufferConfig
	mu       sync.Mutex
	counters map[string]map[string]*Counter // code -> dimKey -> counter
	samples  map[string][]Sample            // code -> ordered samples (oldest first)
}

func NewBuffer(cfg BufferConfig) *Buffer {
	return &Buffer{
		cfg:      cfg,
		counters: map[string]map[string]*Counter{},
		samples:  map[string][]Sample{},
	}
}

// dimKey produces a stable serialization of a dimensions map. Keys are sorted
// so reordering between callers doesn't fragment the counter into duplicate
// buckets.
func dimKey(d map[string]string) string {
	if len(d) == 0 {
		return ""
	}
	keys := make([]string, 0, len(d))
	for k := range d {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, k := range keys {
		parts = append(parts, k+"="+d[k])
	}
	return strings.Join(parts, "|")
}

// EmitCounter increments the bucket matching `code` + `dims` (creates if absent).
// Never blocks the caller beyond the internal mutex.
func (b *Buffer) EmitCounter(code string, dims map[string]string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	now := time.Now().UnixMilli()
	m, ok := b.counters[code]
	if !ok {
		m = map[string]*Counter{}
		b.counters[code] = m
	}
	key := dimKey(dims)
	if c, exists := m[key]; exists {
		c.Count++
		c.LastAt = now
		return
	}
	m[key] = &Counter{
		Code:       code,
		Dimensions: dims,
		Count:      1,
		FirstAt:    now,
		LastAt:     now,
	}
}

// EmitSample appends a sample. When per-family cap is exceeded, oldest samples
// are dropped and a buffer-overflow counter is incremented with the code they
// belonged to.
func (b *Buffer) EmitSample(code string, dims map[string]string, value float64) {
	b.mu.Lock()
	defer b.mu.Unlock()
	now := time.Now().UnixMilli()
	b.samples[code] = append(b.samples[code], Sample{
		Code:       code,
		At:         now,
		Dimensions: dims,
		Value:      &value,
	})
	if len(b.samples[code]) > b.cfg.PerFamilyCap {
		dropped := int64(len(b.samples[code]) - b.cfg.PerFamilyCap)
		b.samples[code] = b.samples[code][dropped:]
		b.recordOverflowLocked(code, dropped, now)
	}
}

// Snapshot returns a deep-copied envelope safe for JSON serialization; holding
// the returned value does not leak the live buffer state.
func (b *Buffer) Snapshot() SnapshotEnvelope {
	b.mu.Lock()
	defer b.mu.Unlock()
	counters := map[string][]Counter{}
	for code, m := range b.counters {
		out := make([]Counter, 0, len(m))
		for _, c := range m {
			out = append(out, *c)
		}
		counters[code] = out
	}
	samples := map[string][]Sample{}
	for code, s := range b.samples {
		cp := make([]Sample, len(s))
		copy(cp, s)
		samples[code] = cp
	}
	return SnapshotEnvelope{
		Version:    1,
		CapturedAt: time.Now().UnixMilli(),
		Counters:   counters,
		Samples:    samples,
	}
}

func (b *Buffer) Reset() {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.counters = map[string]map[string]*Counter{}
	b.samples = map[string][]Sample{}
}

func (b *Buffer) recordOverflowLocked(code string, dropped int64, at int64) {
	m, ok := b.counters["buffer-overflow"]
	if !ok {
		m = map[string]*Counter{}
		b.counters["buffer-overflow"] = m
	}
	key := "code=" + code
	if c, exists := m[key]; exists {
		c.Count += dropped
		c.LastAt = at
		return
	}
	m[key] = &Counter{
		Code:       "buffer-overflow",
		Dimensions: map[string]string{"code": code},
		Count:      dropped,
		FirstAt:    at,
		LastAt:     at,
	}
}

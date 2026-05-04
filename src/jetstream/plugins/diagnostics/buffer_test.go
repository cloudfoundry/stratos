package diagnostics

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestBuffer_EmitCounter(t *testing.T) {
	b := NewBuffer(DefaultBufferConfig())
	b.EmitCounter("cf-api-call-count", map[string]string{"method": "GET", "path": "/v3/organizations"})
	b.EmitCounter("cf-api-call-count", map[string]string{"method": "GET", "path": "/v3/organizations"})
	snap := b.Snapshot()
	counters := snap.Counters["cf-api-call-count"]
	assert.Len(t, counters, 1)
	assert.Equal(t, int64(2), counters[0].Count)
}

func TestBuffer_EmitCounter_DimensionBuckets(t *testing.T) {
	b := NewBuffer(DefaultBufferConfig())
	b.EmitCounter("cf-api-call-count", map[string]string{"method": "GET"})
	b.EmitCounter("cf-api-call-count", map[string]string{"method": "POST"})
	snap := b.Snapshot()
	assert.Len(t, snap.Counters["cf-api-call-count"], 2)
}

func TestBuffer_EmitSample(t *testing.T) {
	b := NewBuffer(DefaultBufferConfig())
	b.EmitSample("cf-api-call-timing", map[string]string{"method": "GET"}, 123.4)
	snap := b.Snapshot()
	samples := snap.Samples["cf-api-call-timing"]
	assert.Len(t, samples, 1)
	assert.NotNil(t, samples[0].Value)
	assert.InDelta(t, 123.4, *samples[0].Value, 0.001)
}

func TestBuffer_RingBufferDropsOldest(t *testing.T) {
	cfg := DefaultBufferConfig()
	cfg.PerFamilyCap = 10
	b := NewBuffer(cfg)
	for i := 0; i < 15; i++ {
		b.EmitSample("cf-api-call-timing", map[string]string{}, float64(i))
	}
	snap := b.Snapshot()
	assert.Len(t, snap.Samples["cf-api-call-timing"], 10)
	overflow := snap.Counters["buffer-overflow"]
	assert.NotEmpty(t, overflow)
	assert.Equal(t, int64(5), overflow[0].Count)
	assert.Equal(t, "cf-api-call-timing", overflow[0].Dimensions["code"])
}

func TestBuffer_Reset(t *testing.T) {
	b := NewBuffer(DefaultBufferConfig())
	b.EmitCounter("cf-api-call-count", map[string]string{"method": "GET"})
	b.EmitSample("cf-api-call-timing", map[string]string{}, 10)
	b.Reset()
	snap := b.Snapshot()
	assert.Empty(t, snap.Counters)
	assert.Empty(t, snap.Samples)
}

func TestBuffer_SnapshotCapturedAt(t *testing.T) {
	b := NewBuffer(DefaultBufferConfig())
	before := time.Now().UnixMilli()
	snap := b.Snapshot()
	after := time.Now().UnixMilli()
	assert.GreaterOrEqual(t, snap.CapturedAt, before)
	assert.LessOrEqual(t, snap.CapturedAt, after)
	assert.Equal(t, 1, snap.Version)
}

func TestBuffer_ConcurrentSafe(t *testing.T) {
	b := NewBuffer(DefaultBufferConfig())
	done := make(chan struct{})
	for i := 0; i < 10; i++ {
		go func() {
			for j := 0; j < 100; j++ {
				b.EmitCounter("cf-api-call-count", map[string]string{"method": "GET"})
			}
			done <- struct{}{}
		}()
	}
	for i := 0; i < 10; i++ {
		<-done
	}
	snap := b.Snapshot()
	assert.Equal(t, int64(1000), snap.Counters["cf-api-call-count"][0].Count)
}

// src/jetstream/plugins/stratosjobs/metrics.go
//
// Prometheus metric collectors for the stratosjobs package. The tracker
// honors an optional *Metrics in InMemoryTrackerConfig — incrementing on
// Create, incrementing per appended stage in appendStageLocked (after
// dedup), and decrementing on TTL sweep eviction.
//
// Namespace: stratosjobs
// Subsystem: (none — keeps metric names short and predictable)
//
//   stratosjobs_active_jobs
//     Gauge — number of non-terminal jobs currently held in the tracker.
//     Increments on Create; decrements per evicted job on sweep.
//
//   stratosjobs_stage_count_total
//     CounterVec — cumulative stage appends, labelled by `kind` (e.g.
//     "cf.app.restage", "cf.app.rollback"). Each unique stage emit is
//     counted once — the tracker's dedup-by-Code prevents double-counting.
package stratosjobs

import "github.com/prometheus/client_golang/prometheus"

// Metrics holds the registered Prometheus collectors for the stratosjobs
// package. Consumers should call RegisterMetrics once at startup and hold
// the returned *Metrics for the lifetime of the process.
type Metrics struct {
	// ActiveJobs tracks the number of non-terminal jobs currently held in
	// the tracker. Gauge (not counter) because eviction decrements it.
	ActiveJobs prometheus.Gauge

	// StageCountTotal counts stage appends, partitioned by job kind. Use
	// WithLabelValues(kind).Inc() inside the tracker's appendStageLocked.
	StageCountTotal *prometheus.CounterVec
}

// RegisterMetrics constructs and registers the stratosjobs collectors with
// reg. Returns the Metrics struct so the caller can reference the collectors
// without a separate lookup.
//
// reg is typically prometheus.DefaultRegisterer in production and a
// prometheus.NewRegistry() in tests (to avoid cross-test pollution).
func RegisterMetrics(reg prometheus.Registerer) (*Metrics, error) {
	activeJobs := prometheus.NewGauge(prometheus.GaugeOpts{
		Namespace: "stratosjobs",
		Name:      "active_jobs",
		Help:      "Number of non-terminal jobs currently held in the tracker.",
	})

	stageCountTotal := prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace: "stratosjobs",
		Name:      "stage_count_total",
		Help:      "Total number of stage appends, partitioned by job kind.",
	}, []string{"kind"})

	if err := reg.Register(activeJobs); err != nil {
		return nil, err
	}
	if err := reg.Register(stageCountTotal); err != nil {
		return nil, err
	}

	return &Metrics{
		ActiveJobs:      activeJobs,
		StageCountTotal: stageCountTotal,
	}, nil
}

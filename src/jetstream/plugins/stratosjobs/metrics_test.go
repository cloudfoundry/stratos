// src/jetstream/plugins/stratosjobs/metrics_test.go
package stratosjobs

import (
	"testing"

	"github.com/prometheus/client_golang/prometheus"
	dto "github.com/prometheus/client_model/go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// collectGauge reads the current float64 value from a prometheus.Gauge.
func collectGauge(t *testing.T, g prometheus.Gauge) float64 {
	t.Helper()
	var m dto.Metric
	require.NoError(t, g.Write(&m))
	return m.GetGauge().GetValue()
}

// collectCounter reads the current float64 value from a CounterVec for the
// given label values.
func collectCounter(t *testing.T, cv *prometheus.CounterVec, lvs ...string) float64 {
	t.Helper()
	c, err := cv.GetMetricWithLabelValues(lvs...)
	require.NoError(t, err)
	var m dto.Metric
	require.NoError(t, c.Write(&m))
	return m.GetCounter().GetValue()
}

// TestRegisterMetrics_CollectorsRegisterSuccessfully verifies that
// RegisterMetrics does not return an error and produces non-nil collectors.
func TestRegisterMetrics_CollectorsRegisterSuccessfully(t *testing.T) {
	reg := prometheus.NewRegistry()
	m, err := RegisterMetrics(reg)
	require.NoError(t, err)
	require.NotNil(t, m)
	assert.NotNil(t, m.ActiveJobs, "ActiveJobs gauge should be non-nil")
	assert.NotNil(t, m.StageCountTotal, "StageCountTotal counter should be non-nil")
}

// TestRegisterMetrics_DoubleRegistrationFails verifies the expected
// Prometheus behaviour: registering the same metric twice returns an
// AlreadyRegisteredError, letting the caller decide whether to reuse
// the existing collector or fail.
func TestRegisterMetrics_DoubleRegistrationFails(t *testing.T) {
	reg := prometheus.NewRegistry()
	_, err := RegisterMetrics(reg)
	require.NoError(t, err, "first registration should succeed")

	_, err = RegisterMetrics(reg)
	require.Error(t, err, "second registration on same registerer should fail")
}

// TestActiveJobsGauge_IncrementDecrement verifies that Set / Inc / Dec
// operations on the returned gauge produce the expected value.
func TestActiveJobsGauge_IncrementDecrement(t *testing.T) {
	reg := prometheus.NewRegistry()
	m, err := RegisterMetrics(reg)
	require.NoError(t, err)

	// Initial value should be 0.
	assert.Equal(t, float64(0), collectGauge(t, m.ActiveJobs))

	m.ActiveJobs.Inc()
	m.ActiveJobs.Inc()
	assert.Equal(t, float64(2), collectGauge(t, m.ActiveJobs))

	m.ActiveJobs.Dec()
	assert.Equal(t, float64(1), collectGauge(t, m.ActiveJobs))

	m.ActiveJobs.Set(0)
	assert.Equal(t, float64(0), collectGauge(t, m.ActiveJobs))
}

// TestStageCountTotal_KindLabel verifies that the counter accepts the
// "kind" label and increments independently per value.
func TestStageCountTotal_KindLabel(t *testing.T) {
	reg := prometheus.NewRegistry()
	m, err := RegisterMetrics(reg)
	require.NoError(t, err)

	// Initially zero for any kind.
	assert.Equal(t, float64(0), collectCounter(t, m.StageCountTotal, "cf.app.restage"))
	assert.Equal(t, float64(0), collectCounter(t, m.StageCountTotal, "cf.app.rollback"))

	m.StageCountTotal.WithLabelValues("cf.app.restage").Inc()
	m.StageCountTotal.WithLabelValues("cf.app.restage").Inc()
	m.StageCountTotal.WithLabelValues("cf.app.rollback").Inc()

	assert.Equal(t, float64(2), collectCounter(t, m.StageCountTotal, "cf.app.restage"))
	assert.Equal(t, float64(1), collectCounter(t, m.StageCountTotal, "cf.app.rollback"))
}

// TestRegisterMetrics_CollectorsAreGatherable confirms that the registered
// collectors appear in the registry's Gather output — i.e. they have the
// correct namespace and names on the wire.
func TestRegisterMetrics_CollectorsAreGatherable(t *testing.T) {
	reg := prometheus.NewRegistry()
	m, err := RegisterMetrics(reg)
	require.NoError(t, err)

	// Touch both collectors so they appear in Gather (CounterVec with no
	// observations is omitted by default until first use).
	m.ActiveJobs.Set(3)
	m.StageCountTotal.WithLabelValues("cf.app.delete").Inc()

	mfs, err := reg.Gather()
	require.NoError(t, err)

	names := make(map[string]bool, len(mfs))
	for _, mf := range mfs {
		names[mf.GetName()] = true
	}

	assert.True(t, names["stratosjobs_active_jobs"],
		"expected stratosjobs_active_jobs in gathered metrics")
	assert.True(t, names["stratosjobs_stage_count_total"],
		"expected stratosjobs_stage_count_total in gathered metrics")
}

// src/jetstream/plugins/cloudfoundry/cf_async_translator_test.go
package cloudfoundry

import (
	"testing"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestTranslateCFJobResult_NonCompleteReturnsNil guards the contract that
// only terminal-COMPLETE jobs produce a result payload — PROCESSING / POLLING
// / FAILED return nil so the tracker doesn't surface partial information.
func TestTranslateCFJobResult_NonCompleteReturnsNil(t *testing.T) {
	for _, state := range []string{"PROCESSING", "POLLING", "FAILED", ""} {
		t.Run(state, func(t *testing.T) {
			job := &capi.Job{State: state}
			job.GUID = "job-1"
			assert.Nil(t, translateCFJobResult(job))
		})
	}
}

// TestTranslateCFJobResult_CompleteEmitsJobIdentity covers the baseline
// COMPLETE shape: jobGuid + operation are always present so consumers
// can correlate logs/diagnostics regardless of whether the job had Links.
func TestTranslateCFJobResult_CompleteEmitsJobIdentity(t *testing.T) {
	job := &capi.Job{Operation: "service_credential_binding.delete", State: "COMPLETE"}
	job.GUID = "job-42"

	got := translateCFJobResult(job)
	require.NotNil(t, got)
	m, ok := got.(map[string]interface{})
	require.True(t, ok)
	assert.Equal(t, "job-42", m["jobGuid"])
	assert.Equal(t, "service_credential_binding.delete", m["operation"])
	assert.NotContains(t, m, "links", "delete jobs typically carry no links — should not emit empty map")
}

// TestTranslateCFJobResult_CompleteSurfacesResourceLinks covers the create-path
// case: CF v3 jobs emit a links.<resource>.href on terminal COMPLETE so
// consumers can extract the new resource's guid without refetching. Generic
// across operations — service_instance, app, route, etc. all flow through.
func TestTranslateCFJobResult_CompleteSurfacesResourceLinks(t *testing.T) {
	job := &capi.Job{Operation: "service_instance.create", State: "COMPLETE"}
	job.GUID = "job-create-1"
	job.Links = capi.Links{
		"self":             {Href: "https://cf.example.com/v3/jobs/job-create-1"},
		"service_instance": {Href: "https://cf.example.com/v3/service_instances/si-new-guid"},
	}

	got := translateCFJobResult(job)
	require.NotNil(t, got)
	m, ok := got.(map[string]interface{})
	require.True(t, ok)
	assert.Equal(t, "job-create-1", m["jobGuid"])
	assert.Equal(t, "service_instance.create", m["operation"])

	links, ok := m["links"].(map[string]string)
	require.True(t, ok, "links should be a string→string map, got %T", m["links"])
	assert.Equal(t, "https://cf.example.com/v3/service_instances/si-new-guid", links["service_instance"])
	assert.Equal(t, "https://cf.example.com/v3/jobs/job-create-1", links["self"])
}

// TestTranslateCFJobResult_DropsEmptyHrefs guards against the CF SDK ever
// returning a Link entry with no Href — we drop it rather than emitting a
// noise key. If every link is empty, the links map is omitted entirely.
func TestTranslateCFJobResult_DropsEmptyHrefs(t *testing.T) {
	job := &capi.Job{State: "COMPLETE"}
	job.Links = capi.Links{
		"self":             {Href: ""},
		"service_instance": {Href: ""},
	}

	got := translateCFJobResult(job)
	require.NotNil(t, got)
	m, ok := got.(map[string]interface{})
	require.True(t, ok)
	assert.NotContains(t, m, "links")
}

// src/jetstream/plugins/cloudfoundry/cf_async_translator_test.go
package cloudfoundry

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
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
// across operations — service_instances, apps, routes, etc. all flow through.
func TestTranslateCFJobResult_CompleteSurfacesResourceLinks(t *testing.T) {
	job := &capi.Job{Operation: "service_instance.create", State: "COMPLETE"}
	job.GUID = "job-create-1"
	job.Links = capi.Links{
		"self":              {Href: "https://cf.example.com/v3/jobs/job-create-1"},
		"service_instances": {Href: "https://cf.example.com/v3/service_instances/si-new-guid"},
	}

	got := translateCFJobResult(job)
	require.NotNil(t, got)
	m, ok := got.(map[string]interface{})
	require.True(t, ok)
	assert.Equal(t, "job-create-1", m["jobGuid"])
	assert.Equal(t, "service_instance.create", m["operation"])

	links, ok := m["links"].(map[string]string)
	require.True(t, ok, "links should be a string→string map, got %T", m["links"])
	assert.Equal(t, "https://cf.example.com/v3/service_instances/si-new-guid", links["service_instances"])
	assert.Equal(t, "https://cf.example.com/v3/jobs/job-create-1", links["self"])
}

// TestTranslateCFJobResult_DropsEmptyHrefs guards against the CF SDK ever
// returning a Link entry with no Href — we drop it rather than emitting a
// noise key. If every link is empty, the links map is omitted entirely.
func TestTranslateCFJobResult_DropsEmptyHrefs(t *testing.T) {
	job := &capi.Job{State: "COMPLETE"}
	job.Links = capi.Links{
		"self":              {Href: ""},
		"service_instances": {Href: ""},
	}

	got := translateCFJobResult(job)
	require.NotNil(t, got)
	m, ok := got.(map[string]interface{})
	require.True(t, ok)
	assert.NotContains(t, m, "links")
}

// TestCFJobTranslatorFetch_ResourceLastOperation drives the outcome check
// through Fetch, the path a handed-off job is polled on. A job can reach
// COMPLETE while the resource it links to records the operation as failed;
// Fetch must report that job FAILED with the broker's description, and must
// leave every other outcome (succeeded, in progress, a different operation,
// the resource gone or unreadable, no resource link) COMPLETE.
func TestCFJobTranslatorFetch_ResourceLastOperation(t *testing.T) {
	const host = "https://api.example.com"
	lastOp := func(opType, state, desc string) map[string]interface{} {
		return map[string]interface{}{
			"guid":           "res-1",
			"last_operation": map[string]interface{}{"type": opType, "state": state, "description": desc},
		}
	}
	cases := []struct {
		name      string
		operation string
		link      string // job link key naming the resource; "" for none
		path      string // resource path the link points at
		resource  interface{}
		status    int // resource GET status; 0 means 200
		want      stratosjobs.JobState
		code      string
		message   string
		detail    string
	}{
		{
			name: "route binding create failed", operation: "service_route_bindings.create",
			link: "service_route_binding", path: "/v3/service_route_bindings/res-1",
			resource: lastOp("create", "failed", "route service refused the route"),
			want:     stratosjobs.JobStateFailed, code: "cf.service_route_binding.last_operation.failed",
			message: "Service route binding create failed", detail: "route service refused the route",
		},
		{
			name: "route binding delete failed", operation: "service_route_bindings.delete",
			link: "service_route_binding", path: "/v3/service_route_bindings/res-1",
			resource: lastOp("delete", "failed", "route service is unreachable"),
			want:     stratosjobs.JobStateFailed, code: "cf.service_route_binding.last_operation.failed",
			message: "Service route binding delete failed", detail: "route service is unreachable",
		},
		{
			name: "app binding create failed", operation: "service_bindings.create",
			link: "service_credential_binding", path: "/v3/service_credential_bindings/res-1",
			resource: lastOp("create", "failed", "broker could not bind"),
			want:     stratosjobs.JobStateFailed, code: "cf.service_credential_binding.last_operation.failed",
			message: "Service credential binding create failed", detail: "broker could not bind",
		},
		{
			name: "key delete failed", operation: "service_keys.delete",
			link: "service_credential_binding", path: "/v3/service_credential_bindings/res-1",
			resource: lastOp("delete", "failed", "broker could not unbind"),
			want:     stratosjobs.JobStateFailed, code: "cf.service_credential_binding.last_operation.failed",
			message: "Service credential binding delete failed", detail: "broker could not unbind",
		},
		{
			name: "instance create failed", operation: "service_instance.create",
			link: "service_instances", path: "/v3/service_instances/res-1",
			resource: lastOp("create", "failed", "plan is not available"),
			want:     stratosjobs.JobStateFailed, code: "cf.service_instance.last_operation.failed",
			message: "Service instance create failed", detail: "plan is not available",
		},
		{
			name: "instance delete failed", operation: "service_instance.delete",
			link: "service_instance", path: "/v3/service_instances/res-1",
			resource: lastOp("delete", "failed", "instance has bindings"),
			want:     stratosjobs.JobStateFailed, code: "cf.service_instance.last_operation.failed",
			message: "Service instance delete failed", detail: "instance has bindings",
		},
		{
			name: "failed without a description", operation: "service_instance.update",
			link: "service_instances", path: "/v3/service_instances/res-1",
			resource: lastOp("update", "failed", ""),
			want:     stratosjobs.JobStateFailed, code: "cf.service_instance.last_operation.failed",
			message: "Service instance update failed", detail: "service broker rejected the update",
		},
		{
			name: "succeeded", operation: "service_bindings.create",
			link: "service_credential_binding", path: "/v3/service_credential_bindings/res-1",
			resource: lastOp("create", "succeeded", ""),
			want:     stratosjobs.JobStateComplete,
		},
		{
			name: "in progress", operation: "service_route_bindings.create",
			link: "service_route_binding", path: "/v3/service_route_bindings/res-1",
			resource: lastOp("create", "in progress", ""),
			want:     stratosjobs.JobStateComplete,
		},
		{
			name: "failed for another operation", operation: "service_instance.update",
			link: "service_instances", path: "/v3/service_instances/res-1",
			resource: lastOp("create", "failed", "an older create"),
			want:     stratosjobs.JobStateComplete,
		},
		{
			name: "deleted resource is gone", operation: "service_instance.delete",
			link: "service_instance", path: "/v3/service_instances/res-1",
			status: http.StatusNotFound,
			want:   stratosjobs.JobStateComplete,
		},
		{
			name: "resource unreadable", operation: "service_bindings.create",
			link: "service_credential_binding", path: "/v3/service_credential_bindings/res-1",
			status: http.StatusForbidden,
			want:   stratosjobs.JobStateComplete,
		},
		{
			name: "no resource link", operation: "service_keys.delete",
			want: stratosjobs.JobStateComplete,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			links := map[string]interface{}{"self": map[string]string{"href": host + "/v3/jobs/job-1"}}
			if tc.link != "" {
				links[tc.link] = map[string]string{"href": host + tc.path}
			}
			resourceGets := 0
			handlers := map[string]capiHandler{
				"GET /v3/jobs/job-1": func(w http.ResponseWriter, _ *http.Request) {
					_ = json.NewEncoder(w).Encode(map[string]interface{}{
						"guid": "job-1", "operation": tc.operation, "state": "COMPLETE", "links": links,
					})
				},
			}
			if tc.path != "" {
				handlers["GET "+tc.path] = func(w http.ResponseWriter, _ *http.Request) {
					resourceGets++
					if tc.status != 0 {
						w.WriteHeader(tc.status)
						_, _ = w.Write([]byte(`{"errors":[{"code":10010,"title":"CF-ResourceNotFound","detail":"not found"}]}`))
						return
					}
					_ = json.NewEncoder(w).Encode(tc.resource)
				}
			}
			ts := newCaptureServer(handlers)
			defer ts.Close()

			translator := NewCFJobTranslator(newPhase1CPlugin(ts.URL))
			state, errs, result, err := translator.Fetch(context.Background(),
				CFJobRef{CnsiGUID: "cnsi-1", UserGUID: "user-1", JobGUID: "job-1"})
			require.NoError(t, err)
			assert.Equal(t, tc.want, state)
			if tc.path != "" {
				assert.Equal(t, 1, resourceGets, "the resource the job links to must be read once")
			}
			if tc.want == stratosjobs.JobStateFailed {
				assert.Nil(t, result, "a failed job carries no result")
				require.Len(t, errs, 1)
				assert.Equal(t, tc.code, errs[0].Code)
				assert.Equal(t, tc.message, errs[0].Message)
				assert.Equal(t, tc.detail, errs[0].Detail)
				return
			}
			assert.Empty(t, errs)
			assert.NotNil(t, result, "a complete job keeps its result")
		})
	}
}

// TestCFJobTranslatorFetch_FailedBindingJobReportsBroker covers a binding
// job CF itself failed. CF (API 3.226, overview-broker failasync) fails it
// with its own exception name and keeps the broker's description on the
// binding's last_operation; Fetch reports the broker's description, and
// keeps CF's error when the binding cannot be read.
func TestCFJobTranslatorFetch_FailedBindingJobReportsBroker(t *testing.T) {
	cases := []struct {
		name      string
		operation string
		link      string
		path      string
		status    int // binding GET status; 0 means 200 with a failed last_operation
		code      string
		detail    string
	}{
		{
			name: "key create", operation: "service_keys.create",
			link: "service_credential_binding", path: "/v3/service_credential_bindings/b-1",
			code: "cf.service_credential_binding.last_operation.failed", detail: "Operation failed",
		},
		{
			name: "app binding create", operation: "service_bindings.create",
			link: "service_credential_binding", path: "/v3/service_credential_bindings/b-1",
			code: "cf.service_credential_binding.last_operation.failed", detail: "Operation failed",
		},
		{
			name: "route binding create", operation: "service_route_bindings.create",
			link: "service_route_binding", path: "/v3/service_route_bindings/b-1",
			code: "cf.service_route_binding.last_operation.failed", detail: "Operation failed",
		},
		{
			name: "binding gone", operation: "service_keys.create",
			link: "service_credential_binding", path: "/v3/service_credential_bindings/b-1",
			status: http.StatusNotFound,
			code:   "cf.v3.10009", detail: "create could not be completed: VCAP::CloudController::V3::LastOperationFailedState",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			ts := newCaptureServer(map[string]capiHandler{
				"GET /v3/jobs/job-1": func(w http.ResponseWriter, _ *http.Request) {
					_ = json.NewEncoder(w).Encode(map[string]interface{}{
						"guid": "job-1", "operation": tc.operation, "state": "FAILED",
						"errors": []map[string]interface{}{{
							"code": 10009, "title": "CF-UnableToPerform",
							"detail": "create could not be completed: VCAP::CloudController::V3::LastOperationFailedState",
						}},
						"links": map[string]interface{}{tc.link: map[string]string{"href": "https://api.example.com" + tc.path}},
					})
				},
				"GET " + tc.path: func(w http.ResponseWriter, _ *http.Request) {
					if tc.status != 0 {
						w.WriteHeader(tc.status)
						_, _ = w.Write([]byte(`{"errors":[{"code":10010,"title":"CF-ResourceNotFound","detail":"not found"}]}`))
						return
					}
					_ = json.NewEncoder(w).Encode(map[string]interface{}{
						"guid":           "b-1",
						"last_operation": map[string]interface{}{"type": "create", "state": "failed", "description": "Operation failed"},
					})
				},
			})
			defer ts.Close()

			translator := NewCFJobTranslator(newPhase1CPlugin(ts.URL))
			state, errs, result, err := translator.Fetch(context.Background(),
				CFJobRef{CnsiGUID: "cnsi-1", UserGUID: "user-1", JobGUID: "job-1"})
			require.NoError(t, err)
			assert.Equal(t, stratosjobs.JobStateFailed, state)
			assert.Nil(t, result)
			require.Len(t, errs, 1)
			assert.Equal(t, tc.code, errs[0].Code)
			assert.Equal(t, tc.detail, errs[0].Detail)
		})
	}
}

// TestCFJobTranslatorFetch_FailedJobSkipsResource guards that a service
// instance job CF itself failed keeps CF's errors, which already carry the
// broker's description: only a failed binding job is re-read.
func TestCFJobTranslatorFetch_FailedJobSkipsResource(t *testing.T) {
	resourceGets := 0
	ts := newCaptureServer(map[string]capiHandler{
		"GET /v3/jobs/job-1": func(w http.ResponseWriter, _ *http.Request) {
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "job-1", "operation": "service_instance.create", "state": "FAILED",
				"errors": []map[string]interface{}{{"code": 10009, "title": "CF-UnableToPerform", "detail": "create could not be completed"}},
				"links":  map[string]interface{}{"service_instances": map[string]string{"href": "https://api.example.com/v3/service_instances/si-1"}},
			})
		},
		"GET /v3/service_instances/si-1": func(w http.ResponseWriter, _ *http.Request) {
			resourceGets++
			_ = json.NewEncoder(w).Encode(map[string]interface{}{"guid": "si-1"})
		},
	})
	defer ts.Close()

	translator := NewCFJobTranslator(newPhase1CPlugin(ts.URL))
	state, errs, _, err := translator.Fetch(context.Background(),
		CFJobRef{CnsiGUID: "cnsi-1", UserGUID: "user-1", JobGUID: "job-1"})
	require.NoError(t, err)
	assert.Equal(t, stratosjobs.JobStateFailed, state)
	require.Len(t, errs, 1)
	assert.Equal(t, "cf.v3.10009", errs[0].Code)
	assert.Equal(t, 0, resourceGets)
}

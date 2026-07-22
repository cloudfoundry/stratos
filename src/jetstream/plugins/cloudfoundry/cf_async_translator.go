// src/jetstream/plugins/cloudfoundry/cf_async_translator.go
package cloudfoundry

import (
	"context"
	"fmt"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
)

// CFJobRef is what the CF translator stores in the tracker — everything
// it needs to re-acquire a capi client and poll the v3 job. We keep it
// explicit (not just the job GUID) because Jetstream is multi-tenant:
// two different CFs can mint the same job GUID, and the user's identity
// is required to rebuild the per-user capi client.
type CFJobRef struct {
	CnsiGUID string
	UserGUID string
	JobGUID  string
}

// CFJobTranslator implements stratosjobs.JobTranslator over CF v3 jobs.
// On each Fetch it rebuilds a capi client for the (cnsi, user) pair and
// polls /v3/jobs/{guid}, mapping CF's job state onto the Stratos state
// machine.
type CFJobTranslator struct {
	// proxyProvider is called on each Fetch so HMR / credential refresh
	// are picked up without restarting Jetstream. The CF plugin supplies
	// this closure at translator construction.
	proxyProvider func() nativeCFProxy
}

// NewCFJobTranslator constructs the translator for the given CF plugin.
func NewCFJobTranslator(cf *CloudFoundrySpecification) *CFJobTranslator {
	return &CFJobTranslator{proxyProvider: cf.nativeProxy}
}

// Kind returns the stable prefix this translator owns. Used only for
// diagnostics / filtering; not load-bearing.
func (t *CFJobTranslator) Kind() string { return "cf" }

// Fetch polls /v3/jobs/{guid} and maps its state onto the Stratos state
// machine.
//
// CF v3 Job states (from CAPI docs):
//   - PROCESSING, POLLING — non-terminal
//   - COMPLETE            — terminal success
//   - FAILED              — terminal failure, with errors[]
//
// Transport / auth failures bubble up through the error return so the
// tracker (and RunFastPath) can tolerate them without flipping the job
// to terminal.
func (t *CFJobTranslator) Fetch(ctx context.Context, ref interface{}) (
	stratosjobs.JobState,
	[]stratosjobs.StratosError,
	interface{},
	error,
) {
	cfRef, ok := ref.(CFJobRef)
	if !ok {
		return "", nil, nil, fmt.Errorf("cf translator: unexpected ref type %T", ref)
	}

	proxy := t.proxyProvider()
	if proxy == nil {
		return "", nil, nil, fmt.Errorf("cf translator: native proxy unavailable")
	}

	cfClient, err := newCapiClient(ctx, proxy, cfRef.CnsiGUID, cfRef.UserGUID)
	if err != nil {
		return "", nil, nil, fmt.Errorf("cf translator: build capi client: %w", err)
	}

	job, err := cfClient.Jobs().Get(ctx, cfRef.JobGUID)
	if err != nil {
		// Transport-level error — leave state as PROCESSING for the caller
		// to retry on the next poll.
		return stratosjobs.JobStateProcessing, nil, nil, err
	}

	return translateCFJobState(job), collectCFJobErrors(job), translateCFJobResult(job), nil
}

// translateCFJobState maps the CF job state string onto JobState. Unknown
// states default to PROCESSING — we'd rather keep polling than falsely
// report terminal.
func translateCFJobState(job *capi.Job) stratosjobs.JobState {
	switch job.State {
	case "COMPLETE":
		return stratosjobs.JobStateComplete
	case "FAILED":
		return stratosjobs.JobStateFailed
	default:
		// PROCESSING, POLLING, or anything unrecognized — treat as still running.
		return stratosjobs.JobStateProcessing
	}
}

// collectCFJobErrors converts the capi error array into StratosError. Only
// populated when the caller intends to surface failure; callers consult
// state==FAILED separately.
func collectCFJobErrors(job *capi.Job) []stratosjobs.StratosError {
	if len(job.Errors) == 0 {
		return nil
	}
	out := make([]stratosjobs.StratosError, 0, len(job.Errors))
	for _, e := range job.Errors {
		out = append(out, stratosjobs.StratosError{
			Code:    fmt.Sprintf("cf.v3.%d", e.Code),
			Message: e.Title,
			Detail:  e.Detail,
		})
	}
	return out
}

// translateCFJobResult returns the v3 job as the result payload on COMPLETE.
// For a delete the interesting information is "done"; for a create/update
// the interesting information is the new resource's identity, which CF
// surfaces on the job via `links.<resource>.href`. We pass the link map
// through so consumers can extract the resource guid without refetching.
//
// Generic across operations: every async create/update/delete job CF emits
// has a stable Links map (empty for delete). Including it unconditionally
// keeps the contract symmetric with the fast-path body shape — both fast
// and slow resolve paths now expose enough to identify the resource.
func translateCFJobResult(job *capi.Job) interface{} {
	if job.State != "COMPLETE" {
		return nil
	}
	out := map[string]interface{}{
		"jobGuid":   job.GUID,
		"operation": job.Operation,
	}
	if len(job.Links) > 0 {
		links := make(map[string]string, len(job.Links))
		for k, v := range job.Links {
			if v.Href != "" {
				links[k] = v.Href
			}
		}
		if len(links) > 0 {
			out["links"] = links
		}
	}
	return out
}

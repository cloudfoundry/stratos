// src/jetstream/plugins/cloudfoundry/cf_async_translator.go
package cloudfoundry

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"

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

// RefOwner implements stratosjobs.OwnedRefTranslator: the job is the
// session user's whose token polls it.
func (t *CFJobTranslator) RefOwner(ref interface{}) string {
	cfRef, _ := ref.(CFJobRef)
	return cfRef.UserGUID
}

// Fetch polls /v3/jobs/{guid} and maps its state onto the Stratos state
// machine.
//
// CF v3 Job states (from CAPI docs):
//   - PROCESSING, POLLING — non-terminal
//   - COMPLETE            — terminal success, unless the resource the job
//     links to records the operation as failed (checkJobResourceOutcome)
//   - FAILED              — terminal failure, with errors[]
//
// Transport / auth failures bubble up through the error return so the
// tracker (and RunFastPath) can tolerate them without flipping the job
// to terminal.
//
// RunFastPath and the tracker's Refresh both resolve jobs through Fetch,
// so the outcome check here covers a write resolved inside the fast-path
// window and one handed off and polled alike.
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
	if errors.Is(err, capi.ErrNotFound) {
		// CF has no such job: a forged or mistyped id, or a job CF has
		// already cleaned up. Either way its outcome is unknowable.
		return "", nil, nil, fmt.Errorf("cf translator: job %s: %w", cfRef.JobGUID, stratosjobs.ErrJobNotFound)
	}
	if err != nil {
		// Transport-level error — leave state as PROCESSING for the caller
		// to retry on the next poll.
		return stratosjobs.JobStateProcessing, nil, nil, err
	}

	if job.State == "COMPLETE" {
		if lastOpErr := checkJobResourceOutcome(ctx, cfClient, job); lastOpErr != nil {
			return stratosjobs.JobStateFailed, []stratosjobs.StratosError{*lastOpErr}, nil, nil
		}
	}

	return translateCFJobState(job), collectCFJobErrors(job), translateCFJobResult(job), nil
}

// cfJobKindPattern matches the kinds CF job ids are minted for:
// "cf.<resource>.<operation>", e.g. "cf.service_instance.create". A fixed
// shape, so an id with a segment missing does not parse as another kind.
var cfJobKindPattern = regexp.MustCompile(`^cf\.[a-z0-9_]+\.[a-z0-9_]+$`)

// cfJobIDGUIDPattern matches an endpoint or job guid inside a job id. No
// dots, so the id splits unambiguously from the right; only unreserved URL
// characters, so the id is one path segment as is.
var cfJobIDGUIDPattern = regexp.MustCompile(`^[A-Za-z0-9-]{1,64}$`)

// EncodeID implements stratosjobs.JobIDCodec. The id is
// "<kind>.<cnsiGUID>.<jobGUID>", e.g.
// "cf.service_instance.create.<endpoint guid>.<CF job guid>": everything
// but the user needed to poll the job, readable in logs and URL-safe
// without escaping. Guids hold no dots, so DecodeID splits the last two
// segments off and the rest is the kind. Declines refs it could not
// decode back, so the tracker falls back to a random id.
func (t *CFJobTranslator) EncodeID(kind string, ref interface{}) (string, bool) {
	cfRef, ok := ref.(CFJobRef)
	if !ok || !cfJobKindPattern.MatchString(kind) ||
		!cfJobIDGUIDPattern.MatchString(cfRef.CnsiGUID) || !cfJobIDGUIDPattern.MatchString(cfRef.JobGUID) {
		return "", false
	}
	return kind + "." + cfRef.CnsiGUID + "." + cfRef.JobGUID, true
}

// DecodeID implements stratosjobs.JobIDCodec. The ref is built for
// userGUID, the polling session's user, never for anyone the id names. It
// requires the endpoint to exist and the user to hold a token for it, the
// two things newCapiClient needs to poll CF, so an id the user cannot poll
// reads as unknown (404) rather than failing on every poll.
func (t *CFJobTranslator) DecodeID(id string, userGUID string) (string, interface{}, bool) {
	if userGUID == "" {
		return "", nil, false
	}
	rest, jobGUID, ok := cutLast(id, ".")
	if !ok {
		return "", nil, false
	}
	kind, cnsiGUID, ok := cutLast(rest, ".")
	if !ok || !cfJobKindPattern.MatchString(kind) ||
		!cfJobIDGUIDPattern.MatchString(cnsiGUID) || !cfJobIDGUIDPattern.MatchString(jobGUID) {
		return "", nil, false
	}
	proxy := t.proxyProvider()
	if proxy == nil {
		return "", nil, false
	}
	if _, err := proxy.GetCNSIRecord(cnsiGUID); err != nil {
		return "", nil, false
	}
	if _, ok := proxy.GetCNSITokenRecord(cnsiGUID, userGUID); !ok {
		return "", nil, false
	}
	return kind, CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: jobGUID}, true
}

// cutLast splits s around the last sep.
func cutLast(s, sep string) (before, after string, found bool) {
	i := strings.LastIndex(s, sep)
	if i < 0 {
		return s, "", false
	}
	return s[:i], s[i+len(sep):], true
}

// jobResourceLastOperation is the part of a resource's last_operation the
// outcome check reads, common to the three service resource types.
type jobResourceLastOperation struct {
	opType      string
	state       string
	description string
}

// jobResource describes one kind of resource a CF job can link to: the
// StratosError it reports a failed last_operation with, and how to GET it.
// get returns nil when the resource has no last_operation.
type jobResource struct {
	code  string
	label string
	get   func(ctx context.Context, cfClient capi.Client, guid string) (*jobResourceLastOperation, error)
}

var (
	serviceInstanceJobResource = jobResource{
		code:  "cf.service_instance.last_operation.failed",
		label: "Service instance",
		get: func(ctx context.Context, cfClient capi.Client, guid string) (*jobResourceLastOperation, error) {
			si, err := cfClient.ServiceInstances().Get(ctx, guid)
			if err != nil || si == nil || si.LastOperation == nil {
				return nil, err
			}
			lo := si.LastOperation
			return &jobResourceLastOperation{opType: lo.Type, state: lo.State, description: lo.Description}, nil
		},
	}
	serviceCredentialBindingJobResource = jobResource{
		code:  "cf.service_credential_binding.last_operation.failed",
		label: "Service credential binding",
		get: func(ctx context.Context, cfClient capi.Client, guid string) (*jobResourceLastOperation, error) {
			b, err := cfClient.ServiceCredentialBindings().Get(ctx, guid)
			if err != nil || b == nil || b.LastOperation == nil {
				return nil, err
			}
			lo := b.LastOperation
			return &jobResourceLastOperation{opType: lo.Type, state: lo.State, description: derefStr(lo.Description)}, nil
		},
	}
	serviceRouteBindingJobResource = jobResource{
		code:  "cf.service_route_binding.last_operation.failed",
		label: "Service route binding",
		get: func(ctx context.Context, cfClient capi.Client, guid string) (*jobResourceLastOperation, error) {
			b, err := cfClient.ServiceRouteBindings().Get(ctx, guid)
			if err != nil || b == nil || b.LastOperation == nil {
				return nil, err
			}
			lo := b.LastOperation
			return &jobResourceLastOperation{opType: lo.Type, state: lo.State, description: derefStr(lo.Description)}, nil
		},
	}
)

// jobResourceLinks lists the job link keys the outcome check follows. CF
// names the link after the job's resource_type, which differs per job class
// and not only per resource: instance create/update say service_instances,
// instance delete says service_instance (verified on CF API 3.226); app
// bindings and keys share service_credential_binding (captured); route
// bindings say service_route_binding (Cloud Controller's resource_type for
// route binding jobs; not captured). A slice, not a map, so a job carrying
// more than one is checked in a fixed order.
var jobResourceLinks = []struct {
	key      string
	resource jobResource
}{
	{"service_instances", serviceInstanceJobResource},
	{"service_instance", serviceInstanceJobResource},
	{"service_credential_binding", serviceCredentialBindingJobResource},
	{"service_route_binding", serviceRouteBindingJobResource},
}

// checkJobResourceOutcome re-reads the resource a COMPLETE job ran against
// and returns a StratosError when its last_operation records that same
// operation as failed. A broker can report failure on the resource while
// the job itself completes; without this check that failure reads as
// success (the wizard confirms a create the broker rejected).
//
// The operation is the suffix of the job's operation ("service_keys.create"
// → "create") and must match last_operation.type, so an update job does
// not report a stale create failure. Returns nil — the job stays COMPLETE —
// when the job links no service resource (CF drops the link once a delete
// has removed the resource), when the GET fails (a 404 after a delete means
// the resource is gone; any other error we would rather surface as a
// success the user can reconcile than block a healthy write), and when the
// last_operation is succeeded or still in progress.
func checkJobResourceOutcome(ctx context.Context, cfClient capi.Client, job *capi.Job) *stratosjobs.StratosError {
	operation := job.Operation[strings.LastIndex(job.Operation, ".")+1:]
	for _, l := range jobResourceLinks {
		link, ok := job.Links[l.key]
		if !ok {
			continue
		}
		guid := link.Href[strings.LastIndex(link.Href, "/")+1:]
		if guid == "" {
			return nil
		}
		lo, err := l.resource.get(ctx, cfClient, guid)
		if err != nil || lo == nil || lo.state != "failed" || lo.opType != operation {
			return nil
		}
		desc := lo.description
		if desc == "" {
			desc = "service broker rejected the " + operation
		}
		return &stratosjobs.StratosError{
			Code:    l.resource.code,
			Message: l.resource.label + " " + operation + " failed",
			Detail:  desc,
		}
	}
	return nil
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

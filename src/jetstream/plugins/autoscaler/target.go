package autoscaler

import (
	"context"
	"encoding/json"
	"log/slog"
	"sort"
	"sync"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/cloudfoundry"
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
)

// brokerCacheTTL bounds how long an app's broker list is reused. Only the
// brokers are cached: registered endpoints are read on every call, so an
// unregistered autoscaler stops being used at once.
const brokerCacheTTL = 60 * time.Second

type endpointRef struct {
	GUID     string `json:"guid"`
	Name     string `json:"name"`
	URL      string `json:"url"`
	Personal bool   `json:"personal"`
}

// target is the autoscaler an app's calls go to. "registered" is a
// registered autoscaler endpoint for one of the app's bindings; "default"
// is today's guess from the CF API address (api. → autoscaler.).
type target struct {
	Source     string       `json:"source"`
	Endpoint   *endpointRef `json:"endpoint,omitempty"`
	Duplicates struct {
		// Registered: endpoints for the chosen autoscaler's broker, when
		// more than one.
		Registered []endpointRef `json:"registered"`
		// Bound: brokers of the app's bindings with a registered
		// autoscaler, when more than one.
		Bound []string `json:"bound"`
	} `json:"duplicates"`
	record *api.CNSIRecord
}

type brokerCacheEntry struct {
	at      time.Time
	brokers map[string]string
}

type brokerCache struct {
	mu      sync.Mutex
	entries map[string]brokerCacheEntry
}

func parseLink(meta string) (endpointLink, bool) {
	var link endpointLink
	if err := json.Unmarshal([]byte(meta), &link); err != nil || link.CFGUID == "" {
		return endpointLink{}, false
	}
	return link, true
}

// resolveTarget finds the autoscaler for an app from its bindings. It never
// fails: any error resolves to "default", today's behaviour.
func (a *Autoscaler) resolveTarget(ctx context.Context, userGUID, cfGUID, appGUID string) target {
	t := target{Source: "default"}
	t.Duplicates.Registered = []endpointRef{}
	t.Duplicates.Bound = []string{}

	brokers, err := a.appBrokers(ctx, userGUID, cfGUID, appGUID)
	if err != nil {
		slog.Debug("autoscaler target: using the default address", "app", appGUID, "err", err)
		return t
	}
	if len(brokers) == 0 {
		return t
	}
	endpoints, err := a.portalProxy.ListEndpoints()
	if err != nil {
		return t
	}

	type candidate struct {
		rec    *api.CNSIRecord
		broker string
	}
	var candidates []candidate
	for _, rec := range endpoints {
		if rec.CNSIType != EndpointType || (rec.Creator != "" && rec.Creator != userGUID) {
			continue
		}
		link, ok := parseLink(rec.Metadata)
		if !ok || link.CFGUID != cfGUID {
			continue
		}
		if _, bound := brokers[link.BrokerGUID]; bound {
			candidates = append(candidates, candidate{rec, link.BrokerGUID})
		}
	}
	if len(candidates) == 0 {
		return t
	}

	// The user's own endpoint first, then system ones by name and GUID.
	// Records carry no creation time, so "oldest" cannot be the rule.
	sort.SliceStable(candidates, func(i, j int) bool {
		ci, cj := candidates[i].rec, candidates[j].rec
		if (ci.Creator != "") != (cj.Creator != "") {
			return ci.Creator != ""
		}
		if ci.Name != cj.Name {
			return ci.Name < cj.Name
		}
		return ci.GUID < cj.GUID
	})

	chosen := candidates[0]
	t.Source = "registered"
	t.record = chosen.rec
	ref := toRef(chosen.rec)
	t.Endpoint = &ref

	boundNames := map[string]bool{}
	sameBroker := []endpointRef{}
	for _, c := range candidates {
		boundNames[brokers[c.broker]] = true
		if c.broker == chosen.broker {
			sameBroker = append(sameBroker, toRef(c.rec))
		}
	}
	if len(sameBroker) > 1 {
		t.Duplicates.Registered = sameBroker
	}
	if len(boundNames) > 1 {
		for name := range boundNames {
			t.Duplicates.Bound = append(t.Duplicates.Bound, name)
		}
		sort.Strings(t.Duplicates.Bound)
	}
	return t
}

func toRef(rec *api.CNSIRecord) endpointRef {
	ref := endpointRef{GUID: rec.GUID, Name: rec.Name, Personal: rec.Creator != ""}
	if rec.APIEndpoint != nil {
		ref.URL = rec.APIEndpoint.String()
	}
	return ref
}

// appBrokers is the app's bound brokers (GUID → name), cached per user, CF
// and app for brokerCacheTTL. Errors are not cached.
// simplification: expired entries are dropped on the next store only; a
// size bound is the upgrade if many apps are viewed per process.
func (a *Autoscaler) appBrokers(ctx context.Context, userGUID, cfGUID, appGUID string) (map[string]string, error) {
	key := userGUID + "/" + cfGUID + "/" + appGUID
	a.cache.mu.Lock()
	if e, ok := a.cache.entries[key]; ok && time.Since(e.at) < brokerCacheTTL {
		a.cache.mu.Unlock()
		return e.brokers, nil
	}
	a.cache.mu.Unlock()

	lookup := a.brokersForApp
	if lookup == nil {
		lookup = a.capiBrokersForApp
	}
	brokers, err := lookup(ctx, cfGUID, userGUID, appGUID)
	if err != nil {
		return nil, err
	}

	a.cache.mu.Lock()
	defer a.cache.mu.Unlock()
	if a.cache.entries == nil {
		a.cache.entries = map[string]brokerCacheEntry{}
	}
	for k, e := range a.cache.entries {
		if time.Since(e.at) >= brokerCacheTTL {
			delete(a.cache.entries, k)
		}
	}
	a.cache.entries[key] = brokerCacheEntry{at: time.Now(), brokers: brokers}
	return brokers, nil
}

// capiBrokersForApp reads the brokers behind the app's bindings with the
// user's CF token: the app's bindings, then their managed instances with
// the brokers selected through fields (readable by any user who sees the
// instance, unlike /v3/service_brokers).
// simplification: one page of up to 5000 bindings per app.
func (a *Autoscaler) capiBrokersForApp(ctx context.Context, cfGUID, userGUID, appGUID string) (map[string]string, error) {
	client, err := cloudfoundry.NewCapiClient(ctx, a.portalProxy, cfGUID, userGUID)
	if err != nil {
		return nil, err
	}
	bindings, err := client.ServiceCredentialBindings().List(ctx, &capi.QueryParams{
		PerPage: 5000,
		Filters: map[string][]string{"app_guids": {appGUID}, "type": {"app"}},
	})
	if err != nil {
		return nil, err
	}
	seen := map[string]bool{}
	var instances []string
	for _, b := range bindings.Resources {
		if g := b.Relationships.ServiceInstance.Data; g != nil && !seen[g.GUID] {
			seen[g.GUID] = true
			instances = append(instances, g.GUID)
		}
	}
	brokers := map[string]string{}
	if len(instances) == 0 {
		return brokers, nil
	}

	list, err := client.ServiceInstances().List(ctx, &capi.QueryParams{
		PerPage: 5000,
		Filters: map[string][]string{"guids": instances, "type": {"managed"}},
		Fields:  map[string][]string{"service_plan.service_offering.service_broker": {"guid", "name"}},
	})
	if err != nil {
		return nil, err
	}
	for _, raw := range list.Included["service_brokers"] {
		var b struct {
			GUID string `json:"guid"`
			Name string `json:"name"`
		}
		if json.Unmarshal(raw, &b) == nil && b.GUID != "" {
			brokers[b.GUID] = b.Name
		}
	}
	return brokers, nil
}

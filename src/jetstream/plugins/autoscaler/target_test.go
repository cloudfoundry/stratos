package autoscaler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/stretchr/testify/require"
)

// targetProxy lists the registered endpoints.
type targetProxy struct {
	api.PortalProxy
	endpoints []*api.CNSIRecord
}

func (p *targetProxy) ListEndpoints() ([]*api.CNSIRecord, error) { return p.endpoints, nil }

// autoscalerRec is an autoscaler endpoint linked to cfGUID and broker; a
// creator makes it personal.
func autoscalerRec(guid, name, cfGUID, broker, creator string) *api.CNSIRecord {
	link, _ := json.Marshal(endpointLink{CFGUID: cfGUID, BrokerGUID: broker})
	u, _ := url.Parse("https://" + guid + ".sys.example.com")
	return &api.CNSIRecord{GUID: guid, Name: name, CNSIType: EndpointType, APIEndpoint: u,
		Metadata: string(link), Creator: creator}
}

// resolver returns an Autoscaler whose app is bound to brokers, and a
// counter of broker lookups.
func resolver(proxy *targetProxy, brokers map[string]string, err error) (*Autoscaler, *int) {
	calls := 0
	a := &Autoscaler{portalProxy: proxy}
	a.brokersForApp = func(context.Context, string, string, string) (map[string]string, error) {
		calls++
		return brokers, err
	}
	return a, &calls
}

func resolve(a *Autoscaler) target {
	return a.resolveTarget(context.Background(), "user-1", "cf", "app-1")
}

func names(refs []endpointRef) []string {
	out := []string{}
	for _, r := range refs {
		out = append(out, r.Name)
	}
	return out
}

func TestTargetOneRegistered(t *testing.T) {
	a, _ := resolver(&targetProxy{endpoints: []*api.CNSIRecord{
		autoscalerRec("as1", "lab autoscaler", "cf", "b1", ""),
	}}, map[string]string{"b1": "autoscaler"}, nil)

	got := resolve(a)
	require.Equal(t, "registered", got.Source)
	require.Equal(t, "as1", got.Endpoint.GUID)
	require.Empty(t, got.Duplicates.Registered)
	require.Empty(t, got.Duplicates.Bound)
}

func TestTargetNoBinding(t *testing.T) {
	a, _ := resolver(&targetProxy{endpoints: []*api.CNSIRecord{
		autoscalerRec("as1", "lab autoscaler", "cf", "b1", ""),
	}}, map[string]string{}, nil)
	require.Equal(t, "default", resolve(a).Source)
}

// Review Focus 2: the only binding is to another service.
func TestTargetNonAutoscalerBinding(t *testing.T) {
	a, _ := resolver(&targetProxy{endpoints: []*api.CNSIRecord{
		autoscalerRec("as1", "lab autoscaler", "cf", "b1", ""),
	}}, map[string]string{"b9": "mysql"}, nil)

	got := resolve(a)
	require.Equal(t, "default", got.Source)
	require.Nil(t, got.Endpoint)
	require.Empty(t, got.Duplicates.Registered)
	require.Empty(t, got.Duplicates.Bound)
}

// Review Focus 1: no CF token → today's path, which fails as it does today.
func TestTargetNoCFToken(t *testing.T) {
	a, _ := resolver(&targetProxy{endpoints: []*api.CNSIRecord{
		autoscalerRec("as1", "lab autoscaler", "cf", "b1", ""),
	}}, nil, errors.New("no token for endpoint"))
	require.Equal(t, "default", resolve(a).Source)
}

func TestTargetRegisteredTwice(t *testing.T) {
	proxy := &targetProxy{endpoints: []*api.CNSIRecord{
		autoscalerRec("b", "B", "cf", "b1", ""),
		autoscalerRec("a", "A", "cf", "b1", ""),
	}}
	a, _ := resolver(proxy, map[string]string{"b1": "autoscaler"}, nil)
	got := resolve(a)
	require.Equal(t, "A", got.Endpoint.Name)
	require.Equal(t, []string{"A", "B"}, names(got.Duplicates.Registered))

	// The user's own endpoint wins over the system ones.
	proxy.endpoints = append(proxy.endpoints, autoscalerRec("c", "C", "cf", "b1", "user-1"))
	got = resolve(a)
	require.Equal(t, "C", got.Endpoint.Name)
	require.True(t, got.Endpoint.Personal)
	require.Equal(t, []string{"C", "A", "B"}, names(got.Duplicates.Registered))
}

func TestTargetBoundTwice(t *testing.T) {
	a, _ := resolver(&targetProxy{endpoints: []*api.CNSIRecord{
		autoscalerRec("y", "Y", "cf", "b2", ""),
		autoscalerRec("x", "X", "cf", "b1", ""),
	}}, map[string]string{"b1": "autoscaler", "b2": "autoscaler-2"}, nil)

	got := resolve(a)
	require.Equal(t, "X", got.Endpoint.Name)
	require.Empty(t, got.Duplicates.Registered)
	require.Equal(t, []string{"autoscaler", "autoscaler-2"}, got.Duplicates.Bound)
}

// Review Focus 4: another user's personal endpoint is never a candidate.
func TestTargetIgnoresOtherUsersPersonal(t *testing.T) {
	a, _ := resolver(&targetProxy{endpoints: []*api.CNSIRecord{
		autoscalerRec("p", "theirs", "cf", "b1", "user-2"),
	}}, map[string]string{"b1": "autoscaler"}, nil)

	got := resolve(a)
	require.Equal(t, "default", got.Source)
	require.Empty(t, got.Duplicates.Registered)
	require.Empty(t, got.Duplicates.Bound)
}

func TestTargetOtherCF(t *testing.T) {
	a, _ := resolver(&targetProxy{endpoints: []*api.CNSIRecord{
		autoscalerRec("as1", "other", "cf-2", "b1", ""),
		{GUID: "plain-cf", CNSIType: "cf", Metadata: `{"cf_guid":"cf","broker_guid":"b1"}`},
	}}, map[string]string{"b1": "autoscaler"}, nil)
	require.Equal(t, "default", resolve(a).Source)
}

// Review Focus 5: only the broker map is cached; candidates are read fresh.
func TestTargetUnregisteredInCacheWindow(t *testing.T) {
	proxy := &targetProxy{endpoints: []*api.CNSIRecord{
		autoscalerRec("as1", "lab autoscaler", "cf", "b1", ""),
	}}
	a, calls := resolver(proxy, map[string]string{"b1": "autoscaler"}, nil)

	require.Equal(t, "registered", resolve(a).Source)
	proxy.endpoints = nil
	require.Equal(t, "default", resolve(a).Source)
	require.Equal(t, 1, *calls)
}

// ccProxy points a CF endpoint at a fake Cloud Controller.
type ccProxy struct {
	api.PortalProxy
	cc *httptest.Server
}

func (p *ccProxy) GetCNSIRecord(string) (api.CNSIRecord, error) {
	u, _ := url.Parse(p.cc.URL)
	return api.CNSIRecord{GUID: "cf", CNSIType: "cf", APIEndpoint: u}, nil
}

func (p *ccProxy) GetCNSITokenRecord(string, string) (api.TokenRecord, bool) {
	return api.TokenRecord{AuthToken: "cf-token"}, true
}

func TestCapiBrokersForApp(t *testing.T) {
	queries := map[string]url.Values{} // by path; capi also reads the root
	cc := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		queries[r.URL.Path] = r.URL.Query()
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3/service_credential_bindings":
			_, _ = w.Write([]byte(`{"pagination":{"total_results":2},"resources":[
				{"guid":"sb1","type":"app","relationships":{"service_instance":{"data":{"guid":"si1"}}}},
				{"guid":"sb2","type":"app","relationships":{"service_instance":{"data":{"guid":"si2"}}}}]}`))
		case "/v3/service_instances":
			_, _ = w.Write([]byte(`{"pagination":{"total_results":2},"resources":[{"guid":"si1"},{"guid":"si2"}],
				"included":{"service_brokers":[{"guid":"b1","name":"autoscaler"},{"guid":"b9","name":"mysql"}]}}`))
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer cc.Close()

	a := &Autoscaler{portalProxy: &ccProxy{cc: cc}}
	brokers, err := a.capiBrokersForApp(context.Background(), "cf", "user-1", "app-1")
	require.NoError(t, err)
	require.Equal(t, map[string]string{"b1": "autoscaler", "b9": "mysql"}, brokers)

	bindings, instances := queries["/v3/service_credential_bindings"], queries["/v3/service_instances"]
	require.Equal(t, "app-1", bindings.Get("app_guids"))
	require.Equal(t, "app", bindings.Get("type"))
	require.Equal(t, "si1,si2", instances.Get("guids"))
	require.Equal(t, "managed", instances.Get("type"))
	require.Equal(t, "guid,name", instances.Get("fields[service_plan.service_offering.service_broker]"))
}

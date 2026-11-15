package autoscaler

import (
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/stretchr/testify/require"
)

type unregisterProxy struct {
	api.PortalProxy
	endpoints    []*api.CNSIRecord
	unregistered []string
}

func (p *unregisterProxy) ListEndpoints() ([]*api.CNSIRecord, error) { return p.endpoints, nil }

func (p *unregisterProxy) UnregisterEndpoint(guid string) error {
	p.unregistered = append(p.unregistered, guid)
	return nil
}

// An autoscaler is registered for one Cloud Foundry. When that Cloud
// Foundry is unregistered, its autoscalers served nothing but stayed in
// the endpoint list.
func TestUnregisteringACloudFoundryUnregistersItsAutoscalers(t *testing.T) {
	proxy := &unregisterProxy{endpoints: []*api.CNSIRecord{
		autoscalerRec("as1", "lab autoscaler", "cf", "b1", ""),
		autoscalerRec("as2", "personal", "cf", "", "user-1"),
		autoscalerRec("as3", "other cf", "cf-2", "b1", ""),
		{GUID: "metrics", CNSIType: "metrics", Metadata: `{"cf_guid":"cf"}`},
	}}
	a := &Autoscaler{portalProxy: proxy}

	a.OnEndpointNotification(api.EndpointUnregisterAction, &api.CNSIRecord{GUID: "cf", CNSIType: "cf"})
	require.ElementsMatch(t, []string{"as1", "as2"}, proxy.unregistered)

	proxy.unregistered = nil
	a.OnEndpointNotification(api.EndpointRegisterAction, &api.CNSIRecord{GUID: "cf", CNSIType: "cf"})
	a.OnEndpointNotification(api.EndpointUnregisterAction, &api.CNSIRecord{GUID: "as1", CNSIType: EndpointType})
	require.Empty(t, proxy.unregistered, "only a Cloud Foundry unregister takes its autoscalers")
}

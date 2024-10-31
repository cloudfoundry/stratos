package kubernetes

import (
	"crypto/sha1"
	"encoding/base64"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	log "github.com/sirupsen/logrus"
)

type EndpointStore struct {
	portalProxy api.PortalProxy
	store       api.EndpointRepository
}

func (d *EndpointStore) List(encryptionKey []byte) ([]*api.CNSIRecord, error) {
	local, _, err := ListKubernetes()
	db, err := d.store.List(encryptionKey)

	merged := mergeEndpoints(db, local)
	return merged, err
}

func (d *EndpointStore) ListByUser(userGUID string) ([]*api.ConnectedEndpoint, error) {
	local, err := ListConnectedKubernetes()
	db, err := d.store.ListByUser(userGUID)

	merged := mergeConnectedEndpoints(db, local)
	return merged, err
}

func (d *EndpointStore) Find(guid string, encryptionKey []byte) (api.CNSIRecord, error) {
	local, _, err := ListKubernetes()
	if err == nil {
		for _, ep := range local {
			if ep.GUID == guid {
				return *ep, nil
			}
		}
	}

	return d.store.Find(guid, encryptionKey)
}

func (d *EndpointStore) FindByAPIEndpoint(endpoint string, encryptionKey []byte) (api.CNSIRecord, error) {
	return d.store.FindByAPIEndpoint(endpoint, encryptionKey)
}

func (d *EndpointStore) ListByAPIEndpoint(endpoint string, encryptionKey []byte) ([]*api.CNSIRecord, error) {
	local, _, err := ListKubernetes()
	db, err := d.store.ListByAPIEndpoint(endpoint, encryptionKey)
	merged := mergeEndpoints(db, local)
	return merged, err
}

func (d *EndpointStore) ListByCreator(userGUID string, encryptionKey []byte) ([]*api.CNSIRecord, error) {
	local, _, err := ListKubernetes()
	db, err := d.store.ListByCreator(userGUID, encryptionKey)
	merged := mergeEndpoints(db, local)
	return merged, err
}

func (d *EndpointStore) Delete(guid string) error {
	return d.store.Delete(guid)
}

func (d *EndpointStore) Save(guid string, cnsiRecord api.CNSIRecord, encryptionKey []byte) error {
	return d.store.Save(guid, cnsiRecord, encryptionKey)
}

func (d *EndpointStore) Update(endpoint api.CNSIRecord, encryptionKey []byte) error {
	return d.store.Update(endpoint, encryptionKey)
}

func (d *EndpointStore) UpdateMetadata(guid string, metadata string) error {
	return d.store.UpdateMetadata(guid, metadata)
}

func (d *EndpointStore) SaveOrUpdate(endpoint api.CNSIRecord, encryptionKey []byte) error {
	return d.store.SaveOrUpdate(endpoint, encryptionKey)
}

// Merge endpoints, over-riding any in first with those in second
func mergeEndpoints(first, second []*api.CNSIRecord) []*api.CNSIRecord {
	urls := make(map[string]bool, 0)
	for _, endpoint := range second {
		urls[endpoint.APIEndpoint.String()] = true
	}

	// Filter the first to remove entries in second
	merged := make([]*api.CNSIRecord, 0)
	for _, endpoint := range first {
		if _, ok := urls[endpoint.APIEndpoint.String()]; !ok {
			merged = append(merged, endpoint)
		} else {
			log.Debugf("Removed endpoint: %s", endpoint.APIEndpoint.String())
		}
	}

	merged = append(merged, second...)
	return merged
}

// Merge endpoints, over-riding any in first with those in second
func mergeConnectedEndpoints(first, second []*api.ConnectedEndpoint) []*api.ConnectedEndpoint {
	urls := make(map[string]bool, 0)
	for _, endpoint := range second {
		urls[endpoint.APIEndpoint.String()] = true
	}

	// Filter the first to ermove entries in second
	merged := make([]*api.ConnectedEndpoint, 0)
	for _, endpoint := range first {
		if _, ok := urls[endpoint.APIEndpoint.String()]; !ok {
			merged = append(merged, endpoint)
		} else {
			log.Debugf("Removed endpoint: %s", endpoint.APIEndpoint.String())
		}
	}

	merged = append(merged, second...)
	return merged
}

func getEndpointGUID(url string) string {
	h := sha1.New()
	h.Write([]byte(url))
	return base64.RawURLEncoding.EncodeToString(h.Sum(nil))
}

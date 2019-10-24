package userfavoritesendpoints

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/userfavorites/userfavoritesstore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
)

type userFavoriteEndpoints struct {
	portalProxy  api.PortalProxy
	endpointGUID string
}

type userEndpointFavorites interface {
	RemoveFavorites() error
}

func Constructor(portalProxy api.PortalProxy, endpointGUID string) userEndpointFavorites {
	ufe := &userFavoriteEndpoints{
		portalProxy:  portalProxy,
		endpointGUID: endpointGUID,
	}
	return ufe
}

// RemoveEndpointFavorites removes favorites form an endpoint using the given endpoint guid
func (ufe *userFavoriteEndpoints) RemoveFavorites() error {
	store, err := userfavoritesstore.NewFavoritesDBStore(ufe.portalProxy.GetDatabaseConnection())
	if err != nil {
		return err
	}

	err = store.DeleteFromEndpoint(ufe.endpointGUID)
	if err != nil {
		return err
	}
	return nil
}

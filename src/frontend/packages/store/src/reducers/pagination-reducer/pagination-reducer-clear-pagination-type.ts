import {
  applicationEntityType,
  cfUserEntityType,
  organizationEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  spaceEntityType,
  userProvidedServiceInstanceEntityType,
} from '../../../../cloud-foundry/src/cf-entity-factory';
import { EndpointAction } from '../../actions/endpoint.actions';
import { PaginationState } from '../../types/pagination.types';

export function paginationClearAllTypes(state: PaginationState, entityKeys: string[], defaultPaginationEntityState) {
  return entityKeys.reduce((prevState, entityKey) => {
    if (prevState[entityKey]) {
      const entityState = state[entityKey];
      const clearedEntity = Object.keys(entityState).reduce((prevEntityState, key) => {
        return {
          ...prevEntityState,
          [key]: defaultPaginationEntityState
        };
      }, entityState);
      return {
        ...prevState,
        [entityKey]: clearedEntity
      };
    }
    return prevState;
  }, state);
}

export function clearEndpointEntities(state: PaginationState, action: EndpointAction, defaultPaginationEntityState) {
  // TODO This should come from the entity catalogue
  if (action.endpointType === 'cf') {
    return paginationClearAllTypes(
      state,
      [
        applicationEntityType,
        spaceEntityType,
        organizationEntityType,
        serviceEntityType,
        cfUserEntityType,
        serviceInstancesEntityType,
        userProvidedServiceInstanceEntityType
      ],
      defaultPaginationEntityState
    );
  }

  // Check extensions
  // TODO Drive this from the catalogue
  // const entityKeys = getEndpointSchemeKeys(action.endpointType);
  // if (entityKeys.length > 0) {
  //   return paginationClearAllTypes(
  //     state,
  //     entityKeys,
  //     defaultPaginationEntityState
  //   );
  // }
  return state;
}

import { IServiceInstance } from '../../core/cf-api-svc.types';
import { DELETE_SERVICE_BINDING_ACTION_SUCCESS, DeleteServiceBinding } from '../actions/service-bindings.actions';
import { IRequestEntityTypeState } from '../app-state';
import { APIResource } from '../types/api.types';
import { APISuccessOrFailedAction } from '../types/request.types';
import { UpdateServiceInstance, UPDATE_SERVICE_INSTANCE_SUCCESS } from '../actions/service-instances.actions';

export function serviceInstanceReducer(state: IRequestEntityTypeState<APIResource<IServiceInstance>>, action: APISuccessOrFailedAction) {
  let serviceInstanceGuid, serviceInstanceEntity;
  switch (action.type) {
    case DELETE_SERVICE_BINDING_ACTION_SUCCESS:
      const castedAction = (action.apiAction as DeleteServiceBinding);
      serviceInstanceGuid = castedAction.serviceInstanceGuid;
      const serviceBindingGuid = castedAction.guid;
      serviceInstanceEntity = state[serviceInstanceGuid];
      return {
        ...state,
        [serviceInstanceGuid]: {
          ...serviceInstanceEntity,
          entity: {
            ...serviceInstanceEntity.entity,
            service_bindings: removeBinding(serviceInstanceEntity.entity.service_bindings, serviceBindingGuid)
          }
        }
      };
    case UPDATE_SERVICE_INSTANCE_SUCCESS:
      const updateServiceInstance = (action.apiAction as UpdateServiceInstance);
      const tags = updateServiceInstance.tags;
      const name = updateServiceInstance.name;
      const params = updateServiceInstance.params;
      serviceInstanceGuid = updateServiceInstance.guid;
      serviceInstanceEntity = state[serviceInstanceGuid];
      return {
        ...state,
        [serviceInstanceGuid]: {
          ...serviceInstanceEntity,
          entity: {
            ...serviceInstanceEntity.entity,
            name: name,
            tags: tags,
            params: params
          }
        }
      };
    default:
      return state;
  }
}

function removeBinding(bindings: any[], guid: string) {
  return bindings ? bindings.filter(b => b !== guid) : bindings;
}


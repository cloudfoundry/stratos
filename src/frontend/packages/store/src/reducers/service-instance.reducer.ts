import {
  DELETE_SERVICE_BINDING_ACTION_SUCCESS,
  CREATE_SERVICE_BINDING_ACTION_SUCCESS,
  DeleteServiceBinding,
  CreateServiceBinding
} from '../actions/service-bindings.actions';
import { IRequestEntityTypeState } from '../app-state';
import { APIResource } from '../types/api.types';
import { APISuccessOrFailedAction } from '../types/request.types';
import { UpdateServiceInstance, UPDATE_SERVICE_INSTANCE_SUCCESS } from '../actions/service-instances.actions';
import { IServiceInstance, IServiceBinding } from '../../../core/src/core/cf-api-svc.types';

export function serviceInstanceReducer(state: IRequestEntityTypeState<APIResource<IServiceInstance>>, action: APISuccessOrFailedAction) {
  let serviceInstanceGuid, serviceInstanceEntity, serviceBindingGuid;
  switch (action.type) {
    case DELETE_SERVICE_BINDING_ACTION_SUCCESS:
      const deleteServiceBindingAction = (action.apiAction as DeleteServiceBinding);
      serviceInstanceGuid = deleteServiceBindingAction.serviceInstanceGuid;
      serviceBindingGuid = deleteServiceBindingAction.guid;
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
    case CREATE_SERVICE_BINDING_ACTION_SUCCESS:
      const createServiceBindingAction = (action.apiAction as CreateServiceBinding);
      const newServiceBindingEntity = (action.response.entities.serviceBinding[action.response.result[0]] as APIResource<IServiceBinding>);
      serviceInstanceGuid = createServiceBindingAction.serviceInstanceGuid;
      serviceBindingGuid = newServiceBindingEntity.metadata.guid;
      serviceInstanceEntity = state[serviceInstanceGuid];
      return {
        ...state,
        [serviceInstanceGuid]: {
          ...serviceInstanceEntity,
          entity: {
            ...serviceInstanceEntity.entity,
            service_bindings: [].concat(serviceInstanceEntity.entity.service_bindings, serviceBindingGuid)
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

function addBinding(bindings: any[], guid: string) {
  return bindings ? bindings.filter(b => b !== guid) : bindings;
}


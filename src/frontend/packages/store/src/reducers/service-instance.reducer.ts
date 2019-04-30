import { IServiceBinding, IServiceInstance } from '../../../core/src/core/cf-api-svc.types';
import {
  CREATE_SERVICE_BINDING_ACTION_SUCCESS,
  CreateServiceBinding,
  DELETE_SERVICE_BINDING_ACTION_SUCCESS,
  DeleteServiceBinding,
} from '../actions/service-bindings.actions';
import { IRequestEntityTypeState } from '../app-state';
import { APIResource } from '../types/api.types';
import { APISuccessOrFailedAction } from '../types/request.types';

export function serviceInstanceReducer(state: IRequestEntityTypeState<APIResource<IServiceInstance>>, action: APISuccessOrFailedAction) {
  switch (action.type) {
    case DELETE_SERVICE_BINDING_ACTION_SUCCESS:
      return handleDelete(state, action.apiAction as DeleteServiceBinding);
    // case UPDATE_SERVICE_INSTANCE_SUCCESS:
    //   const updateServiceInstance = (action.apiAction as UpdateServiceInstance);
    //   const tags = updateServiceInstance.tags;
    //   const name = updateServiceInstance.name;
    //   const params = updateServiceInstance.params;
    //   serviceInstanceGuid = updateServiceInstance.guid;
    //   serviceInstanceEntity = state[serviceInstanceGuid];
    //   return {
    //     ...state,
    //     [serviceInstanceGuid]: {
    //       ...serviceInstanceEntity,
    //       entity: {
    //         ...serviceInstanceEntity.entity,
    //         name,
    //         tags,
    //         params
    //       }
    //     }
    //   };
    case CREATE_SERVICE_BINDING_ACTION_SUCCESS:
      return handleCreateBinding(state, action);
    default:
      return state;
  }
}

function handleCreateBinding(state: IRequestEntityTypeState<APIResource>, action: APISuccessOrFailedAction) {
  const bindingAction = action.apiAction as CreateServiceBinding;
  const newServiceBindingEntity = (action.response.entities.serviceBinding[action.response.result[0]] as APIResource<IServiceBinding>);
  const serviceInstanceGuid = bindingAction.serviceInstanceGuid;
  const serviceBindingGuid = newServiceBindingEntity.metadata.guid;
  const serviceInstanceEntity = state[serviceInstanceGuid];
  if (!serviceInstanceEntity) {
    return state;
  }
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
}

function handleDelete(state: IRequestEntityTypeState<APIResource>, action: DeleteServiceBinding) {
  const serviceInstanceGuid = action.serviceInstanceGuid;
  const serviceBindingGuid = action.guid;
  const serviceInstanceEntity = state[serviceInstanceGuid];
  if (!serviceInstanceEntity) {
    return state;
  }
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
}

function removeBinding(bindings: any[], guid: string) {
  return bindings ? bindings.filter(b => b !== guid) : bindings;
}

function addBinding(bindings: any[], guid: string) {
  return bindings ? bindings.filter(b => b !== guid) : bindings;
}


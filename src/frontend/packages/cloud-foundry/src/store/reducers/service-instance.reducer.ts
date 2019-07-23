import {
  CREATE_SERVICE_BINDING_ACTION_SUCCESS,
  CreateServiceBinding,
  DELETE_SERVICE_BINDING_ACTION_SUCCESS,
  DeleteServiceBinding,
} from '../../actions/service-bindings.actions';
import { serviceBindingEntityType } from '../../cf-entity-factory';
import { getCFEntityKey } from '../../cf-entity-helpers';
import { IServiceBinding, IServiceInstance, IUserProvidedServiceInstance } from '../../../../core/src/core/cf-api-svc.types';
import { IRequestEntityTypeState } from '../../../../store/src/app-state';
import { APIResource } from '../../../../store/src/types/api.types';
import { APISuccessOrFailedAction } from '../../../../store/src/types/request.types';

export function serviceInstanceReducer<T extends IServiceInstance | IUserProvidedServiceInstance = IServiceInstance>(
  state: IRequestEntityTypeState<APIResource<T>>,
  action: APISuccessOrFailedAction
): IRequestEntityTypeState<APIResource<T>> {
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
  const cfServiceBindingEntityKey = getCFEntityKey(serviceBindingEntityType);
  const newServiceBindingEntity = (
    action.response.entities[cfServiceBindingEntityKey][action.response.result[0]] as
    APIResource<IServiceBinding>);
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

// function addBinding(bindings: any[], guid: string) {
//   return bindings ? bindings.filter(b => b !== guid) : bindings;
// }


import type { IRequestEntityTypeState } from '../../../../store/src/app-state';
import type { APIResource } from '../../../../store/src/types/api.types';
import type { APISuccessOrFailedAction } from '../../../../store/src/types/request.types';
import {
  CREATE_SERVICE_BINDING_ACTION_SUCCESS,
  type CreateServiceBinding,
  DELETE_SERVICE_BINDING_ACTION_SUCCESS,
  type DeleteServiceBinding,
} from '../../actions/service-bindings.actions';
import type { IServiceBinding, IServiceInstance, IUserProvidedServiceInstance } from '../../cf-api-svc.types';
import { getCFEntityKey } from '../../cf-entity-helpers';
import { serviceBindingEntityType } from '../../cf-entity-types';

export function serviceInstanceReducer<T extends IServiceInstance | IUserProvidedServiceInstance = IServiceInstance>(
  state: IRequestEntityTypeState<APIResource<T>>,
  action: APISuccessOrFailedAction
): IRequestEntityTypeState<APIResource<T>> {
  switch (action.type) {
    case DELETE_SERVICE_BINDING_ACTION_SUCCESS:
      return handleDelete(state as IRequestEntityTypeState<APIResource>, action.apiAction as DeleteServiceBinding) as IRequestEntityTypeState<APIResource<T>>;
    case CREATE_SERVICE_BINDING_ACTION_SUCCESS:
      return handleCreateBinding(state as IRequestEntityTypeState<APIResource>, action) as IRequestEntityTypeState<APIResource<T>>;
    default:
      return state;
  }
}

function handleCreateBinding(state: IRequestEntityTypeState<APIResource>, action: APISuccessOrFailedAction) {
  const bindingAction = action.apiAction as CreateServiceBinding;
  const cfServiceBindingEntityKey = getCFEntityKey(serviceBindingEntityType);
  const response = action.response as { entities: { [key: string]: { [guid: string]: APIResource<IServiceBinding> } }, result: string[] };
  const newServiceBindingEntity = response.entities[cfServiceBindingEntityKey][response.result[0]] as APIResource<IServiceBinding>;
  const serviceInstanceGuid = bindingAction.serviceInstanceGuid;
  const serviceBindingGuid = newServiceBindingEntity.metadata.guid;
  const serviceInstanceEntity = state[serviceInstanceGuid] as APIResource<IServiceInstance | IUserProvidedServiceInstance>;
  if (!serviceInstanceEntity) {
    return state;
  }
  const entity = serviceInstanceEntity.entity as IServiceInstance | IUserProvidedServiceInstance;
  return {
    ...state,
    [serviceInstanceGuid]: {
      ...serviceInstanceEntity,
      entity: {
        ...entity,
        service_bindings: [].concat(entity.service_bindings as any, serviceBindingGuid)
      }
    }
  };
}

function handleDelete(state: IRequestEntityTypeState<APIResource>, action: DeleteServiceBinding) {
  const serviceInstanceGuid = action.serviceInstanceGuid;
  const serviceBindingGuid = action.guid;
  const serviceInstanceEntity = state[serviceInstanceGuid] as APIResource<IServiceInstance | IUserProvidedServiceInstance>;
  if (!serviceInstanceEntity) {
    return state;
  }
  const entity = serviceInstanceEntity.entity as IServiceInstance | IUserProvidedServiceInstance;
  return {
    ...state,
    [serviceInstanceGuid]: {
      ...serviceInstanceEntity,
      entity: {
        ...entity,
        service_bindings: removeBinding(entity.service_bindings as any as string[], serviceBindingGuid) as any
      }
    }
  };
}

function removeBinding(bindings: string[] | undefined, guid: string): string[] | undefined {
  return bindings ? bindings.filter(b => b !== guid) : bindings;
}

// function addBinding(bindings: any[], guid: string) {
//   return bindings ? bindings.filter(b => b !== guid) : bindings;
// }


import { IServiceInstance } from '../../core/cf-api-svc.types';
import { DELETE_SERVICE_BINDING_ACTION_SUCCESS, DeleteServiceBinding } from '../actions/service-bindings.actions';
import { IRequestEntityTypeState } from '../app-state';
import { APIResource } from '../types/api.types';
import { APISuccessOrFailedAction } from '../types/request.types';

export function serviceInstanceReducer(state: IRequestEntityTypeState<APIResource<IServiceInstance>>, action: APISuccessOrFailedAction) {
  switch (action.type) {
    case DELETE_SERVICE_BINDING_ACTION_SUCCESS:
      const castedAction = (action.apiAction as DeleteServiceBinding);
      const serviceInstanceGuid = castedAction.serviceInstanceGuid;
      const serviceBindingGuid = castedAction.guid;
      const serviceInstanceEntity = state[serviceInstanceGuid];
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
    default:
      return state;
  }
}

function removeBinding(bindings: any[], guid: string) {
  return bindings ? bindings.filter(b => b !== guid) : bindings;
}


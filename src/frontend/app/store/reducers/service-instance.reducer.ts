import { AppState, IRequestEntityTypeState } from '../app-state';
import { Action } from '@ngrx/store';
import { APIResource } from '../types/api.types';
import { RouteEvents, UnmapRoute } from '../actions/route.actions';
import { APISuccessOrFailedAction } from '../types/request.types';
import { IRoute } from '../../core/cf-api.types';
import { IServiceInstance, IServiceBinding } from '../../core/cf-api-svc.types';
import { DELETE_SERVICE_BINDING_ACTION_SUCCESS, DeleteServiceBinding } from '../actions/service-bindings.actions';
import { DELETE_SERVICE_BINDING, DeleteServiceInstanceBinding } from '../actions/service-instances.actions';

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


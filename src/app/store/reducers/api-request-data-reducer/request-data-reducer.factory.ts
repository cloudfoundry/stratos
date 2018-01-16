import { ApplicationData } from './../../../features/applications/application.service';
import { APIResource } from './../../types/api.types';
import { IRequestEntityTypeState } from './../../app-state';
import { DISCONNECT_CNSIS, UNREGISTER_CNSIS, DisconnectCnis } from './../../actions/cnsis.actions';
import { IRequestArray } from '../api-request-reducer/types';
import { generateDefaultState } from '../api-request-reducer/request-helpers';
import { ISuccessRequestAction } from '../../types/request.types';
import { mergeState } from '../../helpers/reducer.helper';
import { Action } from '@ngrx/store';

export function requestDataReducerFactory(entityList = [], actions: IRequestArray) {
  const [startAction, successAction, failedAction] = actions;
  const defaultState = generateDefaultState(entityList);
  return function entitiesReducer(state = defaultState, action: Action) {
    switch (action.type) {
      case DISCONNECT_CNSIS:
      case UNREGISTER_CNSIS:
        const cnisAction = action as DisconnectCnis;
        return deletionApplicationFromEndpoint(state, cnisAction.guid);
      case successAction:
        const success = action as ISuccessRequestAction;
        if (success.requestType === 'delete') {
          return deleteEntity(state, success.apiAction.entityKey, success.apiAction.guid);
        } else if (success.response) {
          return mergeState(state, success.response.entities);
        }
        return state;
      default:
        return state;
    }
  };
}

function deleteEntity(state, entityKey, guid) {
  const newState = {};
  for (const entityTypeKey in state) {
    if (entityTypeKey === entityKey) {
      newState[entityTypeKey] = {};
      for (const entityGuid in state[entityTypeKey]) {
        if (entityGuid !== guid) {
          newState[entityTypeKey][entityGuid] = state[entityTypeKey][entityGuid];
        }
      }
    } else {
      newState[entityTypeKey] = state[entityTypeKey];
    }
  }
  return newState;
}
// There may be a better place to put this.
function deletionApplicationFromEndpoint(state: IRequestEntityTypeState<APIResource>, endpointGuid) {
  const entityKey = 'application';
  const oldApplications = Object.values(state[entityKey]);
  const application = {};
  oldApplications.forEach(app => {
    if (app.cfGuid !== endpointGuid) {
      application[app.guid] = app;
    }
  });
  return {
    ...state,
    application
  };
}

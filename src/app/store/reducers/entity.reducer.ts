import { RequestMethod } from '@angular/http';

import { ApiActionTypes, WrapperAPIActionSuccess } from './../actions/api.actions';
import { mergeState } from './../helpers/reducer.helper';

export interface EntitiesState {
  application: any;
  stack: any;
  space: any;
  organization: any;
  route: any;
  event: any;
}

export const defaultEntitiesState = {
  application: {},
  stack: {},
  space: {},
  organization: {},
  route: {},
  event: {}
};

export function entitiesReducer(state: EntitiesState = defaultEntitiesState, action: WrapperAPIActionSuccess) {

  switch (action.apiType) {
    case ApiActionTypes.API_REQUEST_SUCCESS:
      if (action.apiAction.options.method === 'delete' || action.apiAction.options.method === RequestMethod.Delete) {
        const newState = { ...state };
        delete newState[action.apiAction.entityKey][action.apiAction.guid];
        return newState;
      }
      if (action.apiAction.entityMerge) {
        action.response.entities = action.apiAction.entityMerge(state, action.response.entities);
      }
      return mergeState(state, action.response.entities);
    default:
      return state;
  }
}


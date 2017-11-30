import { WrapperCFActionSuccess } from '../types/request.types';
import { EntitiesState } from '../types/entity.types';
import { RequestMethod } from '@angular/http';

import { ApiActionTypes } from './../actions/request.actions';
import { mergeState } from './../helpers/reducer.helper';


export const defaultEntitiesState = {
  application: {},
  stack: {},
  space: {},
  organization: {},
  route: {},
  event: {}
};

export function entitiesReducer(state: EntitiesState = defaultEntitiesState, action: WrapperCFActionSuccess) {
  const type = action.apiAction ? action.apiAction.type : action.type;
  switch (type) {
    case ApiActionTypes.API_REQUEST_SUCCESS:
      if (action.requestType === 'delete') {
        const newState = { ...state };
        delete newState[action.apiAction.entityKey][action.apiAction.guid];
        return newState;
      }
      return mergeState(state, action.response.entities);
    default:
      return state;
  }
}


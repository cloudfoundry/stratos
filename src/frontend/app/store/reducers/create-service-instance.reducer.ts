
import { CreateServiceInstanceState } from '../types/create-service-instance.types';
import { SET_SERVICE_PLAN, SET_ORG, SET_SPACE, SET_CREATE_SERVICE_INSTANCE } from '../actions/create-service-instance.actions';

const defaultState: CreateServiceInstanceState = {
  name: '',
  servicePlanGuid: '',
  spaceGuid: '',
  orgGuid: ''
};


export function createServiceInstanceReducer(state: CreateServiceInstanceState = defaultState, action) {
  switch (action.type) {
    case SET_SERVICE_PLAN:
      return {
        ...state, servicePlanGuid: action.servicePlanGuid
      };
    case SET_ORG:
      return {
        ...state, orgGuid: action.orgGuid
      };
    case SET_SPACE:
      return {
        ...state, spaceGuid: action.spaceGuid
      };
    case SET_CREATE_SERVICE_INSTANCE:
      return {
        ...state,
        spaceGuid: action.spaceGuid,
        name: action.name,
        params: action.jsonParams,
        tags: action.tags
      };
    default:
      return state;
  }
}

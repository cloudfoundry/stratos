import {
  SET_CREATE_SERVICE_INSTANCE,
  SET_ORG,
  SET_SERVICE_INSTANCE_GUID,
  SET_SERVICE_PLAN,
  SET_SPACE,
} from '../actions/create-service-instance.actions';
import { CreateServiceInstanceState } from '../types/create-service-instance.types';


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
    case SET_SERVICE_INSTANCE_GUID:
      return {
        ...state, serviceInstanceGuid: action.guid
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

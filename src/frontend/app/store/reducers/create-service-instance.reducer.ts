import {
  SET_CREATE_SERVICE_INSTANCE,
  SET_ORG,
  SET_SERVICE_INSTANCE_GUID,
  SET_SERVICE_PLAN,
  SET_SPACE,
  SET_SERVICE_INSTANCE_SPACE_SCOPED,
} from '../actions/create-service-instance.actions';
import { CreateServiceInstanceState } from '../types/create-service-instance.types';


const defaultState: CreateServiceInstanceState = {
  name: '',
  servicePlanGuid: '',
  spaceGuid: '',
  orgGuid: '',
  spaceScoped: false
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
    case SET_SERVICE_INSTANCE_SPACE_SCOPED:
      return setSpaceScopedFlag(state, action);
    case SET_CREATE_SERVICE_INSTANCE:
      return setCreateServiceInstance(state, action);
    default:
      return state;
  }
}

const setCreateServiceInstance = (state: CreateServiceInstanceState, action) => ({
  ...state,
  spaceScoped: action.spaceScoped,
  spaceGuid: action.spaceGuid,
  name: action.name, params:
  action.jsonParams,
  tags: action.tags
});

const setSpaceScopedFlag = (state: CreateServiceInstanceState, action) => ({
  ...state,
  spaceScoped: action.spaceScoped,
  spaceGuid: action.spaceGuid
});

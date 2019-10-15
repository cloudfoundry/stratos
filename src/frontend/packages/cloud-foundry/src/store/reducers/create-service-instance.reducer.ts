import {
  SET_CREATE_SERVICE_INSTANCE,
  SET_ORG,
  SET_SERVICE_INSTANCE_GUID,
  SET_SERVICE_INSTANCE_SPACE_SCOPED,
  SET_SERVICE_PLAN,
  SET_SPACE,
  SET_CREATE_SERVICE_INSTANC_CF_DETAILS,
  SET_SERVICE_INSTANCE_SVC_GUID,
  SET_SERVICE_INSTANCE_APP,
  RESET_CREATE_SERVICE_INSTANCE_STATE,
  RESET_CREATE_SERVICE_INSTANCE_STATE_ORG_SPACE,
  SetCreateServiceInstanceApp,
} from '../../actions/create-service-instance.actions';
import { CreateServiceInstanceState } from '../types/create-service-instance.types';


const defaultState: CreateServiceInstanceState = {
  name: '',
  servicePlanGuid: '',
  spaceGuid: '',
  orgGuid: '',
  spaceScoped: false
};

const setCreateServiceInstanceCfDetails = (state: CreateServiceInstanceState, action) => ({
  ...state,
  spaceGuid: action.spaceGuid,
  cfGuid: action.cfGuid,
  orgGuid: action.orgGuid,
});
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

export function createServiceInstanceReducer(state: CreateServiceInstanceState = defaultState, action): CreateServiceInstanceState {
  switch (action.type) {
    case SET_SERVICE_PLAN:
      return { ...state, servicePlanGuid: action.servicePlanGuid };
    case SET_ORG:
      return { ...state, orgGuid: action.orgGuid };
    case SET_SPACE:
      return { ...state, spaceGuid: action.spaceGuid };
    case SET_SERVICE_INSTANCE_SVC_GUID:
      return { ...state, serviceGuid: action.serviceGuid, servicePlanGuid: null };
    case SET_SERVICE_INSTANCE_GUID:
      return { ...state, serviceInstanceGuid: action.guid };
    case SET_SERVICE_INSTANCE_APP:
      const scsia: SetCreateServiceInstanceApp = action as SetCreateServiceInstanceApp;
      return { ...state, bindAppGuid: scsia.appGuid, bindAppParams: scsia.params };
    case SET_SERVICE_INSTANCE_SPACE_SCOPED:
      return setSpaceScopedFlag(state, action);
    case SET_CREATE_SERVICE_INSTANCE:
      return setCreateServiceInstance(state, action);
    case SET_CREATE_SERVICE_INSTANC_CF_DETAILS:
      return setCreateServiceInstanceCfDetails(state, action);
    case RESET_CREATE_SERVICE_INSTANCE_STATE:
      return defaultState;
    case RESET_CREATE_SERVICE_INSTANCE_STATE_ORG_SPACE:
      return {
        ...state,
        spaceGuid: null,
        orgGuid: null
      };
    default:
      return state;
  }
}


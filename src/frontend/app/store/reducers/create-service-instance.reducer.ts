
import { CreateServiceInstanceState } from "../types/create-service-instance.types";
import { SET_SERVICE_PLAN } from "../actions/create-service-instance.actions";

const defaultState: CreateServiceInstanceState = {
  name: '',
  servicePlanGuid: '',
  spaceGuid: ''
};


export function createServiceInstanceReducer(state: CreateServiceInstanceState = defaultState, action) {
  switch (action.type) {

    case SET_SERVICE_PLAN:
      return {
        ...state, servicePlanGuid: action.servicePlanGuid
      }
    default:
      return state;
  }
}

import { UPDATE_APP_AUTOSCALER_POLICY_STEP } from '../actions/app-autoscaler.actions';
import { UpdateAutoscalerPolicyState } from '../types/app-autoscaler.types';

const defaultState: UpdateAutoscalerPolicyState = {
  policy: {
    instance_min_count: 1,
    instance_max_count: 10,
    scaling_rules_form: [],
    schedules: {}
  }
};

export function updateAutoscalerPolicyReducer(state: UpdateAutoscalerPolicyState = defaultState, action) {
  switch (action.type) {
    case UPDATE_APP_AUTOSCALER_POLICY_STEP:
      return { ...state, policy: action.policy };
    default:
      return state;
  }
}

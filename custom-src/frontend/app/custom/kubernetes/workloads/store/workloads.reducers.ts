import { UPDATE_HELM_RELEASE_STATUS } from './workloads.actions';

const defaultState = {};

export function helmReleaseReducer(state: any = defaultState, action) {
  switch (action.type) {
    case UPDATE_HELM_RELEASE_STATUS:
      return {
        ...state,
      };
  }
}

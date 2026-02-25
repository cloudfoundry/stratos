import { UPDATE_HELM_RELEASE } from './workloads.actions';

const defaultState: Record<string, unknown> = {};

export function helmReleaseReducer(state = defaultState, action: { type: string }): Record<string, unknown> {
  switch (action.type) {
    case UPDATE_HELM_RELEASE:
      return {
        ...state,
      };

  }
}

import { UPDATE_SUCCESS, UpdateExistingApplication } from '../actions/application.actions';
import { IRequestEntityTypeState } from '../app-state';
import { RequestInfoState } from './api-request-reducer/types';

export function appStatsReducer(state: IRequestEntityTypeState<RequestInfoState>, action) {
  switch (action.type) {
    case UPDATE_SUCCESS:
      const updateAction: UpdateExistingApplication = action.apiAction;
      return markAppStatsAsDeleted(state, updateAction);
    default:
      return state;
  }
}

function markAppStatsAsDeleted(state: IRequestEntityTypeState<RequestInfoState>, action: UpdateExistingApplication) {
  if (!action.newApplication || action.newApplication.state !== 'STOPPED' || !action.existingApplication) {
    return state;
  }
  const newState = { ...state };
  const instances = action.existingApplication.instances || 0;
  for (let i = 0; i < instances; i++) {
    const appStat = newState[action.guid + '-' + i];
    if (!appStat) {
      continue;
    }
    const newAppStat = {
      ...appStat,
      deleting: {
        ...appStat.deleting,
        deleted: true,
      }
    };
    newState[action.guid + '-' + i] = newAppStat;
  }
  return newState;
}

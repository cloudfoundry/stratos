import { UPDATE_SUCCESS, UpdateExistingApplication } from '../../actions/application.actions';
import { IRequestEntityTypeState } from '../../../../store/src/app-state';
import { RequestInfoState } from '../../../../store/src/reducers/api-request-reducer/types';

export function appStatsReducer(state: IRequestEntityTypeState<RequestInfoState>, action) {
  switch (action.type) {
    case UPDATE_SUCCESS:
      const updateAction: UpdateExistingApplication = action.apiAction;
      return markAppStatsAsDeleted(state, updateAction);
    default:
      return state;
  }
}

function deleteAppStat(newState, key) {
  const state = newState[key];
  if (!state) {
    return;
  }
  newState[key] = {
    ...state,
    deleting: {
      ...state.deleting,
      deleted: true,
    }
  };
}

function markAppStatsAsDeleted(state: IRequestEntityTypeState<RequestInfoState>, action: UpdateExistingApplication) {
  // Only interest if we have the old and new app and either the app has been stopped or now contains zero instances
  if (!action.newApplication || !action.existingApplication) {
    return state;
  }
  if (action.newApplication.state !== 'STOPPED' && action.newApplication.instances !== 0) {
    return state;
  }
  const newState = { ...state };
  // Delete root stat
  deleteAppStat(newState, action.guid);
  // Delete each instance stat
  const instances = action.existingApplication.instances || 0;
  for (let i = 0; i < instances; i++) {
    deleteAppStat(newState, action.guid + '-' + i);
  }
  return newState;
}

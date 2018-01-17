import { APIResource } from '../types/api.types';
import { IRequestEntityTypeState } from '../app-state';
import { DISCONNECT_CNSIS_SUCCESS, DisconnectCnis, UNREGISTER_CNSIS } from '../actions/cnsis.actions';
export function endpointDisconnectApplicationReducer(state: APIResource, action: DisconnectCnis) {
  switch (action.type) {
    case DISCONNECT_CNSIS_SUCCESS:
    case UNREGISTER_CNSIS:
      return deletionApplicationFromEndpoint(state, action);
  }
  return state;
}

function deletionApplicationFromEndpoint(state: APIResource, endpointGuid) {
  const entityKey = 'application';
  const oldApplications = Object.values(state);
  const application = {};
  oldApplications.forEach(app => {
    if (app.cfGuid !== endpointGuid && app.guid) {
      application[app.guid] = app;
    }
  });
  return {
    ...state,
    application
  };
}



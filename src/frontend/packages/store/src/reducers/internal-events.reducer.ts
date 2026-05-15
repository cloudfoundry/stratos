import { Action } from '@ngrx/store';

import { SendClearEndpointEventsAction, SendClearEventAction, SendEventAction } from '../actions/internal-events.actions';
import { endpointEntityType } from '../helpers/stratos-entity-factory';
import {
  CLEAR_ENDPOINT_ERROR_EVENTS,
  CLEAR_EVENTS,
  GLOBAL_EVENT,
  InternalEventsState,
  InternalEventState,
  SEND_EVENT,
} from '../types/internal-events.types';

const defaultState: InternalEventsState = {
  types: {
    [GLOBAL_EVENT]: {},
    [endpointEntityType]: {}
  }
};

export function internalEventReducer(state: InternalEventsState = defaultState, action: Action) {
  switch (action.type) {
    case SEND_EVENT: {
      const sendAction = action as SendEventAction;
      const { eventSubjectId, eventType, eventState } = sendAction;
      return setSubjectEvents(state, eventSubjectId, eventType, [
        eventState,
        ...getEvents(state, eventSubjectId, eventType)
      ]);
    }
    case CLEAR_EVENTS: {
      return clearEvents(state, action as SendClearEventAction);
    }
    case CLEAR_ENDPOINT_ERROR_EVENTS: {
      // Wave 4 part 1 (W36-B): EndpointDisconnectCleanupService dispatches
      // SendClearEndpointEventsAction in response to disconnect / connect /
      // (Wave 5: register / update) signal events. The legacy direct
      // listeners on `*_ENDPOINTS_SUCCESS` / `UPDATE_ENDPOINT_SUCCESS`
      // collapsed into this single path.
      const clearEndpointAction = action as SendClearEndpointEventsAction;
      return clearEndpointEvents(state, clearEndpointAction.endpointGuid);
    }
  }
  return state;
}

function getEvents(state: InternalEventsState, eventSubjectId: string, eventType: string) {
  const eventTypeState = state.types[eventType] || {};
  return eventTypeState[eventSubjectId] || [];
}

function setSubjectEvents(state: InternalEventsState, eventSubjectId: string, eventType: string, events: InternalEventState[]) {
  const newState = {
    ...state
  };
  const type = {
    ...newState.types[eventType],
    [eventSubjectId]: events
  };
  newState.types = { ...newState.types, [eventType]: type };
  return newState;
}

function clearEndpointEvents(state: InternalEventsState, endpointGuid: string): InternalEventsState {
  if (state.types.endpoint[endpointGuid]) {
    const {
      [endpointGuid]: cleared,
      ...endpoint
    } = state.types.endpoint;
    return {
      ...state,
      types: {
        ...state.types,
        endpoint
      }
    };
  } else {
    return state;
  }
}

function clearEvents(state: InternalEventsState, clearAction: SendClearEventAction) {
  const { eventSubjectId, eventType, params } = clearAction;
  if (params.endpointGuid) {

  }
  const events = getEvents(state, eventSubjectId, eventType);
  const filteredEvents = clearAction.params.clean ? [] : events.filter((event: InternalEventState) => {
    if (params.timestamp) {
      return params.timestamp < event.timestamp;
    }
    if (params.eventCode) {
      return params.eventCode !== event.eventCode;
    }
    return true;
  });
  return setSubjectEvents(
    state,
    eventSubjectId,
    eventType,
    filteredEvents
  );
}

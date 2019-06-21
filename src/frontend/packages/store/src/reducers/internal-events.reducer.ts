import { Action } from '@ngrx/store';

import { SendClearEventAction, SendEventAction } from '../actions/internal-events.actions';
import {
  CLEAR_EVENTS,
  GLOBAL_EVENT,
  InternalEventsState,
  InternalEventState,
  SEND_EVENT,
} from '../types/internal-events.types';
import { endpointSchemaKey } from './../helpers/entity-factory';

const defaultState: InternalEventsState = {
  types: {
    [GLOBAL_EVENT]: {},
    [endpointSchemaKey]: {}
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

function clearEvents(state: InternalEventsState, clearAction: SendClearEventAction) {
  const { eventSubjectId, eventType, params } = clearAction;
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

import { applicationSchemaKey, endpointSchemaKey } from './../helpers/entity-factory';
import { AppState } from '../app-state';
import { Action } from '@ngrx/store';
import { LoggerAction, LoggerDebugAction } from '../actions/log.actions';
import {
  SEND_EVENT,
  InternalEventsState,
  GLOBAL_EVENT,
  InternalEventTypeState,
  InternalEventSubjectStatus,
  InternalEventServerity,
  CLEAR_EVENTS,
  InternalEventState
} from '../types/internal-events.types';
import { SendEventAction, SendClearEventAction } from '../actions/internal-events.actions';

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
      const { message, eventCode, timestamp, serverity, eventSubjectId, eventType } = sendAction;
      return setSubjectEvents(state, eventSubjectId, eventType, [
        {
          message,
          eventCode,
          timestamp,
          serverity
        },
        ...getEvents(state, eventSubjectId, eventType)
      ]);
    }
    case CLEAR_EVENTS: {
      const clearAction = action as SendClearEventAction;
      const { eventSubjectId, eventType, params } = clearAction;
      const events = getEvents(state, eventSubjectId, eventType);
      const filteredEvents = events.filter((event: InternalEventState) => {
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

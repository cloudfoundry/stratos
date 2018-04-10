import { applicationSchemaKey, endpointSchemaKey } from './../helpers/entity-factory';
import { AppState } from '../app-state';
import { Action } from '@ngrx/store';
import { LoggerAction, LoggerDebugAction } from '../actions/log.actions';
import { SEND_EVENT, InternalEventsState, GLOBAL_EVENT } from '../types/internal-events.types';
import { SendEventAction } from '../actions/internal-events.actions';

const defaultState: InternalEventsState = {
  types: {
    [GLOBAL_EVENT]: {},
    [endpointSchemaKey]: {}
  }
};

export function internalEventReducer(state: InternalEventsState = defaultState, action: SendEventAction) {
  if (action.type === SEND_EVENT) {
    const { message, eventCode, timeStamp } = action;
    const newState = {
      ...state
    };
    const type = {
      ...(newState.types[action.eventType] || {})
    };

    if (!type[action.eventKey]) {
      type[action.eventKey] = [];
    }
    type[action.eventKey].push({
      message,
      eventCode,
      timeStamp
    });

    newState.types = { ...newState.types, [action.eventType]: type };
    return newState;
  }
  return state;
}

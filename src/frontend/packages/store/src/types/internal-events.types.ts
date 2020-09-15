export const GLOBAL_EVENT = 'global';

export const SEND_EVENT = '[Internal Event] Send';

export const CLEAR_EVENTS = '[Internal Event] Clear';

export const CLEAR_ENDPOINT_ERROR_EVENTS = '[Internal Event] Clear Endpoint Errors';

export interface InternalEventState<T = {
  [key: string]: any;
}> {
  message?: string;
  timestamp?: number;
  eventCode: string;
  severity: InternalEventSeverity;
  metadata: T;
}

export interface InternalEventStateMetadata {
  httpMethod: string;
  errorResponse: any;
  url: string;
}

export interface APIEventState extends InternalEventState {
  metadata: {
    url: string;
  };
}


export interface InternalEventSubjectState {
  [eventSubjectId: string]: InternalEventState[];
}

export interface InternalEventTypeState {
  endpoint: InternalEventSubjectState;
  global: InternalEventSubjectState;
  [type: string]: InternalEventSubjectState;
}

export interface InternalEventsState {
  types: InternalEventTypeState;
}

export enum InternalEventSeverity {
  ERROR = 'INTERNAL_EVENT_ERROR',
  WARNING = 'INTERNAL_EVENT_WARNING',
  INFO = 'INTERNAL_EVENT_INFO',
  // Shouldn't be shown in the UI.
  SYSTEM = 'INTERNAL_EVENT_SYSTEM'
}

export enum InternalEventSubjectStatus {
  OK = 'INTERNAL_SUBJECT_OK',
  NO_OK = 'INTERNAL_SUBJECT_NOT_OK'
}

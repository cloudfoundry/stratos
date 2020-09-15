import { Action } from '@ngrx/store';
import moment from 'moment';

import {
  CLEAR_ENDPOINT_ERROR_EVENTS,
  CLEAR_EVENTS,
  InternalEventSeverity,
  InternalEventState,
  InternalEventStateMetadata,
  SEND_EVENT,
} from '../types/internal-events.types';

export class SendEventAction<T = InternalEventStateMetadata> implements Action {
  public type = SEND_EVENT;
  public timestamp: number;
  constructor(
    public eventType: string,
    public eventSubjectId: string,
    public eventState: InternalEventState<T>
  ) {
    eventState.timestamp = moment.now();
    if (!eventState.severity) {
      eventState.severity = InternalEventSeverity.SYSTEM;
    }
  }
}

export class SendClearEventAction implements Action {
  public type = CLEAR_EVENTS;
  constructor(
    public eventType: string,
    public eventSubjectId: string,
    public params: {
      timestamp?: number,
      eventCode?: string,
      endpointGuid?: string
      clean: boolean
    }
  ) {
    const { timestamp, eventCode, endpointGuid, clean } = params;
    if (!timestamp && !eventCode && !endpointGuid && !clean) {
      throw new Error('Either a timestamp or event code is needed to clear events');
    }
  }
}

export class SendClearEndpointEventsAction implements Action {
  public type = CLEAR_ENDPOINT_ERROR_EVENTS;
  constructor(
    public endpointGuid: string
  ) { }
}

import { Action } from '@ngrx/store';
import * as moment from 'moment';

import { SEND_EVENT, InternalEventSeverity, CLEAR_EVENTS, InternalEventState } from '../types/internal-events.types';

export class SendEventAction implements Action {
  public type = SEND_EVENT;
  public timestamp: number;
  constructor(
    public eventType: string,
    public eventSubjectId: string,
    public eventState: InternalEventState
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
      clean: boolean
    }
  ) {
    const { timestamp, eventCode, clean } = params;
    if (!timestamp && !eventCode && !clean) {
      throw new Error('Either a timestamp or event code is needed to clear events');
    }
  }
}

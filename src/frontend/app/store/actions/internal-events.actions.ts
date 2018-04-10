import { Action } from '@ngrx/store';
import * as moment from 'moment';

import { SEND_EVENT, InternalEventServerity, CLEAR_EVENTS } from '../types/internal-events.types';

export class SendEventAction implements Action {
    public type = SEND_EVENT;
    public timestamp: number;
    constructor(
        public eventType: string,
        public eventSubjectId: string,
        public message: string,
        public eventCode: string = eventSubjectId,
        public serverity: InternalEventServerity = InternalEventServerity.INFO
    ) {
        this.timestamp = moment.now();
    }
}

export class SendClearEventAction implements Action {
    public type = CLEAR_EVENTS;
    constructor(
        public eventType: string,
        public eventSubjectId: string,
        public params: {
            timestamp?: number,
            eventCode?: string
        }

    ) {
        const { timestamp, eventCode } = params;
        if (!timestamp && !eventCode) {
            throw new Error('Either a timestamp or event code is needed to clear events');
        }
    }
}

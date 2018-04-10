import { Action } from '@ngrx/store';
import * as moment from 'moment';

import { SEND_EVENT } from '../types/internal-events.types';

export class SendEventAction implements Action {
    public type = SEND_EVENT;
    public timeStamp: number;
    constructor(public eventType: string, public eventKey: string, public message: string, public eventCode?: string) {
        if (!eventCode) {
            eventCode = eventKey;
        }
        this.timeStamp = moment.now();
    }
}

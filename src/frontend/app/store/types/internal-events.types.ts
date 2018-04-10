export const GLOBAL_EVENT = 'global';

export const SEND_EVENT = '[Internal Event] Send';

export interface InternalEventState {
    message: string;
    timeStamp: number;
    eventCode: string | number;
}

export interface InternalEventTypeState {
    [type: string]: {
        [eventKey: string]: InternalEventState[]
    };
}

export interface InternalEventsState {
    types: InternalEventTypeState;
}

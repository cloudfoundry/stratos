export const GLOBAL_EVENT = 'global';

export const SEND_EVENT = '[Internal Event] Send';

export interface InternalEventState {
    message: string;
    timeStamp: number;
    eventCode: string | number;
}

export interface InternalEventsState {
    types: {
        [type: string]: {
            [eventKey: string]: InternalEventState[]
        }
    };
}

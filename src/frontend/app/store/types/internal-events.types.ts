export const GLOBAL_EVENT = 'global';

export const SEND_EVENT = '[Internal Event] Send';

export const CLEAR_EVENTS = '[Internal Event] Clear';

export interface InternalEventState {
    message: string;
    timestamp: number;
    eventCode: string | number;
    serverity: InternalEventServerity;
}

export interface InternalEventSubjectState {
    [eventSubjectId: string]: InternalEventState[];
}

export interface InternalEventTypeState {
    [type: string]: InternalEventSubjectState;
}

export interface InternalEventsState {
    types: InternalEventTypeState;
}

export enum InternalEventServerity {
    ERROR = 'INTERNAL_EVENT_ERROR',
    WARNING = 'INTERNAL_EVENT_WARNING',
    INFO = 'INTERNAL_EVENT_INFO'
}

export enum InternalEventSubjectStatus {
    OK = 'INTERNAL_SUBJECT_OK',
    NO_OK = 'INTERNAL_SUBJECT_NOT_OK'
}

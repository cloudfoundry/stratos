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

export enum InternalEventSeverity {
  ERROR = 'INTERNAL_EVENT_ERROR',
  WARNING = 'INTERNAL_EVENT_WARNING',
  INFO = 'INTERNAL_EVENT_INFO',
  // Shouldn't be shown in the UI.
  SYSTEM = 'INTERNAL_EVENT_SYSTEM'
}

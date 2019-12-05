import { LogItem } from '../../../applications/application/application-tabs-base/tabs/log-stream-tab/log-stream-tab.component';

export interface CounterEvent {
  name: string;
  delta: number;
  total: number;
}

export interface ContainerMetric {
  applicationId: string;
  instanceIndex: number;
  cpuPercentage: number;
  memoryBytes: number;
  diskBytes: number;
}

export interface ValueMetric {
  value: number;
  unit: string;
  name: string;
}

export interface HttpStartStop {
  method: number;
  peerType: number;
  uri: string;
  statusCode: number;
  contentLength: number;
  userAgent: string;
  remoteAddress: string;
}

// Methods for HttpStartStop Events
export const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'HEAD',
  'ACL',
  'BASELINE_CONTROL',
  'BIND',
  'CHECKIN',
  'CHECKOUT',
  'CONNECT',
  'COPY',
  'DEBUG',
  'LABEL',
  'LINK',
  'LOCK',
  'MERGE',
  'MKACTIVITY',
  'MKCALENDAR',
  'MKCOL',
  'MKREDIRECTREF',
  'MKWORKSPACE',
  'MOVE',
  'OPTIONS',
  'ORDERPATCH',
  'PATCH',
  'PRI',
  'PROPFIND',
  'PROPPATCH',
  'REBIND',
  'REPORT',
  'SEARCH',
  'SHOWMETHOD',
  'SPACEJUMP',
  'TEXTSEARCH',
  'TRACE',
  'TRACK',
  'UNBIND',
  'UNCHECKOUT',
  'UNLINK',
  'UNLOCK',
  'UPDATE',
  'UPDATEREDIRECTREF',
  'VERSION_CONTROL'
];

export interface Error {
  source: string;
  code: number;
  message: string;
}
export interface FireHoseItem {
  origin: string;
  eventType: number;
  deployment: string;
  timestamp: number;
  job: string;
  ip: string;
  counterEvent?: CounterEvent;
  logMessage?: LogItem;
  containerMetric?: ContainerMetric;
  valueMetric?: ValueMetric;
  httpStartStop?: HttpStartStop;
  error?: Error;
}

import { Action } from '@ngrx/store';

export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR
}

export const LoggerActionTypes = {
  DEBUG: '[LOG] Debug',
  INFO: '[LOG] Info',
  WARN: '[LOG] Warn',
  ERROR: '[LOG] Error',
};

export class LoggerAction implements Action {
  constructor(
    public logLevel: LogLevel = LogLevel.INFO,
    public message: string,
    public type: string
  ) {
  }
}

export class LoggerDebugAction implements LoggerAction {
  constructor(
    public message: string
  ) {
  }
  logLevel = LogLevel.DEBUG;
  type = LoggerActionTypes.DEBUG;
}

export class LoggerInfoAction implements LoggerAction {
  constructor(
    public message: string
  ) {
  }
  logLevel = LogLevel.INFO;
  type = LoggerActionTypes.INFO;
}

export class LoggerWarnAction implements LoggerAction {
  constructor(
    public message: string
  ) {
  }
  logLevel = LogLevel.WARN;
  type = LoggerActionTypes.WARN;
}

export class LoggerErrorAction implements LoggerAction {
  constructor(
    public message: string
  ) {
  }
  logLevel = LogLevel.ERROR;
  type = LoggerActionTypes.ERROR;
}

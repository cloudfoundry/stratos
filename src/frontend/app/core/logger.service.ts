import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { LoggerInfoAction, LoggerDebugAction, LoggerWarnAction, LoggerErrorAction, LogLevel } from '../store/actions/log.actions';
import { environment } from '../../environments/environment';

export enum LogLevelStringToNumber {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

@Injectable()
export class LoggerService {

  constructor(private store: Store<AppState>) { }

  debug(message: string, arg?: any) {
    if (LogLevelStringToNumber[LogLevel.DEBUG] >= LogLevelStringToNumber[environment.logLevel]) {
      this.store.dispatch(new LoggerDebugAction(message));
      if (environment.logToConsole) {
        // tslint:disable-next-line:no-console
        console.debug(message, arg);
      }
    }
  }

  info(message: string, arg?: any) {
    if (LogLevelStringToNumber[LogLevel.INFO] >= LogLevelStringToNumber[environment.logLevel]) {
      this.store.dispatch(new LoggerInfoAction(message));
      if (environment.logToConsole) {
        // tslint:disable-next-line:no-console
        console.info(message, arg);
      }
    }
  }

  warn(message: string, arg?: any) {
    if (LogLevelStringToNumber[LogLevel.WARN] >= LogLevelStringToNumber[environment.logLevel]) {
      this.store.dispatch(new LoggerWarnAction(message));
      if (environment.logToConsole) {
        console.warn(message, arg);
      }
    }
  }

  error(message: string, arg?: any) {
    if (LogLevelStringToNumber[LogLevel.ERROR] >= LogLevelStringToNumber[environment.logLevel]) {
      this.store.dispatch(new LoggerErrorAction(message));
      if (environment.logToConsole) {
        console.error(message, arg);
      }
    }
  }

}

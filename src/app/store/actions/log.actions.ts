import { RequestOptions } from '@angular/http';
import { Action, compose, createFeatureSelector, createSelector, Store } from '@ngrx/store';
import { denormalize, Schema } from 'normalizr';
import { Observable } from 'rxjs/Rx';

import { EntitiesState } from '../reducers/entity.reducer';
import { AppState } from './../app-state';
import { EntityRequestState, ActionState } from './../reducers/api-request-reducer';

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

class LoggerAction implements Action {
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

import { Action } from '@ngrx/store';
import { Router, NavigationExtras } from '@angular/router';
import { LoggerAction, LogLevel } from './log.actions';

export const RouterActions = {
  GO: '[Router] Go To',
};

export class RouterNav implements Action, LoggerAction {
  public logLevel: LogLevel.INFO;
  public message: string;
  type = RouterActions.GO;
  constructor(public payload: {
    path: string[] | string;
    query?: {
      [key: string]: any
    };
    extras?: NavigationExtras;
  }, public redirectPath?: string) {
    const path = payload.path as string[];
    const pathString = payload.path as string;
    this.message = path.join ? path.join('/') : pathString;
  }
}

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
    path: any[];
    query?: object;
    extras?: NavigationExtras;
  }, public redirectPath?: string) {
    this.message = payload.path.join('/');
  }
}

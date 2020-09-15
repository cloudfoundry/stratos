import { NavigationExtras } from '@angular/router';
import { Action } from '@ngrx/store';

import { RouterRedirect } from '../reducers/routing.reducer';

export const RouterActions = {
  GO: '[Router] Go To',
};

export interface RouterQueryParams {
  [key: string]: any;
}
export interface IRouterNavPayload {
  path: string[] | string;
  query?: RouterQueryParams;
  extras?: NavigationExtras;
}
export class RouterNav implements Action {
  public message: string;
  type = RouterActions.GO;
  constructor(public payload: IRouterNavPayload, public redirect?: RouterRedirect) {
    const path = payload.path as string[];
    const pathString = payload.path as string;
    this.message = path.join ? path.join('/') : pathString;
  }
}

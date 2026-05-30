import { NavigationExtras } from '@angular/router';
import { Action } from '@ngrx/store';

export const RouterActions = {
  GO: '[Router] Go To',
};

// A redirect to replay after login. Previously lived in routing.reducer.ts
// (alongside the now-removed routingReducer); kept here next to RouterNav,
// its primary consumer, and re-used by the auth slice.
export interface RouterRedirect {
  path: string;
  queryParams?: {
    [key: string]: string
  };
}

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

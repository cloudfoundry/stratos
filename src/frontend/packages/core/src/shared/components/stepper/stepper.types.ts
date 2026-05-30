import { NavigationExtras } from '@angular/router';

export const BASE_REDIRECT_QUERY = 'base-previous-redirect';

/**
 * Navigation payload for stepper redirects. Locally owned (was the ngrx
 * `IRouterNavPayload` from @stratosui/store) so the stepper carries no tether
 * to the router-store actions being retired. Structurally identical: a path
 * (string or segments), optional query params, and Angular NavigationExtras.
 */
export interface StepperRedirectPayload {
  path: string[] | string;
  query?: { [key: string]: any };
  extras?: NavigationExtras;
}

import { Injectable, signal } from '@angular/core';

import type { StRoute, StServiceBinding } from '../../services/endpoint-data/stratos-types';

/**
 * Holds the pending delete selections captured by the route + service-
 * binding wizard so the parent app detail page can pick them up after the
 * wizard navigates back. The wizard does not execute the delete itself —
 * it only collects selections; the app page asks the user for final
 * confirmation and then runs the orchestrated cleanup + delete through
 * AppApplicationActionsService so the whole sequence shows up as a
 * single DELETING lifecycle event in the progress overlay.
 *
 * Component-scoped at application-base.component so wizard and app
 * detail share the same instance for the duration of the app-detail
 * page lifetime; the service tears down on app navigation.
 */
@Injectable()
export class AppDeleteSelectionService {
  private readonly _routes = signal<StRoute[]>([]);
  private readonly _bindings = signal<StServiceBinding[]>([]);
  private readonly _requested = signal<boolean>(false);

  readonly routes = this._routes.asReadonly();
  readonly bindings = this._bindings.asReadonly();
  /** True once the wizard's Confirm step has stashed selections — the app page reads this to know whether to prompt. */
  readonly requested = this._requested.asReadonly();

  setPending(routes: StRoute[], bindings: StServiceBinding[]): void {
    this._routes.set(routes);
    this._bindings.set(bindings);
    this._requested.set(true);
  }

  clear(): void {
    this._routes.set([]);
    this._bindings.set([]);
    this._requested.set(false);
  }
}

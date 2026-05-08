import { Injectable, signal } from '@angular/core';

import type { StRoute, StServiceCredentialBinding } from '../../services/endpoint-data/stratos-types';

/**
 * Resolved display names the wizard already had on hand when the user
 * pressed Confirm. The parent's "Are you sure?" dialog uses these
 * directly instead of racing the data service's observables — by the
 * time the parent is recreated post-navigation, its publishReplay
 * caches are gone with the old instance, so the race loses and the
 * dialog renders appGuid + "?" for org/space.
 */
export interface PendingDeleteTarget {
  appName: string;
  endpointName: string;
  orgName: string;
  spaceName: string;
}

/**
 * Holds the pending delete selections captured by the route + service-
 * binding wizard so the parent app detail page can pick them up after the
 * wizard navigates back. The wizard does not execute the delete itself —
 * it only collects selections; the app page asks the user for final
 * confirmation and then runs the orchestrated cleanup + delete through
 * AppApplicationActionsService so the whole sequence shows up as a
 * single DELETING lifecycle event in the progress overlay.
 *
 * Root-scoped because CustomReuseStrategy.shouldReuseRoute returns false
 * for parameterized child routes — so navigating from the wizard back to
 * the app summary recreates ApplicationBaseComponent and would discard a
 * component-scoped instance (along with the wizard's `setPending` write)
 * before the new parent's effect could fire. Root scope keeps the signal
 * alive across the recreate; the post-consume `clear()` in the parent
 * effect prevents the flag from re-firing on subsequent navigations.
 */
@Injectable({ providedIn: 'root' })
export class AppDeleteSelectionService {
  private readonly _routes = signal<StRoute[]>([]);
  private readonly _bindings = signal<StServiceCredentialBinding[]>([]);
  private readonly _requested = signal<boolean>(false);
  private readonly _forAppGuid = signal<string | null>(null);
  private readonly _target = signal<PendingDeleteTarget | null>(null);

  readonly routes = this._routes.asReadonly();
  readonly bindings = this._bindings.asReadonly();
  /** True once the wizard's Confirm step has stashed selections — the app page reads this to know whether to prompt. */
  readonly requested = this._requested.asReadonly();
  /** GUID of the app the wizard collected selections for — the parent effect must verify this matches the current app before triggering. */
  readonly forAppGuid = this._forAppGuid.asReadonly();
  /** Resolved app/endpoint/org/space names — see PendingDeleteTarget docstring. */
  readonly target = this._target.asReadonly();

  /**
   * Pre-fill the resolved target names at the moment the trash button is
   * pressed on the app summary page. The summary page has the names hot
   * in its observable caches; the wizard reads them from here so its
   * Confirm step renders synchronously without re-subscribing.
   */
  seed(appGuid: string, target: PendingDeleteTarget): void {
    this._forAppGuid.set(appGuid);
    this._target.set(target);
  }

  setPending(
    appGuid: string,
    target: PendingDeleteTarget,
    routes: StRoute[],
    bindings: StServiceCredentialBinding[],
  ): void {
    this._forAppGuid.set(appGuid);
    this._target.set(target);
    this._routes.set(routes);
    this._bindings.set(bindings);
    this._requested.set(true);
  }

  clear(): void {
    this._routes.set([]);
    this._bindings.set([]);
    this._forAppGuid.set(null);
    this._target.set(null);
    this._requested.set(false);
  }
}

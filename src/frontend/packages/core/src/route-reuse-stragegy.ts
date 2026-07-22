import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, DetachedRouteHandle, Params, RouteReuseStrategy } from '@angular/router';

import { AppComponent } from './app.component';
import { DashboardBaseComponent } from './features/dashboard/dashboard-base/dashboard-base.component';

// Shallow equality of a route node's own params (e.g. { endpointId, id }).
function paramsEqual(a: Params, b: Params): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  return ak.length === bk.length && ak.every((k) => a[k] === b[k]);
}

@Injectable()
export class CustomReuseStrategy extends RouteReuseStrategy {
  shouldDetach(_route: ActivatedRouteSnapshot): boolean { return false; }
  store(_route: ActivatedRouteSnapshot, _detachedTree: DetachedRouteHandle): void { }
  shouldAttach(_route: ActivatedRouteSnapshot): boolean { return false; }
  retrieve(_route: ActivatedRouteSnapshot): DetachedRouteHandle | null { return null; }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    const isDashboard = curr.component === DashboardBaseComponent && future.component === DashboardBaseComponent;
    const isAppComp = curr.component === AppComponent && future.component === AppComponent;

    let reuse = false;
    if (curr.data.reuseRoute === true) {
      reuse = curr.data.reuseRoute && future.data.reuseRoute && !curr.component && !future.component;
    } else {
      // A component-keyed reuseRoute keeps a detail shell alive while the
      // user moves between its child tabs (route params unchanged). It must
      // NOT reuse across two different resources of the same component
      // (e.g. app A -> app B): such shells derive their identity — CF/app
      // GUIDs — from route params at construction time, so reusing the
      // instance would leave them pinned to the previous resource and show
      // stale data. Require the node's own params to match too. (#5519)
      //
      // Normalize with `?? null`: componentless nodes (the ROOT node,
      // path-group nodes) have component === null while an absent marker
      // is undefined. Without the normalization the root node compares
      // null === undefined -> false, Angular recreates the entire
      // ActivatedRoute tree on every navigation, and every outlet below
      // rebuilds — silencing every reuseRoute marker in the tree.
      reuse =
        (curr.component ?? null) === (curr.data.reuseRoute ?? null) &&
        (future.component ?? null) === (future.data.reuseRoute ?? null) &&
        paramsEqual(curr.params, future.params);
    }
    return isDashboard || isAppComp || reuse;
  }
}

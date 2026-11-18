import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, DetachedRouteHandle, Params, RouteReuseStrategy } from '@angular/router';

import { DashboardBaseComponent } from './features/dashboard/dashboard-base/dashboard-base.component';

// Shallow equality of a route node's own params (e.g. { endpointId, id }).
function paramsEqual(a: Params, b: Params): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  return ak.length === bk.length && ak.every((k) => a[k] === b[k]);
}

// The whole URL a router state stands for: the path of every outlet (with
// matrix params), the query and the fragment.
function stateUrl(s: ActivatedRouteSnapshot): string {
  const tree = (n: ActivatedRouteSnapshot): string =>
    `${n.outlet}:${n.url.map((u) => u.toString()).join('/')}(${n.children.map(tree).join(',')})`;
  return tree(s.root) + JSON.stringify(s.root.queryParams) + (s.root.fragment ?? '');
}

@Injectable()
export class CustomReuseStrategy extends RouteReuseStrategy {
  shouldDetach(_route: ActivatedRouteSnapshot): boolean { return false; }
  store(_route: ActivatedRouteSnapshot, _detachedTree: DetachedRouteHandle): void { }
  shouldAttach(_route: ActivatedRouteSnapshot): boolean { return false; }
  retrieve(_route: ActivatedRouteSnapshot): DetachedRouteHandle | null { return null; }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    const isDashboard = curr.component === DashboardBaseComponent && future.component === DashboardBaseComponent;
    // The root is the only node without a route config. Always reuse it, as
    // Angular's default strategy does: the router's first state after a page
    // load has a root with no component while the next one carries
    // AppComponent, and not reusing it rebuilt the whole tree, dashboard
    // shell included, on the first in-app navigation after every load.
    const isRoot = curr.routeConfig === null && future.routeConfig === null;
    // A link to the URL already shown still navigates (the app sets
    // onSameUrlNavigation: 'reload'). Keep the page then: rebuilding it
    // takes the focused link out of the page and focus falls to the body.
    const isSameUrl = stateUrl(curr) === stateUrl(future);

    let reuse: boolean;
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
    return isDashboard || isRoot || isSameUrl || reuse;
  }
}

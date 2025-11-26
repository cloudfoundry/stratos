import { inject, Injectable } from '@angular/core';
import { type ActivatedRouteSnapshot, type CanActivateFn, Router, type RouterStateSnapshot, type Route } from '@angular/router';
import type { Observable } from 'rxjs';

import { getRoutesFromExtensions, type StratosRouteType } from './extension-service';

/**
 * This is used to dynamically add an extension's routes - since we can't do this
 * if the extension's module is lazy-loaded.
 *
 * This CanActive plugin typically is added to the route config to catch all unknown routes '**'
 * When activated, it removes itself from the routing config, so it only ever activates once.
 *
 * It checks if there are any new routes from extensions that need to be added and add them.
 *
 * Lastly, it navigates to the same route that it intercepted - if a new extension route
 * was added that now matches, it gets the route, otherwise the route goes up the chain
 * as it would have before.
 */

// Helper functions for route manipulation
function getChildRoutes(r: Route | undefined | null): Route[] {
  if (!r) {
    return [];
  }
  const loadedRoutes = (r as { _loadedConfig?: { routes?: Route[] } })._loadedConfig?.routes || [];
  return r.children ? r.children : loadedRoutes;
}

function setChildRoutes(r: Route | undefined | null, newRoutes: Route[]): void {
  if (!r) {
    return;
  }
  const routeWithConfig = r as { _loadedConfig?: { routes?: Route[] } };
  const loadedRoutes = routeWithConfig._loadedConfig || {};
  if (r.children) {
    r.children = newRoutes;
  } else {
    loadedRoutes.routes = newRoutes;
  }
}

export const dynamicExtensionRoutesGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean> | Promise<boolean> | boolean => {
  const router = inject(Router);

  const childRoutes = getChildRoutes(route.parent.routeConfig);
  // Remove the last route (which is us, the '**' route)
  let newChildRoutes = childRoutes.splice(0, childRoutes.length - 1);

  // Does the parent root have metadata to tell us what route group this is?
  // i.e. are there extension routes we need to try and add?
  if (route.routeConfig.data?.stratosRouteGroup) {
    const tabGroup = route.routeConfig.data.stratosRouteGroup;

    // Add the missing routes
    const newRoutes = getRoutesFromExtensions(tabGroup as StratosRouteType);
    newChildRoutes = newChildRoutes.concat(newRoutes);
  }
  // Update the route config and navigate again to the same route that was intercepted
  setChildRoutes(route.parent.routeConfig, newChildRoutes);
  router.navigateByUrl(state.url);

  return false;
};

// Legacy class-based guard for backward compatibility during migration
// @deprecated Use dynamicExtensionRoutesGuard functional guard instead
@Injectable()
export class DynamicExtensionRoutes {
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const router = this.router;

    const childRoutes = getChildRoutes(route.parent.routeConfig);
    let newChildRoutes = childRoutes.splice(0, childRoutes.length - 1);

    if (route.routeConfig.data?.stratosRouteGroup) {
      const tabGroup = route.routeConfig.data.stratosRouteGroup;
      const newRoutes = getRoutesFromExtensions(tabGroup as StratosRouteType);
      newChildRoutes = newChildRoutes.concat(newRoutes);
    }

    setChildRoutes(route.parent.routeConfig, newChildRoutes);
    router.navigateByUrl(state.url);

    return false;
  }
}

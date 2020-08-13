import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import { getRoutesFromExtensions, StratosRouteType } from './extension-service';

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

@Injectable()
export class DynamicExtensionRoutes implements CanActivate {
  constructor(private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const childRoutes = this.getChildRoutes(route.parent.routeConfig);
    // Remove the last route (which is us, the '**' route)
    let newChildRoutes = childRoutes.splice(0, childRoutes.length - 1);

    // Does the parent root have metadata to tell us what route group this is?
    // i.e. are there extension routes we need to try and add?
    if (route.routeConfig.data && route.routeConfig.data.stratosRouteGroup) {
      const tabGroup = route.routeConfig.data.stratosRouteGroup;

      // Add the missing routes
      const newRoutes = getRoutesFromExtensions(tabGroup as StratosRouteType);
      newChildRoutes = newChildRoutes.concat(newRoutes);
    }
    // Update the route config and navigate again to the same route that was intercepted
    this.setChildRoutes(route.parent.routeConfig, newChildRoutes);
    this.router.navigateByUrl(state.url);

    return false;
  }

  private getChildRoutes(r: any) {
    if (!r) {
      return [];
    }
    const loadedRoutes = r._loadedConfig ? r._loadedConfig.routes : [];
    return r.children ? r.children : loadedRoutes;
  }

  private setChildRoutes(r: any, newRoutes: any) {
    if (!r) {
      return [];
    }
    const loadedRoutes = r._loadedConfig ? r._loadedConfig : {};
    if (r.children) {
      r.children = newRoutes;
    } else {
      loadedRoutes.routes = newRoutes;
    }
  }
}

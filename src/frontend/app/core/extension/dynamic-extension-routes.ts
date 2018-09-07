import { Injectable } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot, ActivatedRouteSnapshot, Route } from '@angular/router';
import { Observable } from 'rxjs';
import { getRoutesFromExtensions, StratosRouteType } from './extension-service';


@Injectable()
export class DynamicExtenstionRoutes implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean>|Promise<boolean>|boolean {
    // Does the parent root have metadata to tell us what route group this is?
    if (route.routeConfig.data && route.routeConfig.data.stratosRouteGroup) {
      const tabGroup = route.routeConfig.data.stratosRouteGroup;
      const childRoutes = this.getChildRoutes(route.parent.routeConfig);

      // Remove the last route
      let newChildRoutes = childRoutes.splice(0, childRoutes.length - 1);

      // Add the missing routes
      const newRoutes = getRoutesFromExtensions(tabGroup as StratosRouteType);
      newChildRoutes = newChildRoutes.concat(newRoutes);
      this.setChildRoutes(route.parent.routeConfig, newChildRoutes);
      this.router.navigateByUrl(state.url);
      return false;
    }
    return true;
  }

  private getChildRoutes(r: any) {
    const loadedRoutes = r._loadedConfig ? r._loadedConfig.routes : [];
    return r.children ? r.children : loadedRoutes;
  }

  private setChildRoutes(r: any, newRoutes: any) {
    const loadedRoutes = r._loadedConfig ? r._loadedConfig : {};
    if (r.children) {
      r.children = newRoutes;
    } else {
      loadedRoutes.routes = newRoutes;
    }
  }
}

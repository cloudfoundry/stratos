import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';

import { AppComponent } from './app.component';
import { DashboardBaseComponent } from './features/dashboard/dashboard-base/dashboard-base.component';
import { Injectable } from "@angular/core";


@Injectable()
export class CustomReuseStrategy extends RouteReuseStrategy {
  shouldDetach(route: ActivatedRouteSnapshot): boolean { return false; }
  store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle): void { }
  shouldAttach(route: ActivatedRouteSnapshot): boolean { return false; }
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle { return null; }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    const isDashboard = curr.component === DashboardBaseComponent && future.component === DashboardBaseComponent;
    const isAppComp = curr.component === AppComponent && future.component === AppComponent;

    let reuse = false;
    if (curr.data.reuseRoute === true) {
      reuse = curr.data.reuseRoute && future.data.reuseRoute && !curr.component && !future.component;
    } else {
      // Expect it to be a component
      reuse = curr.component === curr.data.reuseRoute && future.component === future.data.reuseRoute;
    }
    return isDashboard || isAppComp || reuse;
  }
}

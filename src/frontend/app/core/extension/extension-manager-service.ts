import { Injectable } from '@angular/core';
import { Route, Router } from '@angular/router';

import { SideNavItem } from '../../features/dashboard/side-nav/side-nav.component';

export interface EndpointTypeExtension {
  type: string;
  label: string;
  authTypes: string[];
}

@Injectable()
export class ExtensionManager {

  private sideNav: SideNavItem[] = [];

  public routes: Route[] = [];

  public endointTypes: EndpointTypeExtension[] = [];

  constructor(private router: Router) {
    console.log('Extension Manager');
  }

  public registerRoutes(r: Route[]): ExtensionManager {

    r.forEach(route => this.routes.push(route));

    return this;
  }

  public registerSideNav(item: SideNavItem): ExtensionManager {
    this.sideNav.push(item);
    return this;
  }

  public getSideNav() {
    return this.sideNav;
  }

  public registerEndpointType(epType: EndpointTypeExtension): ExtensionManager {
    this.endointTypes.push(epType);
    return this;
  }

  public getEndpointTypes(): EndpointTypeExtension[] {
    return this.endointTypes;
  }

  public applyRouteConfig() {
    const routeConfig = [...this.router.config];
    const dashboardRoute = routeConfig.find(r => r.path === '' && !!r.component && r.component.name === 'DashboardBaseComponent');
    if (dashboardRoute) {
      dashboardRoute.children = [
        ...dashboardRoute.children,
        ...this.routes
      ];
      this.router.resetConfig(routeConfig);
    }
  }
}

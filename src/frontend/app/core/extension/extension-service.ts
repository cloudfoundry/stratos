import { Injectable, Component, Injector } from '@angular/core';
import { Route, Router } from '@angular/router';
import { AppModule } from '../../app.module';

export interface EndpointTypeExtension {
  type: string;
  label: string;
  authTypes: string[];
}

export interface RouteInfo {
  target: any;
  name: string;
}

export enum StratosTabType {
  Application = 'appTabs',
  CloudFoundry = 'cfTabs',
  CloudFoundryOrg = 'cfOrgTabs',
  CloudFoundrySpace = 'cfSpaceTabs'
}

export interface StratosTabMetadata {
  type: StratosTabType;
  label: string;
  link: string;
}

export enum StratosActionType {
  Applications = 'appsActions',
  Application = 'appActions',
  CloudFoundry = 'cfActiosn',
  CloudFoundryOrg = 'cfOrgActions',
  CloudFoundrySpace = 'cfSpaceActions'
}

export interface StratosActionMetadata {
  type: StratosActionType;
  label?: string;
  link: string;
  icon: string;
  iconFont?: string;
}

export type StratosRouteType = StratosTabType | StratosActionType;

const extensionMetadata = {
  routes: [],
  loginComponent: null,
  extensionRoutes: {},
  tabs: {},
  actions: {},
};

function addExtensionTab(tab: StratosTabType, target: any, props: any) {
  if (!extensionMetadata.tabs[tab]) {
    extensionMetadata.tabs[tab] = [];
  }
  if (!extensionMetadata.extensionRoutes[tab]) {
    extensionMetadata.extensionRoutes[tab] = [];
  }

  extensionMetadata.extensionRoutes[tab].push({
    path: props.link,
    component: target
  });
  extensionMetadata.tabs[tab].push(props);
}

function addExtensionAction(action: StratosActionType, target: any, props: any) {
  if (!extensionMetadata.actions[action]) {
    extensionMetadata.actions[action] = [];
    extensionMetadata.extensionRoutes[action] = [];
  }
  extensionMetadata.extensionRoutes[action].push({
    path: props.link,
    component: target
  });
  extensionMetadata.actions[action].push(props);
}

export function StratosTab(props: StratosTabMetadata) {
  return function(target) {
    addExtensionTab(props.type, target, props);
  };
}

export function StratosAction(props: StratosActionMetadata) {
  return function(target) {
    addExtensionAction(props.type, target, props);
  };
}


export interface StratosNavExtensionConfig {
  routes: Route[];
}

export function StratosNavExtension(config: StratosNavExtensionConfig) {
  return (target) => {
    extensionMetadata.routes.push(config.routes);
  };
}

export function StratosLoginComponent() {
  return (target) => {
    extensionMetadata.loginComponent = target;
  };
}


@Injectable()
export class ExtensionService {

  private routes: Route[] = [];

  private endointTypes: EndpointTypeExtension[] = [];

  private loginComponent: any;

  public metadata = extensionMetadata;

  constructor(private router: Router, private injector: Injector) {}

  /**
   * Regiser new top-level routes
   */
  public registerRoutes(r: Route[]): ExtensionService {
    this.routes = this.routes.concat(r);
    return this;
  }

  /**
   * Register a component to use for the Login page
   */
  public registerLoginComponent(component: any): ExtensionService {
    this.loginComponent = component;
    return this;
  }

  public registerEndpointType(epType: EndpointTypeExtension): ExtensionService {
    this.endointTypes.push(epType);
    return this;
  }

  public getEndpointTypes(): EndpointTypeExtension[] {
    return this.endointTypes;
  }

  /**
   * Apply route configuration
   */
  public applyRouteConfig() {
    const routeConfig = [...this.router.config];
    const dashboardRoute = routeConfig.find(r => r.path === '' && !!r.component && r.component.name === 'DashboardBaseComponent');
    let needsReset = false;
    if (dashboardRoute) {
      dashboardRoute.children = [
        ...dashboardRoute.children,
        ...this.routes
      ];
      needsReset = true;
    }

    if (this.loginComponent) {
      // Override the component used for the login route
      const loginRoute = routeConfig.find(r => r.path === 'login') || {};
      loginRoute.component = this.loginComponent;
      needsReset = true;
    }

    if (needsReset) {
      this.router.resetConfig(routeConfig);
    }
  }
}

export function applyRoutesFromExtensions(router: Router) {
    const routeConfig = [...router.config];
    const dashboardRoute = routeConfig.find(r => r.path === '' && !!r.component && r.component.name === 'DashboardBaseComponent');
    let needsReset = false;
    if (dashboardRoute) {
      extensionMetadata.routes.forEach(routes => dashboardRoute.children = dashboardRoute.children.concat(routes));
      needsReset = true;
    }

    if (extensionMetadata.loginComponent) {
      // Override the component used for the login route
      const loginRoute = routeConfig.find(r => r.path === 'login') || {};
      loginRoute.component = extensionMetadata.loginComponent;
      needsReset = true;
    }

    if (needsReset) {
      router.resetConfig(routeConfig);
    }
}

export function getRoutesFromExtensions(routeType: StratosRouteType) {
  return extensionMetadata.extensionRoutes[routeType] || [];
}

export function getTabsFromExtensions(tabType: StratosTabType) {
  return extensionMetadata.tabs[tabType] || [];
}

export function getActionsFromExtensions(actionType: StratosActionType): StratosActionMetadata[] {
  return extensionMetadata.actions[actionType] || [];
}

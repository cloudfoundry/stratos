import { Injectable, Type } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AppState } from '../../../../store/src/app-state';
import { IPageSideNavTab } from '../../features/dashboard/page-side-nav/page-side-nav.component';
import { EntityServiceFactory } from '../entity-service-factory.service';
import { EndpointAuthTypeConfig, EndpointTypeExtensionConfig, ExtensionEntitySchema } from './extension-types';

export const extensionsActionRouteKey = 'extensionsActionsKey';

export interface EndpointTypeExtension {
  type: string;
  label: string;
  authTypes: string[];
}

export interface StratosExtensionConfig {
  routes?: Route[];
  endpointTypes?: EndpointTypeExtensionConfig[];
  authTypes?: EndpointAuthTypeConfig[];
  entities?: ExtensionEntitySchema[];
}

// The different types of Tab
export enum StratosTabType {
  Application = 'appTabs',
  CloudFoundry = 'cfTabs',
  CloudFoundryOrg = 'cfOrgTabs',
  CloudFoundrySpace = 'cfSpaceTabs'
}

export interface StratosTabMetadata {
  label: string;
  link: string;
  icon: string;
  iconFont?: string;
  hidden?: (store: Store<AppState>, esf: EntityServiceFactory, activatedRoute: ActivatedRoute) => Observable<boolean>;
}

export interface StratosTabMetadataConfig extends StratosTabMetadata {
  type: StratosTabType;
}

// The different types of Action
export enum StratosActionType {
  Applications = 'appsActions',
  Application = 'appActions',
  CloudFoundry = 'cfActions',
  CloudFoundryOrg = 'cfOrgActions',
  CloudFoundrySpace = 'cfSpaceActions',
  Endpoints = 'endpointsActions'
}

export interface StratosActionMetadata {
  type: StratosActionType;
  label?: string;
  link: string;
  icon: string;
  iconFont?: string;
  visible?: (store: Store<AppState>) => Observable<boolean>;
  visible$?: Observable<boolean>;
}

export interface StratosEndpointMetadata {
  type: string;
  label: string;
  authTypes: string[];
  icon: string;
  iconFont: string;
}

export interface StratosEndpointExtensionConfig {
  endpointTypes?: EndpointTypeExtensionConfig[];
  authTypes?: EndpointAuthTypeConfig[];
}

export type StratosRouteType = StratosTabType | StratosActionType;

export interface StratosExtensionRoutes {
  path: string;
  component: any;
}

// Stores the extension metadata as defined by the decorators
const extensionMetadata = {
  loginComponent: null,
  extensionRoutes: {} as { [key: string]: StratosExtensionRoutes[] },
  tabs: {} as { [key: string]: IPageSideNavTab[] },
  actions: {} as { [key: string]: StratosActionMetadata[] },
  endpointTypes: [],
  authTypes: [],
  entities: [] as ExtensionEntitySchema[]
};

/**
 * Decorator for a Tab extension
 */
export function StratosTab(props: StratosTabMetadataConfig) {
  return target => addExtensionTab(props.type, target, props);
}

/**
 * Decorator for an Action extension
 */
export function StratosAction(props: StratosActionMetadata) {
  return target => addExtensionAction(props.type, target, props);
}

/**
 * Decorator for an Extension module
 */
export function StratosExtension(config: StratosExtensionConfig) {
  return target => {
    if (config.endpointTypes) {
      extensionMetadata.endpointTypes.push(...config.endpointTypes);
    }
    if (config.authTypes) {
      extensionMetadata.authTypes.push(...config.authTypes);
    }
    if (config.entities) {
      extensionMetadata.entities.push(...config.entities);
    }
  };
}

export function StratosLoginComponent() {
  return target => extensionMetadata.loginComponent = target;
}

function addExtensionTab(tab: StratosTabType, target: any, props: StratosTabMetadataConfig) {
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
  extensionMetadata.tabs[tab].push({
    ...props
  });
}

function addExtensionAction(action: StratosActionType, target: any, props: StratosActionMetadata) {
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

// Injectable Extension Service
@Injectable()
export class ExtensionService {

  public metadata = extensionMetadata;

  constructor(private router: Router) { }

  /**
   * Initialize the extensions - to be invoked in the AppModule
   */
  public init() {
    this.applyRoutesFromExtensions(this.router);
  }

  public getEndpointExtensionConfig(): StratosEndpointExtensionConfig {
    return this.metadata as StratosEndpointExtensionConfig;
  }

  /**
   * Apply route configuration
   */
  private applyRoutesFromExtensions(router: Router) {
    const routeConfig = [...router.config];

    // Find the route that has the 'about' page as a child - this is the dashboard base
    const dashboardRoute = routeConfig.find(r => {
      if (r.path === '' && !!r.component && r.children) {
        return !!r.children.find(c => c.path === 'about');
      } else {
        return false;
      }
    });

    let needsReset = false;
    if (dashboardRoute) {
      // Move any stratos extension routes under the dashboard base route
      while (this.moveExtensionRoute(routeConfig, dashboardRoute)) { }
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

  private moveExtensionRoute(routeConfig: Route[], dashboardRoute: Route): boolean {
    const index = routeConfig.findIndex(r => !!r.data && !!r.data.stratosNavigation);
    if (index >= 0) {
      const removed = routeConfig.splice(index, 1);
      dashboardRoute.children = dashboardRoute.children.concat(removed);
    }
    return index >= 0;
  }
}

// Helpers to access Extension metadata (without using the injectable Extension Service)

export function getRoutesFromExtensions(routeType: StratosRouteType): StratosExtensionRoutes[] {
  return extensionMetadata.extensionRoutes[routeType] || [];
}

export function getTabsFromExtensions(tabType: StratosTabType): IPageSideNavTab[] {
  return extensionMetadata.tabs[tabType] || [];
}

export function getActionsFromExtensions(actionType: StratosActionType): StratosActionMetadata[] {
  return extensionMetadata.actions[actionType] || [];
}

export function getEndpointSchemeKeys(type: string): string[] {
  const ep = extensionMetadata.endpointTypes.find(e => e.value === type);
  return ep ? ep.entitySchemaKeys || [] : [];
}

export function getEntitiesFromExtensions() {
  return extensionMetadata.entities;
}

import { Injectable, NgModule, ModuleWithProviders } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AppState, GeneralEntityAppState } from '../../../../store/src/app-state';
import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { IPageSideNavTab } from '../../features/dashboard/page-side-nav/page-side-nav.component';

export const extensionsActionRouteKey = 'extensionsActionsKey';


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
  icon?: string;
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
  visible?: (store: Store<GeneralEntityAppState>) => Observable<boolean>;
  visible$?: Observable<boolean>;
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
@Injectable({
  providedIn: 'root',
})
export class ExtensionService {

  public metadata = extensionMetadata;

  constructor(private router: Router) { }

  // Declare extensions - this is a trick to ensure the Angular Build Optimiser does not
  // optimize out any extension components
  public static declare(components: any[]): ModuleWithProviders {
    return {
      ngModule: ExtEmptyModule
    };
  }

  /**
   * Initialize the extensions - to be invoked in the AppModule
   */
  public init() {
    this.applyRoutesFromExtensions(this.router);
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

// Empty module used to support the registration of Extension Components
@NgModule()
export class ExtEmptyModule { }

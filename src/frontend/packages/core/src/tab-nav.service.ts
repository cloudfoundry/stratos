import { Portal } from '@angular/cdk/portal';
import { Injectable, computed, signal, Signal, inject } from '@angular/core';
import { Router } from '@angular/router';

import { IPageSideNavTab } from './features/dashboard/page-side-nav/page-side-nav.component';
import { IHeaderBreadcrumbLink } from './shared/components/page-header/page-header.types';

@Injectable({
  providedIn: 'root'
})
export class TabNavService {
  private router = inject(Router);

  // Sentinel for a tab with no navigable link; null at runtime.
  static TabsNoLinkValue: string | null = null;

  private _tabNavs = signal<IPageSideNavTab[] | undefined>(undefined);
  public readonly tabNavs: Signal<IPageSideNavTab[] | undefined> = this._tabNavs.asReadonly();

  private _tabHeader = signal<string | undefined>(undefined);
  public readonly tabHeader: Signal<string | undefined> = this._tabHeader.asReadonly();

  private _tabSubNav = signal<Portal<any> | undefined>(undefined);
  public readonly tabSubNav: Signal<Portal<any> | undefined> = this._tabSubNav.asReadonly();

  private _tabSubNavBreadcrumbs = signal<IHeaderBreadcrumbLink[] | undefined>(undefined);
  public readonly tabSubNavBreadcrumbs: Signal<IHeaderBreadcrumbLink[] | undefined> = this._tabSubNavBreadcrumbs.asReadonly();

  private _pageHeader = signal<Portal<any> | undefined>(undefined);
  public readonly pageHeader: Signal<Portal<any> | undefined> = this._pageHeader.asReadonly();

  /**
   * The tab whose link the router has active, or null. Reading the router's
   * current navigation makes it recompute when a navigation starts and ends.
   */
  public readonly currentTabHeader: Signal<(IPageSideNavTab & { link: string; }) | null> = computed(() => {
    this.router.currentNavigation();
    return this.getCurrentTabHeader(this.tabNavs());
  });

  public setTabs(tabs: IPageSideNavTab[]) {
    this._tabNavs.set(tabs);
  }

  public setHeader(header?: string) {
    this._tabHeader.set(header);
  }

  public setSubNav(portal: Portal<any>) {
    this._tabSubNav.set(portal);
  }

  public setSubNavBreadcrumbs(breadcrumbs: IHeaderBreadcrumbLink[] | undefined) {
    this._tabSubNavBreadcrumbs.set(breadcrumbs);
  }

  public setPageHeader(portal: Portal<any>) {
    this._pageHeader.set(portal);
  }

  public clear() {
    this._tabNavs.set(undefined);
    this._tabHeader.set(undefined);
    this.clearSubNav();
    this._pageHeader.set(undefined);
  }

  public clearSubNav() {
    this._tabSubNav.set(undefined);
    this._tabSubNavBreadcrumbs.set(undefined);
  }

  private getCurrentTabHeader = (tabs: IPageSideNavTab[] | undefined) => {
    if (!tabs) {
      return null;
    }
    const activeTab = tabs
      .filter((tab): tab is IPageSideNavTab & { link: string; } =>
        tab.link !== TabNavService.TabsNoLinkValue && tab.link != null)
      .find(tab => this.router.isActive(tab.link, false));

    if (!activeTab) {
      return null;
    }
    return activeTab;
  };
}

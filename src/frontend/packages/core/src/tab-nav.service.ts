import { Portal } from '@angular/cdk/portal';
import { Injectable, computed, signal, Signal, inject } from '@angular/core';
import { Router } from '@angular/router';

import { IPageSideNavTab } from './features/dashboard/page-side-nav/page-side-nav.component';
import { IHeaderBreadcrumbLink } from './shared/components/page-header/page-header.types';

export interface SubNavEntry {
  portal: Portal<any>;
  fallback: boolean;
  breadcrumbs?: IHeaderBreadcrumbLink[];
}

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

  // Every live sub-nav, in the order it registered. The row shows the last
  // one that is not a fallback; a fallback (a tabbed page's shared row) shows
  // only when no tab brought its own, whatever order they initialised in.
  private _subNavs = signal<SubNavEntry[]>([]);
  private shownSubNav = computed(() => {
    const all = this._subNavs();
    return [...all].reverse().find(e => !e.fallback) ?? all[all.length - 1];
  });

  public readonly tabSubNav: Signal<Portal<any> | undefined> = computed(() => this.shownSubNav()?.portal);
  public readonly tabSubNavBreadcrumbs: Signal<IHeaderBreadcrumbLink[] | undefined> =
    computed(() => this.shownSubNav()?.breadcrumbs);

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

  /** Register a sub-nav for the row. Returns the entry, to update or remove. */
  public addSubNav(portal: Portal<any>, fallback = false, breadcrumbs?: IHeaderBreadcrumbLink[]): SubNavEntry {
    const entry: SubNavEntry = { portal, fallback, breadcrumbs };
    this._subNavs.update(all => [...all, entry]);
    return entry;
  }

  /** Replace an entry's breadcrumbs. Returns the entry to hold from now on. */
  public setSubNavBreadcrumbs(entry: SubNavEntry, breadcrumbs: IHeaderBreadcrumbLink[] | undefined): SubNavEntry {
    const next = { ...entry, breadcrumbs };
    this._subNavs.update(all => all.map(e => e === entry ? next : e));
    return next;
  }

  public removeSubNav(entry: SubNavEntry) {
    this._subNavs.update(all => all.filter(e => e !== entry));
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
    this._subNavs.set([]);
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

import { Portal } from '@angular/cdk/portal';
import { Injectable, signal, Signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { IPageSideNavTab } from './features/dashboard/page-side-nav/page-side-nav.component';
import { IHeaderBreadcrumbLink } from './shared/components/page-header/page-header.types';

@Injectable({
  providedIn: 'root'
})
export class TabNavService {

  static TabsNoLinkValue: string = null;

  private _tabNavs = signal<IPageSideNavTab[] | undefined>(undefined);
  public readonly tabNavs: Signal<IPageSideNavTab[] | undefined> = this._tabNavs.asReadonly();
  public readonly tabNavs$: Observable<IPageSideNavTab[] | undefined> = toObservable(this._tabNavs);

  private _tabHeader = signal<string | undefined>(undefined);
  public readonly tabHeader: Signal<string | undefined> = this._tabHeader.asReadonly();
  public readonly tabHeader$: Observable<string | undefined> = toObservable(this._tabHeader);

  private _tabSubNav = signal<Portal<any> | undefined>(undefined);
  public readonly tabSubNav: Signal<Portal<any> | undefined> = this._tabSubNav.asReadonly();
  public readonly tabSubNav$: Observable<Portal<any> | undefined> = toObservable(this._tabSubNav);

  private _tabSubNavBreadcrumbs = signal<IHeaderBreadcrumbLink[] | undefined>(undefined);
  public readonly tabSubNavBreadcrumbs: Signal<IHeaderBreadcrumbLink[] | undefined> = this._tabSubNavBreadcrumbs.asReadonly();
  public readonly tabSubNavBreadcrumbs$: Observable<IHeaderBreadcrumbLink[] | undefined> = toObservable(this._tabSubNavBreadcrumbs);

  private _pageHeader = signal<Portal<any> | undefined>(undefined);
  public readonly pageHeader: Signal<Portal<any> | undefined> = this._pageHeader.asReadonly();
  public readonly pageHeader$: Observable<Portal<any> | undefined> = toObservable(this._pageHeader);

  public setTabs(tabs: IPageSideNavTab[]) {
    this._tabNavs.set(tabs);
  }

  public setHeader(header?: string) {
    this._tabHeader.set(header);
  }

  public setSubNav(portal: Portal<any>) {
    this._tabSubNav.set(portal);
  }

  public setSubNavBreadcrumbs(breadcrumbs: IHeaderBreadcrumbLink[]) {
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

  public getCurrentTabHeaderObservable() {
    return combineLatest([
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        startWith(null)
      ),
      this.tabNavs$
    ]).pipe(
      map(([event, tabs]) => this.getCurrentTabHeader(tabs)),
    );
  }

  private getCurrentTabHeader = (tabs: IPageSideNavTab[]) => {
    if (!tabs) {
      return null;
    }
    const activeTab = tabs
      .filter(tab => tab.link !== TabNavService.TabsNoLinkValue)
      .find(tab => this.router.isActive(tab.link, false));

    if (!activeTab) {
      return null;
    }
    return activeTab;
  };

  constructor(private router: Router) {
  }
}

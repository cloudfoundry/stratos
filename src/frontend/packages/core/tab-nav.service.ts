import { Injectable } from '@angular/core';
import { BehaviorSubject, asapScheduler, Observable } from 'rxjs';
import { observeOn, map, startWith } from 'rxjs/operators';
import { Portal } from '@angular/cdk/portal';
import { Router } from '@angular/router';
import { ISubHeaderTabs } from './src/shared/components/page-subheader/page-subheader.types';
import { IBreadcrumb } from './src/shared/components/breadcrumbs/breadcrumbs.types';

@Injectable()
export class TabNavService {
  private tabNavsSubject: BehaviorSubject<ISubHeaderTabs[]>;
  public tabNavs$: Observable<ISubHeaderTabs[]>;

  private tabHeaderSubject: BehaviorSubject<String>;
  public tabHeader$: Observable<String>;

  private tabSubNavSubject: BehaviorSubject<Portal<any>>;
  public tabSubNav$: Observable<Portal<any>>;

  private breadcrumbsSubject: BehaviorSubject<IBreadcrumb[]>;
  public breadcrumbs$: Observable<IBreadcrumb[]>;

  public setBreadcrumbs(breadcrumbs: IBreadcrumb[]) {
    this.breadcrumbsSubject.next(breadcrumbs);
  }

  public setTabs(tabs: ISubHeaderTabs[]) {
    this.tabNavsSubject.next(tabs);
  }

  public setHeader(header?: string) {
    this.tabHeaderSubject.next(header);
  }

  public setSubNav(portal: Portal<any>) {
    this.tabSubNavSubject.next(portal);
  }

  public clear() {
    this.tabNavsSubject.next(undefined);
    this.tabHeaderSubject.next(undefined);
    this.tabSubNavSubject.next(undefined);
  }

  public clearSubNav() {
    this.tabSubNavSubject.next(undefined);
  }

  public getCurrentTabHeaderObservable(tabs: ISubHeaderTabs[]) {
    return this.router.events.pipe(
      map(() => this.getCurrentTabHeader(tabs)),
      startWith(this.getCurrentTabHeader(tabs))
    );
  }

  public getCurrentTabHeader = (tabs: ISubHeaderTabs[]) => {
    if (!tabs) {
      return null;
    }
    const activeTab = tabs.find(tab => this.router.isActive(tab.link, true));
    if (!activeTab) {
      return null;
    }
    return activeTab.label;
  }


  constructor(private router: Router) {
    this.tabNavsSubject = new BehaviorSubject(undefined);
    this.tabNavs$ = this.tabNavsSubject.asObservable().pipe(
      observeOn(asapScheduler)
    );
    this.tabHeaderSubject = new BehaviorSubject(undefined);
    this.tabHeader$ = this.tabHeaderSubject.asObservable().pipe(
      observeOn(asapScheduler)
    );
    this.tabSubNavSubject = new BehaviorSubject(undefined);
    this.tabSubNav$ = this.tabSubNavSubject.asObservable().pipe(
      observeOn(asapScheduler)
    );
    this.breadcrumbsSubject = new BehaviorSubject(undefined);
    this.breadcrumbs$ = this.breadcrumbsSubject.asObservable().pipe(
      observeOn(asapScheduler)
    );
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, asapScheduler, Observable, Subject, combineLatest } from 'rxjs';
import { observeOn, map, startWith, withLatestFrom, publishReplay, refCount, tap, filter } from 'rxjs/operators';
import { Portal } from '@angular/cdk/portal';
import { Router, NavigationEnd } from '@angular/router';
import { ISubHeaderTabs } from './src/shared/components/page-subheader/page-subheader.types';

@Injectable()
export class TabNavService {
  private tabNavsSubject: BehaviorSubject<ISubHeaderTabs[]>;
  public tabNavs$: Observable<ISubHeaderTabs[]>;

  private tabHeaderSubject: BehaviorSubject<string>;
  public tabHeader$: Observable<string>;

  private tabSubNavSubject: BehaviorSubject<Portal<any>>;
  public tabSubNav$: Observable<Portal<any>>;

  private pageHeaderSubject: BehaviorSubject<Portal<any>>;
  public pageHeader$: Observable<Portal<any>>;

  public setTabs(tabs: ISubHeaderTabs[]) {
    this.tabNavsSubject.next(tabs);
  }

  public setHeader(header?: string) {
    this.tabHeaderSubject.next(header);
  }

  public setSubNav(portal: Portal<any>) {
    this.tabSubNavSubject.next(portal);
  }

  public setPageHeader(portal: Portal<any>) {
    this.pageHeaderSubject.next(portal);
  }

  public clear() {
    this.tabNavsSubject.next(undefined);
    this.tabHeaderSubject.next(undefined);
    this.tabSubNavSubject.next(undefined);
    this.pageHeaderSubject.next(undefined);
  }

  public clearSubNav() {
    this.tabSubNavSubject.next(undefined);
  }

  public getCurrentTabHeaderObservable() {
    return combineLatest(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        startWith(null)
      ),
      this.tabNavs$
    ).pipe(
      map(([event, tabs]) => this.getCurrentTabHeader(tabs)),
    );
  }

  public getCurrentTabHeader = (tabs: ISubHeaderTabs[]) => {
    if (!tabs) {
      return null;
    }
    const activeTab = tabs.find(tab => this.router.isActive(tab.link, false));
    if (!activeTab) {
      return null;
    }
    return activeTab.label;
  }

  private observeSubject(subject: Subject<any>) {
    return subject.asObservable().pipe(
      publishReplay(1),
      refCount(),
      observeOn(asapScheduler)
    );
  }


  constructor(private router: Router) {
    this.tabNavsSubject = new BehaviorSubject(undefined);
    this.tabNavs$ = this.observeSubject(this.tabNavsSubject);
    this.tabHeaderSubject = new BehaviorSubject(undefined);
    this.tabHeader$ = this.observeSubject(this.tabHeaderSubject);
    this.tabSubNavSubject = new BehaviorSubject(undefined);
    this.tabSubNav$ = this.observeSubject(this.tabSubNavSubject);
    this.pageHeaderSubject = new BehaviorSubject(undefined);
    this.pageHeader$ = this.observeSubject(this.pageHeaderSubject);
  }
}

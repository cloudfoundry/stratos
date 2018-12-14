import { Injectable } from '@angular/core';
import { BehaviorSubject, asapScheduler, Observable } from 'rxjs';
import { ISubHeaderTabs } from './shared/components/page-subheader/page-subheader.types';
import { observeOn } from 'rxjs/operators';
import { Portal } from '@angular/cdk/portal';

@Injectable()
export class TabNavService {
  private tabNavsSubject: BehaviorSubject<ISubHeaderTabs[]>;
  public tabNavs$: Observable<ISubHeaderTabs[]>;

  private tabHeaderSubject: BehaviorSubject<String>;
  public tabHeader$: Observable<String>;

  private tabSubNavSubject: BehaviorSubject<Portal<any>>;
  public tabSubNav$: Observable<Portal<any>>;

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

  constructor() {
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
  }
}

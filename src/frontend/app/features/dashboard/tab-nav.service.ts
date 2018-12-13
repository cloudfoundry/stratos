import { Injectable } from '@angular/core';
import { BehaviorSubject, asapScheduler, Observable } from 'rxjs';
import { ISubHeaderTabs } from '../../shared/components/page-subheader/page-subheader.types';
import { observeOn } from 'rxjs/operators';

@Injectable()
export class TabNavService {
  private tabNavsSubject: BehaviorSubject<ISubHeaderTabs[]>;
  public tabNavs$: Observable<ISubHeaderTabs[]>;

  setTabs(sideNavTabs: ISubHeaderTabs[]) {
    this.tabNavsSubject.next(sideNavTabs);
  }

  constructor() {
    this.tabNavsSubject = new BehaviorSubject(undefined);
    this.tabNavs$ = this.tabNavsSubject.asObservable().pipe(
      observeOn(asapScheduler)
    );
  }
}

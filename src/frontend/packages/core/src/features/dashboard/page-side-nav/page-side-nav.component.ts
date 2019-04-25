import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';

import { AppState } from '../../../../../store/src/app-state';
import { TabNavService } from '../../../../tab-nav.service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { IBreadcrumb } from '../../../shared/components/breadcrumbs/breadcrumbs.types';

export interface IPageSideNavTab {
  key?: string;
  label: string;
  matIcon: string;
  matIconFont?: string;
  link: string;
  hidden$?: Observable<boolean>;
  hidden?: (store: Store<AppState>, esf: EntityServiceFactory) => Observable<boolean>;
}

@Component({
  selector: 'app-page-side-nav',
  templateUrl: './page-side-nav.component.html',
  styleUrls: ['./page-side-nav.component.scss']
})
export class PageSideNavComponent implements OnInit {

  pTabs: IPageSideNavTab[];
  @Input() set tabs(tabs: IPageSideNavTab[]) {
    if (!tabs || this.pTabs) {
      return;
    }
    this.pTabs = tabs.map(tab => ({
      ...tab,
      hidden$: tab.hidden$ || (tab.hidden ? tab.hidden(this.store, this.esf) : of(false))
    }));
  }
  get tabs(): IPageSideNavTab[] {
    return this.pTabs;
  }

  @Input()
  public header: string;
  public activeTab$: Observable<string>;
  public breadcrumbs$: Observable<IBreadcrumb[]>;

  constructor(private store: Store<AppState>, private esf: EntityServiceFactory, public tabNavService: TabNavService) { }

  ngOnInit() {
    this.activeTab$ = this.tabNavService.getCurrentTabHeaderObservable();
  }

}

import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';

import { AppState } from '../../../../../store/src/app-state';
import { EntityServiceFactory } from '../../../../../store/src/entity-service-factory.service';
import { selectIsMobile } from '../../../../../store/src/selectors/dashboard.selectors';
import { TabNavService } from '../../../../tab-nav.service';
import { StratosTabMetadata } from '../../../core/extension/extension-service';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { IBreadcrumb } from '../../../shared/components/breadcrumbs/breadcrumbs.types';
import { map } from 'rxjs/operators';



export interface IPageSideNavTab extends StratosTabMetadata {
  hidden$?: Observable<boolean>;
}

@Component({
  selector: 'app-page-side-nav',
  templateUrl: './page-side-nav.component.html',
  styleUrls: ['./page-side-nav.component.scss']
})
export class PageSideNavComponent implements OnInit {

  pTabs: IPageSideNavTab[];
  @Input() set tabs(tabs: IPageSideNavTab[]) {
    if (!tabs || (this.pTabs && tabs.length === this.pTabs.length)) {
      return;
    }
    this.pTabs = tabs.map(tab => ({
      ...tab,
      hidden$: tab.hidden$ || (tab.hidden ? tab.hidden(this.store, this.esf, this.activatedRoute, this.cups) : of(false))
    }));
  }
  get tabs(): IPageSideNavTab[] {
    return this.pTabs;
  }

  @Input()
  public header: string;
  public activeTab$: Observable<string>;
  public breadcrumbs$: Observable<IBreadcrumb[]>;
  public isMobile$: Observable<boolean>;
  constructor(
    public tabNavService: TabNavService,
    private store: Store<AppState>,
    private esf: EntityServiceFactory,
    private activatedRoute: ActivatedRoute,
    private cups: CurrentUserPermissionsService
  ) {
    this.isMobile$ = this.store.select(selectIsMobile);
  }

  ngOnInit() {
    this.activeTab$ = this.tabNavService.getCurrentTabHeaderObservable().pipe(map(item => item ? item.label : null));
  }

}

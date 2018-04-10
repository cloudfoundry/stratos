import { Observable } from 'rxjs/Observable';
import { endpointSchemaKey } from './../../../store/helpers/entity-factory';
import { Component, OnInit, Input } from '@angular/core';
import { Store } from '@ngrx/store';

import * as moment from 'moment';

import { ToggleSideNav } from './../../../store/actions/dashboard-actions';
import { AppState } from './../../../store/app-state';
import { Logout } from '../../../store/actions/auth.actions';
import { IHeaderBreadcrumb, IHeaderBreadcrumbLink, BREADCRUMB_URL_PARAM, PageHeaderNotice } from './page-header.types';
import { ActivatedRoute } from '@angular/router';
import { internalEventTimeStampSelector } from '../../../store/selectors/internal-events.selectors';
import { endpointEntitiesSelector } from '../../../store/selectors/endpoint.selectors';
import { InternalEventSubjectState } from '../../../store/types/internal-events.types';
import { ISubHeaderTabs } from '../page-subheader/page-subheader.types';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({ transform: 'translateY(-40px)' }),
          animate('250ms ease-in', style({ transform: 'translateY(0)' }))
        ]),
        transition(':leave', [
          style({ transform: 'translateY(0)' }),
          animate('250ms ease-out', style({ transform: 'translateY(-40px)' }))
        ])
      ]
    )
  ]
})
export class PageHeaderComponent {
  public breadcrumbDefinitions: IHeaderBreadcrumbLink[] = null;
  private breadcrumbKey: string;

  @Input('hideSideNavButton') hideSideNavButton = false;

  @Input('hideMenu') hideMenu = false;

  @Input('notice$')
  notice$: Observable<PageHeaderNotice>;

  @Input('tabs')
  tabs: ISubHeaderTabs[];

  @Input('breadcrumbs')
  set breadcrumbs(breadcrumbs: IHeaderBreadcrumb[]) {
    this.breadcrumbDefinitions = this.getBreadcrumb(breadcrumbs);
  }

  private getBreadcrumb(breadcrumbs: IHeaderBreadcrumb[]) {
    if (!breadcrumbs || !breadcrumbs.length) {
      return [];
    }
    return this.getBreadcrumbFromKey(breadcrumbs).breadcrumbs;
  }

  private getBreadcrumbFromKey(breadcrumbs: IHeaderBreadcrumb[]) {
    if (breadcrumbs.length === 1 || !this.breadcrumbKey) {
      return breadcrumbs[0];
    }
    return breadcrumbs.find(breadcrumb => {
      return breadcrumb.key === this.breadcrumbKey;
    }) || breadcrumbs[0];
  }

  toggleSidenav() {
    this.store.dispatch(new ToggleSideNav());
  }

  logout() {
    this.store.dispatch(new Logout());
  }

  constructor(private store: Store<AppState>, private route: ActivatedRoute) {
    this.breadcrumbKey = route.snapshot.queryParams[BREADCRUMB_URL_PARAM] || null;
  }

}

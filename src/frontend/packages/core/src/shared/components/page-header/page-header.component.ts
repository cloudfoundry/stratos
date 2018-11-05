import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ISubHeaderTabs } from '../page-subheader/page-subheader.types';
import { BREADCRUMB_URL_PARAM, IHeaderBreadcrumb, IHeaderBreadcrumbLink } from './page-header.types';
import { InternalEventSeverity } from '../../../../../store/src/types/internal-events.types';
import { ToggleSideNav } from '../../../../../store/src/actions/dashboard-actions';
import { Logout } from '../../../../../store/src/actions/auth.actions';
import { AppState } from '../../../../../store/src/app-state';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent {
  public breadcrumbDefinitions: IHeaderBreadcrumbLink[] = null;
  private breadcrumbKey: string;
  public eventSeverity = InternalEventSeverity;

  @Input() hideSideNavButton = false;

  @Input() hideMenu = false;

  @Input()
  endpointIds$: Observable<string[]>;

  @Input()
  tabs: ISubHeaderTabs[];
  @Input() showUnderFlow = false;

  public actionsKey: String;

  @Input()
  set breadcrumbs(breadcrumbs: IHeaderBreadcrumb[]) {
    this.breadcrumbDefinitions = this.getBreadcrumb(breadcrumbs);
  }

  // Used when non-admin logs in with no-endpoints -> only show logout in the menu
  @Input() logoutOnly: boolean;

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
    this.actionsKey = this.route.snapshot.data ? this.route.snapshot.data.extensionsActionsKey : null;
    this.breadcrumbKey = route.snapshot.queryParams[BREADCRUMB_URL_PARAM] || null;
  }

}

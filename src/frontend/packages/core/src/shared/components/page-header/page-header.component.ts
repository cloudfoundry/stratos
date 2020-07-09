import { TemplatePortal } from '@angular/cdk/portal';
import { AfterViewInit, Component, Input, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { Logout } from '../../../../../store/src/actions/auth.actions';
import { ToggleSideNav } from '../../../../../store/src/actions/dashboard-actions';
import { AddRecentlyVisitedEntityAction } from '../../../../../store/src/actions/recently-visited.actions';
import { AppState } from '../../../../../store/src/app-state';
import { EntityCatalogHelpers } from '../../../../../store/src/entity-catalog/entity-catalog.helper';
import { FavoritesConfigMapper } from '../../../../../store/src/favorite-config-mapper';
import { selectIsMobile } from '../../../../../store/src/selectors/dashboard.selectors';
import { InternalEventSeverity } from '../../../../../store/src/types/internal-events.types';
import { StratosStatus } from '../../../../../store/src/types/shared.types';
import { IFavoriteMetadata, UserFavorite } from '../../../../../store/src/types/user-favorites.types';
import { TabNavService } from '../../../../tab-nav.service';
import { UserProfileService } from '../../../core/user-profile.service';
import { IPageSideNavTab } from '../../../features/dashboard/page-side-nav/page-side-nav.component';
import { GlobalEventService, IGlobalEvent } from '../../global-events.service';
import { selectDashboardState } from './../../../../../store/src/selectors/dashboard.selectors';
import { UserProfileInfo } from './../../../../../store/src/types/user-profile.types';
import { BREADCRUMB_URL_PARAM, IHeaderBreadcrumb, IHeaderBreadcrumbLink } from './page-header.types';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnDestroy, AfterViewInit {
  public breadcrumbDefinitions: IHeaderBreadcrumbLink[] = null;
  private breadcrumbKey: string;
  public eventSeverity = InternalEventSeverity;
  public pFavorite: UserFavorite<IFavoriteMetadata>;
  private pTabs: IPageSideNavTab[];

  public isMobile$: Observable<boolean> = this.store.select(selectIsMobile);

  @ViewChild('pageHeaderTmpl', { static: true }) pageHeaderTmpl: TemplateRef<any>;

  @Input() hideSideNavButton = false;

  @Input() hideEndpointErrors = false;

  @Input() hideMenu = false;

  @Input()
  endpointIds$: Observable<string[]>;

  @Input()
  set tabs(tabs: IPageSideNavTab[]) {
    if (tabs) {
      this.pTabs = tabs.map(tab => ({
        ...tab,
        link: tab.link === '-' ?
          TabNavService.TabsNoLinkValue :
          this.router.createUrlTree([tab.link], { relativeTo: this.route }).toString()
      }));
      this.tabNavService.setTabs(this.pTabs);
    }
  }

  @Input()
  set tabsHeader(header: string) {
    if (header) {
      this.tabNavService.setHeader(header);
    }
  }

  @Input() showUnderFlow = false;

  private pShowHistory = true;
  @Input()
  get showHistory(): boolean {
    return !this.logoutOnly && this.pShowHistory;
  }
  set showHistory(showHistory: boolean) {
    this.pShowHistory = showHistory;
  }

  public events$: Observable<IGlobalEvent[]>;
  public unreadEventCount$: Observable<number>;
  public eventPriorityStatus$: Observable<StratosStatus>;

  @Input() set favorite(favorite: UserFavorite<IFavoriteMetadata>) {
    if (favorite && (!this.pFavorite || (favorite.guid !== this.pFavorite.guid))) {
      this.pFavorite = favorite;
      const mapperFunction = this.favoritesConfigMapper.getMapperFunction(favorite);
      const prettyType = this.favoritesConfigMapper.getPrettyTypeName(favorite);
      const prettyEndpointType = this.favoritesConfigMapper.getPrettyTypeName({
        endpointType: favorite.endpointType,
        entityType: EntityCatalogHelpers.endpointType
      });
      if (mapperFunction) {
        const { name, routerLink } = mapperFunction(favorite.metadata);
        this.store.dispatch(new AddRecentlyVisitedEntityAction({
          guid: favorite.guid,
          date: moment().valueOf(),
          entityType: favorite.entityType,
          endpointType: favorite.endpointType,
          entityId: favorite.entityId,
          name,
          routerLink,
          prettyType,
          endpointId: favorite.endpointId,
          prettyEndpointType: prettyEndpointType === prettyType ? null : prettyEndpointType
        }));
      }
    }
  }

  public username$: Observable<string>;
  public user$: Observable<UserProfileInfo>;
  public allowGravatar$: Observable<boolean>;

  public actionsKey: string;

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

  logout() {
    this.store.dispatch(new Logout());
  }

  public toggleSidenav() {
    this.store.dispatch(new ToggleSideNav());
  }

  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private tabNavService: TabNavService,
    private router: Router,
    eventService: GlobalEventService,
    private favoritesConfigMapper: FavoritesConfigMapper,
    private userProfileService: UserProfileService,
  ) {
    this.events$ = eventService.events$.pipe(
      startWith([])
    );
    this.unreadEventCount$ = eventService.events$.pipe(
      map(events => events.filter(event => !event.read)),
      map(events => events.length)
    );
    this.eventPriorityStatus$ = eventService.priorityStratosStatus$;

    this.actionsKey = this.route.snapshot.data ? this.route.snapshot.data.extensionsActionsKey : null;
    this.breadcrumbKey = route.snapshot.queryParams[BREADCRUMB_URL_PARAM] || null;

    this.user$ = this.userProfileService.userProfile$;

    this.username$ = this.user$.pipe(
      map(profile => {
        let name = profile.userName;
        if (profile.name) {
          name = profile.name.givenName + ' ' + profile.name.familyName;
          name = name.trim();
        }
        return name ? name : profile.userName;
      })
    );

    this.allowGravatar$ = this.store.select(selectDashboardState).pipe(
      map(dashboardState => dashboardState.gravatarEnabled)
    );
  }

  ngOnDestroy() {
    this.tabNavService.clear();
  }

  ngAfterViewInit() {
    const portal = new TemplatePortal(this.pageHeaderTmpl, undefined, {});
    this.tabNavService.setPageHeader(portal);
  }

}

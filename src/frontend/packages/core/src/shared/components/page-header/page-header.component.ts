import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  InternalEventSeverity,
  IFavoriteMetadata,
  UserFavorite,
  AddRecentlyVisitedEntityAction,
  StratosStatus,
  selectDashboardState,
  ToggleSideNav,
  AppState,
  selectIsMobile,
  UserProfileInfo,
} from '@stratosui/store';
import { getTime } from 'date-fns';
import { combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { UserProfileService } from '../../../core/user-profile.service';
import { IPageSideNavTab } from '../../../features/dashboard/page-side-nav/page-side-nav.component';
import { TabNavService } from '../../../tab-nav.service';
import { GlobalEventService, IGlobalEvent } from '../../global-events.service';
import { EndpointsService } from './../../../core/endpoints.service';
import { environment } from './../../../environments/environment';
import { BREADCRUMB_URL_PARAM, IHeaderBreadcrumb, IHeaderBreadcrumbLink } from './page-header.types';
import { EntityFavoriteStarComponent } from '../../../core/entity-favorite-star/entity-favorite-star.component';
import { ExtensionButtonsComponent } from '../extension-buttons/extension-buttons.component';
import { RecentEntitiesComponent } from '../recent-entities/recent-entities.component';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { PageHeaderEventsComponent } from './page-header-events/page-header-events.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    EntityFavoriteStarComponent,
    ExtensionButtonsComponent,
    RecentEntitiesComponent,
    UserAvatarComponent,
    PageHeaderEventsComponent,
    ThemeToggleComponent
  ]
})
export class PageHeaderComponent implements OnDestroy, AfterViewInit {
  public canAPIKeys$: Observable<boolean>;
  public breadcrumbDefinitions: IHeaderBreadcrumbLink[] = null;
  private breadcrumbKey: string;
  public eventSeverity = InternalEventSeverity;
  public pFavorite: UserFavorite<IFavoriteMetadata>;
  private pTabs: IPageSideNavTab[];

  public isMobile$: Observable<boolean> = this.store.select(selectIsMobile);

  public environment = environment;

  // Menu state for Tailwind dropdowns
  public isHistoryMenuOpen = false;
  public isUserMenuOpen = false;

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
      if (favorite.canFavorite()) {
        this.pFavorite = favorite;
        this.store.dispatch(new AddRecentlyVisitedEntityAction({
          guid: favorite.guid,
          date: getTime(new Date()),
          entityType: favorite.entityType,
          endpointType: favorite.endpointType,
          entityId: favorite.entityId,
          name: favorite.metadata.name,
          routerLink: favorite.getLink(),
          prettyType: favorite.getPrettyTypeName(),
          endpointId: favorite.endpointId,
          metadata: { name: favorite.metadata.name },
        }));
      }
    }
  }

  public username$: Observable<string>;
  public user$: Observable<UserProfileInfo>;
  public allowGravatar$: Observable<boolean>;
  public canLogout$: Observable<boolean>;

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
    this.router.navigate(['/login/logout']);
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
    private userProfileService: UserProfileService,
    private cups: CurrentUserPermissionsService,
    private endpointsService: EndpointsService,
    private currentUserPermissionsService: CurrentUserPermissionsService,
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

    // Must be enabled and the user must have permission
    this.canAPIKeys$ = combineLatest([
      this.endpointsService.disablePersistenceFeatures$.pipe(startWith(true)),
      this.cups.can(StratosCurrentUserPermissions.API_KEYS),
    ]).pipe(
      map(([disabled, permission]) => !disabled && permission)
    );

    this.canLogout$ = this.currentUserPermissionsService.can(StratosCurrentUserPermissions.CAN_NOT_LOGOUT).pipe(
      map(noLogout => !noLogout)
    );

  }

  ngOnDestroy() {
    this.tabNavService.clear();
  }

  ngAfterViewInit() {
    const portal = new TemplatePortal(this.pageHeaderTmpl, undefined, {});
    this.tabNavService.setPageHeader(portal);
  }

  // Tailwind dropdown menu methods
  toggleHistoryMenu() {
    this.isHistoryMenuOpen = !this.isHistoryMenuOpen;
    if (this.isHistoryMenuOpen) {
      this.isUserMenuOpen = false; // Close user menu when opening history
    }
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.isUserMenuOpen) {
      this.isHistoryMenuOpen = false; // Close history menu when opening user menu
    }
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  closeHistoryMenu() {
    this.isHistoryMenuOpen = false;
  }

}

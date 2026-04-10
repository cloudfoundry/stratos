import { Portal, TemplatePortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, Component, Input, OnDestroy, TemplateRef, ViewChild, inject } from '@angular/core';
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent implements OnDestroy, AfterViewInit {
  private store = inject<Store<AppState>>(Store);
  private route = inject(ActivatedRoute);
  private tabNavService = inject(TabNavService);
  private router = inject(Router);
  private userProfileService = inject(UserProfileService);
  private cups = inject(CurrentUserPermissionsService);
  private endpointsService = inject(EndpointsService);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);
  private cdr = inject(ChangeDetectorRef);

  public canAPIKeys$: Observable<boolean>;
  public breadcrumbDefinitions: IHeaderBreadcrumbLink[] = null;
  private breadcrumbKey: string;
  public eventSeverity = InternalEventSeverity;
  public pFavorite!: UserFavorite<IFavoriteMetadata>;
  private pTabs!: IPageSideNavTab[];

  public isMobile$: Observable<boolean> = this.store.select(selectIsMobile);

  public environment = environment;

  // Menu state for Tailwind dropdowns
  public isHistoryMenuOpen = false;
  public isUserMenuOpen = false;

  @ViewChild('pageHeaderTmpl', { static: true }) pageHeaderTmpl!: TemplateRef<any>;

  // Our own portal registered in ngAfterViewInit; used to verify ownership
  // before clearing, and to avoid wiping another component's portal.
  private myPortal: TemplatePortal<any> | null = null;
  // Whatever portal was registered with TabNavService before us; restored on
  // destroy. Handles nested page-headers (e.g. an inner component loaded
  // inside a modal registers its own page-header over ours — when it's
  // destroyed we rewind to our portal, when we're destroyed we rewind to the
  // previous owner instead of leaving the outlet empty).
  private previousPortal: Portal<any> | undefined;

  @Input() hideSideNavButton = false;

  @Input() hideEndpointErrors = false;

  @Input() hideMenu = false;

  @Input()
  endpointIds$!: Observable<string[]>;

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
    this.cdr.markForCheck();
  }

  // Used when non-admin logs in with no-endpoints -> only show logout in the menu
  @Input() logoutOnly?: boolean;

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

  constructor() {
    const route = this.route;
    const eventService = inject(GlobalEventService);

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
    // Only rewind if we're still the active portal. If some other component
    // has overwritten us (e.g. we registered first, a nested page-header
    // registered second and is still alive), leave it alone.
    if (this.myPortal && this.tabNavService.pageHeader() === this.myPortal) {
      if (this.previousPortal) {
        // Restore whoever owned the portal before us — typically an outer
        // page-header that's still alive and waiting for us to hand back.
        this.tabNavService.setPageHeader(this.previousPortal);
      } else {
        this.tabNavService.clear();
      }
    }
  }

  ngAfterViewInit() {
    // Remember the current portal so we can hand it back in ngOnDestroy.
    this.previousPortal = this.tabNavService.pageHeader();
    this.myPortal = new TemplatePortal(this.pageHeaderTmpl, undefined, {});
    this.tabNavService.setPageHeader(this.myPortal);
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

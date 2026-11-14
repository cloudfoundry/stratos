import { Portal, TemplatePortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, AfterViewInit, Component, HostListener, OnDestroy, TemplateRef, ViewContainerRef, computed, effect, inject, input, linkedSignal, Signal, signal, untracked, viewChild } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  InternalEventSeverity,
  IFavoriteMetadata,
  UserFavorite,
  RecentlyVisitedDataService,
  AuthTokenEnvelope,
} from '@stratosui/store';
import { StratosBrandingService } from '../../../../../theme/stratos-branding.service';
import { DashboardSignalService } from '../../../core/signals/dashboard-signal.service';
import { DashboardDataService } from '../../../core/dashboard-data.service';
import { getTime } from 'date-fns';
import { firstValueFrom, Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { TailwindSnackBarService } from '../../services/tailwind-snackbar.service';

import { StratosActionType } from '../../../core/extension/extension-service';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { UserProfileService } from '../../../core/user-profile.service';
import { IPageSideNavTab } from '../../../features/dashboard/page-side-nav/page-side-nav.component';
import { TabNavService } from '../../../tab-nav.service';
import { GlobalEventService } from '../../global-events.service';
import { EndpointsService } from './../../../core/endpoints.service';
import { environment } from './../../../environments/environment';
import { BREADCRUMB_URL_PARAM, IHeaderBreadcrumb, IHeaderBreadcrumbLink } from './page-header.types';
import { EntityFavoriteStarComponent } from '../../../core/entity-favorite-star/entity-favorite-star.component';
import { CustomTooltipDirective } from '../custom-tooltip/custom-tooltip.directive';
import { ExtensionButtonsComponent } from '../extension-buttons/extension-buttons.component';
import { RecentEntitiesComponent } from '../recent-entities/recent-entities.component';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { PageHeaderEventsComponent } from './page-header-events/page-header-events.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';

// Shared between the anchor's target and the popup window.open call, so both
// modes address the same window and reuse it on repeat clicks.
const DOCUMENTATION_WINDOW_NAME = 'stratos-docs';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomTooltipDirective,
    EntityFavoriteStarComponent,
    ExtensionButtonsComponent,
    RecentEntitiesComponent,
    UserAvatarComponent,
    PageHeaderEventsComponent,
    ThemeToggleComponent,
    BreadcrumbsComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent implements OnDestroy, AfterViewInit {
  private recents = inject(RecentlyVisitedDataService);
  private route = inject(ActivatedRoute);
  private tabNavService = inject(TabNavService);
  private router = inject(Router);
  private userProfileService = inject(UserProfileService);
  private cups = inject(CurrentUserPermissionsService);
  private endpointsService = inject(EndpointsService);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);
  private http = inject(HttpClient);
  private snackBarService = inject(TailwindSnackBarService);
  private dashboardSignals = inject(DashboardSignalService);
  private dashboardData = inject(DashboardDataService);
  private viewContainerRef = inject(ViewContainerRef);
  private branding = inject(StratosBrandingService);

  // Operator-configured docs link, https-validated by the branding service.
  public documentationUrl = computed(() => this.branding.getDocumentationUrl());
  public documentationTarget = computed(() => this.branding.getDocumentationTarget());
  // Operators can rename "documentation" to whatever they call their docs.
  public documentationLabel = computed(() => this.branding.getDocumentationLabel());
  public documentationTooltip = computed(() =>
    `Open ${this.documentationLabel()} in a reusable tab or window`
  );

  // Word toggle, behaving like the home page's sort button: the label shows the
  // current state and the tooltip says what clicking will do.
  public documentationTargetLabel = computed(() =>
    this.documentationTarget() === 'popup' ? 'Window' : 'Tab'
  );
  public documentationTargetTooltip = computed(() =>
    this.documentationTarget() === 'popup'
      ? `Opens in a separate window — click to use a tab instead`
      : `Opens in a tab — click to use a separate window instead`
  );

  /**
   * In 'tab' mode the anchor does the work unaided, so middle-click and
   * cmd-click keep behaving normally. Only 'popup' needs intercepting, because
   * a window features string has no markup equivalent.
   *
   * The named target is what makes repeat clicks reuse one window instead of
   * piling up; it only works while this window remains the opener, which is why
   * there is deliberately no rel="noopener" here. See #5690.
   */
  openDocumentation(event: MouseEvent, url: string): void {
    if (this.documentationTarget() !== 'popup') {
      return;
    }
    event.preventDefault();
    window.open(url, DOCUMENTATION_WINDOW_NAME, 'width=1024,height=900');
  }

  public canAPIKeys: Signal<boolean>;
  // Which of the bound breadcrumb sets to show: the URL's ?breadcrumbs= value.
  private breadcrumbKey = signal<string | null>(null);
  public eventSeverity = InternalEventSeverity;

  readonly isMobile = this.dashboardSignals.isMobile;

  public environment = environment;

  // Menu state for Tailwind dropdowns
  public readonly isHistoryMenuOpen = signal(false);
  public readonly isUserMenuOpen = signal(false);
  public readonly isTokenMenuOpen = signal(false);

  readonly pageHeaderTmpl = viewChild.required<TemplateRef<any>>('pageHeaderTmpl');

  // Our own portal registered in ngAfterViewInit; used to verify ownership
  // before clearing, and to avoid wiping another component's portal.
  private myPortal: TemplatePortal<any> | null = null;
  // Whatever portal was registered with TabNavService before us; restored on
  // destroy. Handles nested page-headers (e.g. an inner component loaded
  // inside a modal registers its own page-header over ours — when it's
  // destroyed we rewind to our portal, when we're destroyed we rewind to the
  // previous owner instead of leaving the outlet empty).
  private previousPortal: Portal<any> | undefined;

  readonly hideSideNavButton = input(false);

  readonly hideEndpointErrors = input(false);

  readonly hideMenu = input(false);

  readonly endpointIds = input<string[]>();

  // Published to the side navigation by the effects in the constructor.
  readonly tabs = input<IPageSideNavTab[]>();

  readonly tabsHeader = input<string>();

  readonly showUnderFlow = input(false);

  readonly showHistory = input(true);
  // The logout-only menu never offers the history.
  readonly historyVisible = computed(() => !this.logoutOnly() && this.showHistory());

  private readonly eventService = inject(GlobalEventService);
  public readonly events = this.eventService.events;
  public readonly unreadEventCount = computed(() => this.events().filter(event => !event.read).length);

  readonly favorite = input<UserFavorite<IFavoriteMetadata> | null>();
  // The favorite the star is shown for: the last one bound that can be
  // favorited. A later null, or the same entity again, leaves it in place.
  readonly shownFavorite = linkedSignal<
    UserFavorite<IFavoriteMetadata> | null | undefined,
    UserFavorite<IFavoriteMetadata> | undefined
  >({
    source: this.favorite,
    computation: (favorite, previous) => {
      const shown = previous?.value;
      if (favorite && (!shown || favorite.guid !== shown.guid) && favorite.canFavorite()) {
        return favorite;
      }
      return shown;
    },
  });

  public readonly user = this.userProfileService.userProfile;
  public readonly username = computed(() => {
    const profile = this.user();
    if (!profile) {
      return null;
    }
    let name = profile.userName;
    if (profile.name) {
      name = profile.name.givenName + ' ' + profile.name.familyName;
      name = name.trim();
    }
    return name ? name : profile.userName;
  });
  public readonly allowGravatar = this.dashboardSignals.gravatarEnabled;
  public canLogout: Signal<boolean>;
  public authToken$!: Observable<string>;
  public refreshToken$!: Observable<string>;
  public tokenExpiry$!: Observable<Date | null>;

  public actionsKey: StratosActionType | null;

  readonly breadcrumbs = input<IHeaderBreadcrumb[] | null>();
  // The breadcrumb set the URL's key selects. null, which renders no
  // breadcrumbs element at all, only while [breadcrumbs] is not bound.
  readonly breadcrumbDefinitions = computed<IHeaderBreadcrumbLink[] | null>(() => {
    const breadcrumbs = this.breadcrumbs();
    return breadcrumbs === undefined ? null : this.getBreadcrumb(breadcrumbs);
  });

  // Used when non-admin logs in with no-endpoints -> only show logout in the menu
  readonly logoutOnly = input<boolean>();

  private getBreadcrumb(breadcrumbs: IHeaderBreadcrumb[] | null) {
    if (!breadcrumbs || !breadcrumbs.length) {
      return [];
    }
    return this.getBreadcrumbFromKey(breadcrumbs).breadcrumbs;
  }

  private getBreadcrumbFromKey(breadcrumbs: IHeaderBreadcrumb[]) {
    const key = this.breadcrumbKey();
    if (breadcrumbs.length === 1 || !key) {
      return breadcrumbs[0];
    }
    return breadcrumbs.find(breadcrumb => {
      return breadcrumb.key === key;
    }) || breadcrumbs[0];
  }

  logout() {
    this.router.navigate(['/login/logout']);
  }

  public toggleSidenav() {
    this.dashboardData.toggleSideNav();
  }

  constructor() {
    const route = this.route;
    this.actionsKey = this.route.snapshot.data ? this.route.snapshot.data.extensionsActionsKey : null;
    // Reactive breadcrumb key — re-resolves whenever the URL's
    // ?breadcrumbs= query param changes. Snapshot-only reads broke on
    // tab navigation that re-emits params, and on async query-param
    // arrival when the route resolves before the param lands. Seed
    // synchronously from snapshot so the initial render gets the key,
    // then subscribe reactively when queryParamMap is available.
    this.breadcrumbKey.set(route.snapshot?.queryParams?.[BREADCRUMB_URL_PARAM] || null);
    if (route.queryParamMap) {
      route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(qp => {
        this.breadcrumbKey.set(qp.get(BREADCRUMB_URL_PARAM) || null);
      });
    }

    // Publish the tabs and their header to the side navigation. Resolving the
    // links stays out of the effect's dependencies: only a new [tabs] value
    // publishes again.
    effect(() => {
      const tabs = this.tabs();
      if (tabs) {
        untracked(() => this.tabNavService.setTabs(tabs.map(tab => ({
          ...tab,
          link: tab.link === '-' ?
            TabNavService.TabsNoLinkValue :
            this.router.createUrlTree([tab.link], { relativeTo: this.route }).toString()
        }))));
      }
    });
    effect(() => {
      const header = this.tabsHeader();
      if (header) {
        this.tabNavService.setHeader(header);
      }
    });

    // A recently-visited record genuinely requires an entityId, name and
    // router link; only record entity favorites that carry all three.
    effect(() => {
      const favorite = this.shownFavorite();
      const entityId = favorite?.entityId;
      const metadata = favorite?.metadata;
      if (favorite && entityId && metadata) {
        untracked(() => this.recents.add({
          guid: favorite.guid,
          date: getTime(new Date()),
          entityType: favorite.entityType,
          endpointType: favorite.endpointType,
          entityId,
          name: metadata.name,
          routerLink: favorite.getLink() ?? undefined,
          prettyType: favorite.getPrettyTypeName(),
          endpointId: favorite.endpointId,
          metadata: { name: metadata.name },
        }));
      }
    });

    // The user menu shows the profile: fetch it once the menu is shown.
    effect(() => {
      if (!this.hideMenu() && !environment.hideUserMenu) {
        untracked(() => this.userProfileService.loadUserProfile());
      }
    });

    // Must be enabled and the user must have permission
    const apiKeysPermission = this.cups.can(StratosCurrentUserPermissions.API_KEYS);
    this.canAPIKeys = computed(() => !this.endpointsService.disablePersistenceFeatures() && apiKeysPermission());

    const noLogout = this.currentUserPermissionsService.can(StratosCurrentUserPermissions.CAN_NOT_LOGOUT);
    this.canLogout = computed(() => !noLogout());
  }

  // Fetch fresh token envelope — called every time the token menu opens so
  // the user can't grab a stale/expired token from a cached observable. The
  // three derived observables share one HTTP call via shareReplay(1).
  private refreshTokenObservables() {
    const env$ = this.http
      .get<AuthTokenEnvelope>(`/api/${environment.proxyAPIVersion}/auth/token`)
      .pipe(shareReplay(1));

    this.authToken$ = env$.pipe(map(res => res.data?.auth_token ?? ''));
    this.refreshToken$ = env$.pipe(map(res => res.data?.refresh_token ?? ''));
    this.tokenExpiry$ = env$.pipe(
      map(res => res.data ? new Date(res.data.token_expiry * 1000) : null)
    );
  }

  // Copy a token value to the clipboard without ever rendering it in the DOM.
  // The token$ observable is resolved at click time and piped straight into
  // the browser clipboard API — no hidden <div>{{ token }}</div> buffer.
  async copyToken(token$: Observable<string>, label: string) {
    try {
      const value = await firstValueFrom(token$);
      if (!value) {
        this.snackBarService.show(`No ${label} available`, 'Close');
        return;
      }
      await navigator.clipboard.writeText(value);
      this.snackBarService.show(`${label} copied to clipboard`, 'Close');
    } catch {
      this.snackBarService.show(`Failed to copy ${label}`, 'Close');
    }
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
    this.myPortal = new TemplatePortal(this.pageHeaderTmpl(), this.viewContainerRef, {});
    this.tabNavService.setPageHeader(this.myPortal);
  }

  // Tailwind dropdown menu methods
  toggleHistoryMenu() {
    this.isHistoryMenuOpen.update(open => !open);
    if (this.isHistoryMenuOpen()) {
      this.isUserMenuOpen.set(false);
      this.isTokenMenuOpen.set(false);
    }
  }

  toggleUserMenu() {
    this.isUserMenuOpen.update(open => !open);
    if (this.isUserMenuOpen()) {
      this.isHistoryMenuOpen.set(false);
      this.isTokenMenuOpen.set(false);
    }
  }

  toggleTokenMenu() {
    this.isTokenMenuOpen.update(open => !open);
    if (this.isTokenMenuOpen()) {
      this.isHistoryMenuOpen.set(false);
      this.isUserMenuOpen.set(false);
      this.refreshTokenObservables();
    }
  }

  toggleDocumentationTarget() {
    this.branding.setDocumentationTarget(this.documentationTarget() === 'popup' ? 'tab' : 'popup');
  }

  closeUserMenu() {
    this.isUserMenuOpen.set(false);
  }

  // Escape closes the open panel (user, token or history) and returns focus
  // to its button, as a disclosure does; a panel otherwise stays until its
  // button is used.
  @HostListener('document:keydown.escape')
  onEscape() {
    const open = this.isUserMenuOpen() ? 'userMenu'
      : this.isTokenMenuOpen() ? 'tokenMenu'
      : this.isHistoryMenuOpen() ? 'historyMenu'
      : null;
    if (!open) {
      return;
    }
    this.closeUserMenu();
    this.closeTokenMenu();
    this.closeHistoryMenu();
    // The header renders through a portal, outside this component's view.
    document.getElementById(open)?.focus();
  }

  closeHistoryMenu() {
    this.isHistoryMenuOpen.set(false);
  }

  closeTokenMenu() {
    this.isTokenMenuOpen.set(false);
  }

}

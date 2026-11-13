import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Portal, PortalModule } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, AfterViewInit, Component, ElementRef, OnDestroy, OnInit, computed, signal, ViewContainerRef, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Route, Router, RouterModule } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  entityCatalog,
  UserFavoritesDataService,
} from '@stratosui/store';
import { DashboardSignalService } from '../../../core/signals/dashboard-signal.service';
import { DashboardDataService, DashboardState } from '../../../core/dashboard-data.service';
import { Observable, of, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith } from 'rxjs/operators';

import { CustomizationService } from '../../../core/customizations.types';
import { naturalCompare } from '../../../shared/utils/natural-sort';
import { EndpointsService } from '../../../core/endpoints.service';
import { IHeaderBreadcrumbLink } from '../../../shared/components/page-header/page-header.types';
import { EndpointReauthReportService } from '../../../shared/services/endpoint-reauth-report.service';
import { SidePanelMode, SidePanelService } from '../../../shared/services/side-panel.service';
import { TabNavService } from '../../../tab-nav.service';
import { PageSideNavComponent, IPageSideNavTab } from '../page-side-nav/page-side-nav.component';
import { PageHeaderService } from './../../../core/page-header-service/page-header.service';
import { SideNavComponent, SideNavItem } from './../side-nav/side-nav.component';
import { RoutingIndicatorComponent } from '../../../shared/components/routing-indicator/routing-indicator.component';
import { ShowPageHeaderComponent } from '../../../shared/components/page-header/show-page-header/show-page-header.component';

// simplification: hidden or inert controls count as focusable, which keeps
// main out of the tab order (as before); filter by visibility if a page
// with only hidden controls turns up.
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable]:not([contenteditable="false"])';

@Component({
  selector: 'app-dashboard-base',
  templateUrl: './dashboard-base.component.html',
  styleUrls: ['./dashboard-base.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PortalModule,
    SideNavComponent,
    PageSideNavComponent,
    ShowPageHeaderComponent,
    RoutingIndicatorComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DashboardBaseComponent implements OnInit, OnDestroy, AfterViewInit {
  pageHeaderService = inject(PageHeaderService);
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private endpointsService = inject(EndpointsService);
  tabNavService = inject(TabNavService);
  sidePanelService = inject(SidePanelService);
  private cs = inject(CustomizationService);
  private dashboardSignals = inject(DashboardSignalService);
  private dashboardData = inject(DashboardDataService);
  private userFavorites = inject(UserFavoritesDataService);
  private endpointReauthReport = inject(EndpointReauthReportService);

  public activeTabLabel$!: Observable<string>;
  public readonly subNavData = computed<[string | null, Portal<any> | undefined, IPageSideNavTab | null, IHeaderBreadcrumbLink[] | undefined]>(() => {
    const tabNav = this.tabNavService.currentTabHeader();
    return [tabNav ? tabNav.label : null, this.tabNavService.tabSubNav(), tabNav, this.tabNavService.tabSubNavBreadcrumbs()];
  });
  public isMobile$: Observable<boolean> = of(false);
  public sideNavMode$!: Observable<string>;
  public sideNavMode!: string;
  public mainNavState$: Observable<{ mode: string; opened: boolean; iconMode: boolean, }> = of({ mode: 'side', opened: true, iconMode: false });
  public rightNavState$!: Observable<{ opened: boolean, component?: object, props?: object, }>;
  private dashboardState$: Observable<DashboardState> = of({} as DashboardState);
  public noMargin$: Observable<boolean> = of(false);
  private mobileSub: Subscription;
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  public iconModeOpen = false;
  public sideNavWidth = 54;

  sideNavTabs: SideNavItem[] = this.getNavigationRoutes();
  sideNaveMode = 'side';

  readonly previewPanelContainer = viewChild.required('previewPanelContainer', { read: ViewContainerRef });

  public readonly content = viewChild<ElementRef<HTMLElement>>('content');

  showScrollShadow = signal(false);
  mainTabStop = signal(false);

  // Slide-in side panel mode
  sidePanelMode: SidePanelMode = SidePanelMode.Modal;

  constructor() {
    this.noMargin$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.isNoMarginView(this.activatedRoute.snapshot)),
      startWith(this.isNoMarginView(this.activatedRoute.snapshot))
    );
    this.isMobile$ = this.breakpointObserver.observe([Breakpoints.Small, Breakpoints.XSmall]).pipe(
      map(breakpoint => breakpoint.matches),
      startWith(false),
      distinctUntilChanged()
    );
    this.dashboardState$ = toObservable(this.dashboardSignals.dashboard);
    this.mainNavState$ = this.dashboardState$.pipe(
      map(state => {
        if (state.isMobile) {
          return {
            mode: 'over',
            opened: state.isMobileNavOpen || false,
            iconMode: false
          };
        } else {
          return {
            mode: state.sideNavPinned ? 'side' : 'over',
            opened: true,
            iconMode: !state.sidenavOpen
          };
        }
      })
    );

    this.mobileSub = this.isMobile$
      .subscribe(isMobile => isMobile ? this.dashboardData.enableMobileNav() : this.dashboardData.disableMobileNav());
  }

  ngAfterViewInit() {
    this.sidePanelService.setContainer(this.previewPanelContainer());

    const el = this.content()?.nativeElement;
    if (!el) return;
    this.updateScrollShadow(el);

    // Viewport/container size changes shift clientHeight.
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.updateScrollShadow());
      this.resizeObserver.observe(el);
    }

    // Route swaps, async-rendered content and native <details> toggles change
    // scrollHeight without any scroll or resize event.
    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => this.updateScrollShadow());
      // attributes:true catches native <details> open-toggles, which change
      // scrollHeight without adding or removing nodes.
      this.mutationObserver.observe(el, { childList: true, subtree: true, attributes: true });
    }
  }

  ngOnInit() {
    // Register all health checks for endpoint types that support this
    entityCatalog.getAllEndpointTypes().forEach(epType => {
      if (epType && epType.definition && epType.definition.healthCheck) {
        this.endpointsService.registerHealthCheck(epType.definition.healthCheck);
      }
    });

    // CF current-user roles now fetch via CfEndpointRoleSyncService's signal
    // effect on connected CF endpoints (favorites/roles island Wave 2) — no
    // dashboard-load dispatch needed.
    // Initialize user favorites - fire and forget, no subscription needed
    this.userFavorites.load();

    // Once-per-session arrival report of endpoints that already need
    // re-authentication - fire and forget, no subscription needed.
    void this.endpointReauthReport.reportOnce();
  }

  ngOnDestroy() {
    if (this.mobileSub) {
      this.mobileSub.unsubscribe();
    }
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    this.sidePanelService.unsetContainer();
  }

  onContentScroll(event: Event) {
    const el = event.target as HTMLElement;
    this.updateScrollShadow(el);
  }

  // The skip link focuses the main landmark itself; the default fragment
  // navigation would go through the router and leave focus on the link.
  skipToContent(event: Event) {
    event.preventDefault();
    this.content()?.nativeElement.focus();
  }

  private updateScrollShadow(el?: HTMLElement) {
    if (!el) {
      el = this.content()?.nativeElement;
    }
    if (!el) return;
    const hasMore = el.scrollHeight > el.clientHeight && el.scrollTop + el.clientHeight < el.scrollHeight - 4;
    if (this.showScrollShadow() !== hasMore) {
      this.showScrollShadow.set(hasMore);
    }
    // WCAG 2.1.1: a page that scrolls with nothing focusable in it can only
    // be scrolled from the keyboard if main itself takes a tab stop. A page
    // with controls keeps main out of the tab order: arrow keys scroll it
    // once focus is inside.
    const tabStop = el.scrollHeight > el.clientHeight && !el.querySelector(FOCUSABLE);
    if (this.mainTabStop() !== tabStop) {
      this.mainTabStop.set(tabStop);
    }
  }

  isNoMarginView(route: ActivatedRouteSnapshot): boolean {
    while (route.firstChild) {
      route = route.firstChild;
      if (route.data.uiNoMargin) {
        return true;
      }
    }
    return false;
  }

  private getNavigationRoutes(): SideNavItem[] {
    let navItems = this.collectNavigationRoutes('', this.router.config);

    // Sort by name
    navItems = navItems.sort((a: SideNavItem, b: SideNavItem) => naturalCompare(a.label, b.label));

    // Sort by position
    navItems = navItems.sort((a: SideNavItem, b: SideNavItem) => {
      const posA = a.position ? a.position : 99;
      const posB = b.position ? b.position : 99;
      return posA - posB;
    });

    return navItems;
  }

  private collectNavigationRoutes(path: string | undefined, routes: Route[] | undefined): SideNavItem[] {
    if (!routes) {
      return [];
    }
    return routes.reduce((nav: SideNavItem[], route: Route) => {
      if (route.data && route.data.stratosNavigation) {
        const item: SideNavItem = {
          ...route.data.stratosNavigation,
          link: path + '/' + route.path
        };
        if (item.requiresEndpointType) {
          // Upstream always likes to show Cloud Foundry related endpoints - other distributions can change this behaviour
          const alwaysShowNavFor = this.cs.get().alwaysShowNavForEndpointTypes;
          const alwaysShow = alwaysShowNavFor ?
            alwaysShowNavFor(item.requiresEndpointType) : (item.requiresEndpointType === 'cf');
          item.hidden = alwaysShow ? signal(false) : this.endpointsService.noConnectedEndpointOfType(item.requiresEndpointType);
        } else if (item.requiresPersistence) {
          item.hidden = this.endpointsService.disablePersistenceFeatures;
        }
        // Backwards compatibility (text became label)
        if (!item.label && !!item.text) {
          item.label = item.text;
        }
        nav.push(item);
      }

      const navs = this.collectNavigationRoutes(route.path, route.children);
      return nav.concat(navs);
    }, []);
  }
}

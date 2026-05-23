import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Portal, PortalModule } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, AfterViewInit, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, signal, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Route, Router, RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  AppState,
  GetCurrentUsersRelations,
  Store,
  entityCatalog,
  stratosEntityCatalog,
} from '@stratosui/store';
import { DashboardSignalService } from '../../../core/signals/dashboard-signal.service';
import { DashboardDataService, DashboardState } from '../../../core/dashboard-data.service';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { delay, distinctUntilChanged, filter, map, startWith, withLatestFrom } from 'rxjs/operators';

import { CustomizationService } from '../../../core/customizations.types';
import { naturalCompare } from '../../../shared/utils/natural-sort';
import { EndpointsService } from '../../../core/endpoints.service';
import { IHeaderBreadcrumbLink } from '../../../shared/components/page-header/page-header.types';
import { SidePanelMode, SidePanelService } from '../../../shared/services/side-panel.service';
import { TabNavService } from '../../../tab-nav.service';
import { PageSideNavComponent, IPageSideNavTab } from '../page-side-nav/page-side-nav.component';
import { PageHeaderService } from './../../../core/page-header-service/page-header.service';
import { SideNavComponent, SideNavItem } from './../side-nav/side-nav.component';
import { RoutingIndicatorComponent } from '../../../shared/components/routing-indicator/routing-indicator.component';
import { ShowPageHeaderComponent } from '../../../shared/components/page-header/show-page-header/show-page-header.component';

@Component({
  selector: 'app-dashboard-base',
  templateUrl: './dashboard-base.component.html',
  styleUrls: ['./dashboard-base.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PortalModule,
    ScrollingModule,
    SideNavComponent,
    PageSideNavComponent,
    ShowPageHeaderComponent,
    RoutingIndicatorComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DashboardBaseComponent implements OnInit, OnDestroy, AfterViewInit {
  pageHeaderService = inject(PageHeaderService);
  private store = inject<Store<AppState>>(Store);
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private endpointsService = inject(EndpointsService);
  tabNavService = inject(TabNavService);
  private ngZone = inject(NgZone);
  sidePanelService = inject(SidePanelService);
  private cs = inject(CustomizationService);
  private cd = inject(ChangeDetectorRef);
  private dashboardSignals = inject(DashboardSignalService);
  private dashboardData = inject(DashboardDataService);

  public activeTabLabel$!: Observable<string>;
  public subNavData$!: Observable<[string, Portal<any>, IPageSideNavTab, IHeaderBreadcrumbLink[]]>;
  public isMobile$: Observable<boolean> = of(false);
  public sideNavMode$!: Observable<string>;
  public sideNavMode!: string;
  public mainNavState$: Observable<{ mode: string; opened: boolean; iconMode: boolean, }> = of({ mode: 'side', opened: true, iconMode: false });
  public rightNavState$!: Observable<{ opened: boolean, component?: object, props?: object, }>;
  private dashboardState$: Observable<DashboardState> = of({} as DashboardState);
  public noMargin$: Observable<boolean> = of(false);
  private closeSub!: Subscription;
  private routerSub!: Subscription;
  private mobileSub: Subscription;
  private drawer: any;
  public iconModeOpen = false;
  public sideNavWidth = 54;

  sideNavTabs: SideNavItem[] = this.getNavigationRoutes();
  sideNaveMode = 'side';

  @ViewChild('previewPanelContainer', { read: ViewContainerRef, static: false }) previewPanelContainer!: ViewContainerRef;

  @ViewChild('content', { static: false }) public content!: ElementRef<HTMLElement>;

  showScrollShadow = signal(false);

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

  @ViewChild('sidenav') set sidenav(drawer: any) {
    this.drawer = drawer;
    if (!this.closeSub && drawer && drawer.closedStart) {
      // We need this for mobile to ensure the state is synced when the dashboard is closed by clicking on the backdrop.
      this.closeSub = drawer.closedStart.pipe(withLatestFrom(this.dashboardState$)).subscribe(([_change, state]: [any, DashboardState]) => {
        if (state.isMobile) {
          this.dashboardData.closeSideNav();
        }
      });
    }
  }

  public redrawSideNav() {
    // We need to do this to ensure there isn't a space left behind
    // when going from mobile to desktop
    if (this.drawer && this.drawer._modeChanged) {
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => this.drawer._modeChanged.next(), 250);
      });
    }
  }

  dispatchRelations() {
    this.store.dispatch(new GetCurrentUsersRelations());
  }

  sideHelpClosed() {
    this.sidePanelService.hide();
  }

  ngAfterViewInit() {
    this.sidePanelService.setContainer(this.previewPanelContainer);
  }

  ngOnInit() {
    this.subNavData$ = combineLatest([
      this.tabNavService.getCurrentTabHeaderObservable().pipe(
        startWith(null)
      ),
      this.tabNavService.tabSubNav$,
      this.tabNavService.tabSubNavBreadcrumbs$
    ]).pipe(map(([tabNav, tabSubNav, tabSubNavBreadcrumb]: [any, any, any]) => [tabNav ? tabNav.label : null, tabSubNav, tabNav, tabSubNavBreadcrumb]));

    // Register all health checks for endpoint types that support this
    entityCatalog.getAllEndpointTypes().forEach(epType => {
      if (epType && epType.definition && epType.definition.healthCheck) {
        this.endpointsService.registerHealthCheck(epType.definition.healthCheck);
      }
    });

    this.dispatchRelations();
    // Initialize user favorites - fire and forget action, no subscription needed
    stratosEntityCatalog.userFavorite.api.getAll();

    // Re-evaluate scroll shadow after route changes (content height changes)
    // Use delay(100) to let the new route's content render before measuring
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      delay(100)
    ).subscribe(() => this.updateScrollShadow());
  }

  ngOnDestroy() {
    if (this.mobileSub) {
      this.mobileSub.unsubscribe();
    }
    if (this.closeSub) {
      this.closeSub.unsubscribe();
    }
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
    this.sidePanelService.unsetContainer();
  }

  onContentScroll(event: Event) {
    const el = event.target as HTMLElement;
    this.updateScrollShadow(el);
  }

  private updateScrollShadow(el?: HTMLElement) {
    if (!el) {
      el = this.content?.nativeElement;
    }
    if (!el) return;
    const hasMore = el.scrollHeight > el.clientHeight && el.scrollTop + el.clientHeight < el.scrollHeight - 4;
    if (this.showScrollShadow() !== hasMore) {
      this.showScrollShadow.set(hasMore);
      this.cd.markForCheck();
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

  private collectNavigationRoutes(path: string, routes: Route[]): SideNavItem[] {
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
          const alwaysShow = this.cs.get().alwaysShowNavForEndpointTypes ?
            this.cs.get().alwaysShowNavForEndpointTypes(item.requiresEndpointType) : (item.requiresEndpointType === 'cf');
          item.hidden = alwaysShow ? of(false) : this.endpointsService.doesNotHaveConnectedEndpointType(item.requiresEndpointType);
        } else if (item.requiresPersistence) {
          item.hidden = this.endpointsService.disablePersistenceFeatures$.pipe(startWith(true));
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

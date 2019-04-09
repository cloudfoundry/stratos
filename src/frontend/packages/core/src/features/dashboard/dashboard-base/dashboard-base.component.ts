import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Portal } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import { AfterContentInit, Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material';
import { ActivatedRoute, ActivatedRouteSnapshot, Route, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, map, startWith, withLatestFrom } from 'rxjs/operators';
import { GetCFInfo } from '../../../../../store/src/actions/cloud-foundry.actions';
import { CloseSideHelp, DisableMobileNav, EnableMobileNav, CloseSideNav } from '../../../../../store/src/actions/dashboard-actions';
import { GetCurrentUsersRelations } from '../../../../../store/src/actions/permissions.actions';
import { GetUserFavoritesAction } from '../../../../../store/src/actions/user-favourites-actions/get-user-favorites-action';
import { AppState } from '../../../../../store/src/app-state';
import { DashboardState } from '../../../../../store/src/reducers/dashboard-reducer';
import { EndpointHealthCheck } from '../../../../endpoints-health-checks';
import { TabNavService } from '../../../../tab-nav.service';
import { EndpointsService } from '../../../core/endpoints.service';
import { PageHeaderService } from './../../../core/page-header-service/page-header.service';
import { SideNavItem } from './../side-nav/side-nav.component';



@Component({
  selector: 'app-dashboard-base',
  templateUrl: './dashboard-base.component.html',
  styleUrls: ['./dashboard-base.component.scss']
})

export class DashboardBaseComponent implements OnInit, OnDestroy, AfterContentInit {
  public activeTabLabel$: Observable<string>;
  public subNavData$: Observable<[string, Portal<any>]>;
  public isMobile$: Observable<boolean>;
  public sideNavMode$: Observable<string>;
  public sideNavMode: string;

  constructor(
    public pageHeaderService: PageHeaderService,
    private store: Store<AppState>,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private endpointsService: EndpointsService,
    public tabNavService: TabNavService,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.isMobile$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
      map(breakpoint => breakpoint.matches),
      startWith(false),
      distinctUntilChanged()
    );

    this.mobileSub = this.isMobile$
      .subscribe(isMobile => isMobile ? this.store.dispatch(new EnableMobileNav()) : this.store.dispatch(new DisableMobileNav()));
  }

  public helpDocumentUrl: string;

  private openCloseSub: Subscription;
  private closeSub: Subscription;

  public fullView: boolean;
  public noMargin: boolean;

  private routeChangeSubscription: Subscription;

  private mobileSub: Subscription;

  @ViewChild('sidenav') public sidenav: MatDrawer;

  @ViewChild('sideHelp') public sideHelp: MatDrawer;
  @ViewChild('content') public content;

  sideNavTabs: SideNavItem[] = this.getNavigationRoutes();

  sideNaveMode = 'side';

  public iconModeOpen = false;
  public sideNavWidth = 54;

  dispatchRelations() {
    this.store.dispatch(new GetCurrentUsersRelations());
  }

  ngOnInit() {
    this.subNavData$ = combineLatest(
      this.tabNavService.getCurrentTabHeaderObservable().pipe(
        startWith(null)
      ),
      this.tabNavService.tabSubNav$
    );
    this.endpointsService.registerHealthCheck(
      new EndpointHealthCheck('cf', (endpoint) => this.store.dispatch(new GetCFInfo(endpoint.guid)))
    );
    this.dispatchRelations();
    this.store.dispatch(new GetUserFavoritesAction());
    this.fullView = this.isFullView(this.activatedRoute.snapshot);
    this.noMargin = this.isNoMarginView(this.activatedRoute.snapshot);
  }

  ngOnDestroy() {
    this.routeChangeSubscription.unsubscribe();
    this.mobileSub.unsubscribe();
    this.closeSub.unsubscribe();
    this.openCloseSub.unsubscribe();
  }

  isFullView(route: ActivatedRouteSnapshot): boolean {
    while (route.firstChild) {
      route = route.firstChild;
      if (route.data.uiFullView) {
        return true;
      }
    }
    return false;
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

  ngAfterContentInit() {
    const dashboardState$ = this.store.select('dashboard');
    // We need this for mobile to ensure the state is synced when the dashboard is closed by clicking on the backdrop.
    this.closeSub = this.sidenav.closedStart.pipe(withLatestFrom(dashboardState$)).subscribe(([change, state]) => {
      if (state.isMobile) {
        this.store.dispatch(new CloseSideNav());
      }
    });
    this.openCloseSub = dashboardState$
      .subscribe((dashboard: DashboardState) => {
        if (dashboard.isMobile) {
          this.sideNavMode = 'over';
          dashboard.isMobileNavOpen ? this.sidenav.open() : this.sidenav.close();
        } else {
          this.sideNavMode = 'side';
          dashboard.sidenavOpen ? this.sidenav.open() : this.sidenav.close();
        }
        if (dashboard.sideHelpOpen) {
          this.showSideHelp(dashboard.sideHelpDocument);
        }
      });
  }

  private showSideHelp(documentUrl: string) {
    this.helpDocumentUrl = documentUrl;
    this.sideHelp.open();
  }

  public sideHelpClosed() {
    this.store.dispatch(new CloseSideHelp());
  }

  private getNavigationRoutes(): SideNavItem[] {
    let navItems = this.collectNavigationRoutes('', this.router.config);

    // Sort by name
    navItems = navItems.sort((a: SideNavItem, b: SideNavItem) => a.label.localeCompare(b.label));

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
    return routes.reduce((nav, route) => {
      if (route.data && route.data.stratosNavigation) {
        const item = {
          ...route.data.stratosNavigation,
          link: path + '/' + route.path
        };
        if (item.requiresEndpointType) {
          item.hidden = this.endpointsService.doesNotHaveConnectedEndpointType(item.requiresEndpointType);
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

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Portal } from '@angular/cdk/portal';
import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Route, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith, withLatestFrom } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../../../cloud-foundry/cf-types';
import { GetCurrentUsersRelations } from '../../../../../cloud-foundry/src/actions/permissions.actions';
import { cfInfoEntityType } from '../../../../../cloud-foundry/src/cf-entity-factory';
import {
  CfInfoDefinitionActionBuilders,
} from '../../../../../cloud-foundry/src/entity-action-builders/cf-info.action-builders';
import {
  CloseSideHelp,
  CloseSideNav,
  DisableMobileNav,
  EnableMobileNav,
} from '../../../../../store/src/actions/dashboard-actions';
import { GetUserFavoritesAction } from '../../../../../store/src/actions/user-favourites-actions/get-user-favorites-action';
import { DashboardOnlyAppState } from '../../../../../store/src/app-state';
import { DashboardState } from '../../../../../store/src/reducers/dashboard-reducer';
import { selectDashboardState } from '../../../../../store/src/selectors/dashboard.selectors';
import { EndpointHealthCheck } from '../../../../endpoints-health-checks';
import { TabNavService } from '../../../../tab-nav.service';
import { EndpointsService } from '../../../core/endpoints.service';
import { entityCatalogue } from '../../../core/entity-catalogue/entity-catalogue.service';
import { IEntityMetadata } from '../../../core/entity-catalogue/entity-catalogue.types';
import { PageHeaderService } from './../../../core/page-header-service/page-header.service';
import { SideNavItem } from './../side-nav/side-nav.component';


@Component({
  selector: 'app-dashboard-base',
  templateUrl: './dashboard-base.component.html',
  styleUrls: ['./dashboard-base.component.scss']
})

export class DashboardBaseComponent implements OnInit, OnDestroy {
  public activeTabLabel$: Observable<string>;
  public subNavData$: Observable<[string, Portal<any>]>;
  public isMobile$: Observable<boolean>;
  public sideNavMode$: Observable<string>;
  public sideNavMode: string;
  public mainNavState$: Observable<{ mode: string; opened: boolean; iconMode: boolean }>;
  public rightNavState$: Observable<{ opened: boolean; documentUrl: string; }>;
  private dashboardState$: Observable<DashboardState>;
  private drawer: MatDrawer;

  constructor(
    public pageHeaderService: PageHeaderService,
    private store: Store<DashboardOnlyAppState>,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private endpointsService: EndpointsService,
    public tabNavService: TabNavService,
    private ngZone: NgZone,
  ) {
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
    this.dashboardState$ = this.store.select(selectDashboardState);
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
    this.rightNavState$ = this.dashboardState$.pipe(
      map(state => ({
        opened: !!state.sideHelpDocument && state.sideHelpOpen,
        documentUrl: state.sideHelpDocument
      }))
    );
    this.mobileSub = this.isMobile$
      .subscribe(isMobile => isMobile ? this.store.dispatch(new EnableMobileNav()) : this.store.dispatch(new DisableMobileNav()));
  }

  public helpDocumentUrl: string;

  private closeSub: Subscription;

  public noMargin$: Observable<boolean>;

  private mobileSub: Subscription;

  @ViewChild('sidenav') set sidenav(drawer: MatDrawer) {
    this.drawer = drawer;
    if (!this.closeSub) {
      // We need this for mobile to ensure the state is synced when the dashboard is closed by clicking on the backdrop.
      this.closeSub = drawer.closedStart.pipe(withLatestFrom(this.dashboardState$)).subscribe(([change, state]) => {
        if (state.isMobile) {
          this.store.dispatch(new CloseSideNav());
        }
      });
    }
  }

  @ViewChild('content') public content;

  sideNavTabs: SideNavItem[] = this.getNavigationRoutes();

  sideNaveMode = 'side';

  public iconModeOpen = false;
  public sideNavWidth = 54;

  public redrawSideNav() {
    // We need to do this to ensure there isn't a space left behind
    // when going from mobile to desktop
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => this.drawer._modeChanged.next(), 250);
    });
  }

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
      new EndpointHealthCheck('cf', (endpoint) => {
        entityCatalogue.getEntity<IEntityMetadata, any, CfInfoDefinitionActionBuilders>(CF_ENDPOINT_TYPE, cfInfoEntityType)
          .actionDispatchManager.dispatchGet(endpoint.guid);
      })
    );
    this.dispatchRelations();
    this.store.dispatch(new GetUserFavoritesAction());
  }

  ngOnDestroy() {
    this.mobileSub.unsubscribe();
    this.closeSub.unsubscribe();
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
        const item: SideNavItem = {
          ...route.data.stratosNavigation,
          link: path + '/' + route.path
        };
        if (item.requiresEndpointType) {
          item.hidden = this.endpointsService.doesNotHaveConnectedEndpointType(item.requiresEndpointType);
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

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DOCUMENT } from '@angular/common';
import { AfterContentInit, Component, Inject, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Route, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { debounceTime, filter, startWith, withLatestFrom } from 'rxjs/operators';

import { GetCFInfo } from '../../../../../store/src/actions/cloud-foundry.actions';
import {
  ChangeSideNavMode,
  CloseSideHelp,
  CloseSideNav,
  OpenSideNav,
} from '../../../../../store/src/actions/dashboard-actions';
import { GetCurrentUsersRelations } from '../../../../../store/src/actions/permissions.actions';
import { GetUserFavoritesAction } from '../../../../../store/src/actions/user-favourites-actions/get-user-favorites-action';
import { AppState } from '../../../../../store/src/app-state';
import { DashboardState } from '../../../../../store/src/reducers/dashboard-reducer';
import { EndpointHealthCheck } from '../../../../endpoints-health-checks';
import { EndpointsService } from '../../../core/endpoints.service';
import { PageHeaderService } from './../../../core/page-header-service/page-header.service';
import { SideNavItem } from './../side-nav/side-nav.component';

@Component({
  selector: 'app-dashboard-base',
  templateUrl: './dashboard-base.component.html',
  styleUrls: ['./dashboard-base.component.scss']
})

export class DashboardBaseComponent implements OnInit, OnDestroy, AfterContentInit {

  constructor(
    public pageHeaderService: PageHeaderService,
    private store: Store<AppState>,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private endpointsService: EndpointsService,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2
  ) {
    if (this.breakpointObserver.isMatched(Breakpoints.Handset)) {
      this.enableMobileNav();
    }
  }

  public helpDocumentUrl: string;

  private openCloseSub: Subscription;
  private closeSub: Subscription;

  public fullView: boolean;
  public noMargin: boolean;

  private routeChangeSubscription: Subscription;

  private breakpointSub: Subscription;

  @ViewChild('sidenav') public sidenav: MatDrawer;

  @ViewChild('sideHelp') public sideHelp: MatDrawer;

  sideNavTabs: SideNavItem[] = this.getNavigationRoutes();

  sideNaveMode = 'side';
  dispatchRelations() {
    this.store.dispatch(new GetCurrentUsersRelations());
  }
  ngOnInit() {
    this.endpointsService.registerHealthCheck(
      new EndpointHealthCheck('cf', (endpoint) => this.store.dispatch(new GetCFInfo(endpoint.guid)))
    );
    this.dispatchRelations();
    this.store.dispatch(new GetUserFavoritesAction());
    const dashboardState$ = this.store.select('dashboard');
    this.fullView = this.isFullView(this.activatedRoute.snapshot);
    this.noMargin = this.isNoMarginView(this.activatedRoute.snapshot);
    this.routeChangeSubscription = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      withLatestFrom(dashboardState$)
    ).subscribe(([event, dashboard]) => {
      this.fullView = this.isFullView(this.activatedRoute.snapshot);
      this.noMargin = this.isNoMarginView(this.activatedRoute.snapshot);
      if (dashboard.sideNavMode === 'over' && dashboard.sidenavOpen) {
        this.sidenav.close();
      }
      if (dashboard.sideHelpOpen) {
        this.sideHelp.close();
      }

    });
  }

  ngOnDestroy() {
    this.routeChangeSubscription.unsubscribe();
    this.breakpointSub.unsubscribe();
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
    this.breakpointSub = this.breakpointObserver.observe([Breakpoints.HandsetPortrait]).pipe(
      debounceTime(250)
    ).subscribe(result => {
      if (result.matches) {
        this.enableMobileNav();
      } else {
        this.disableMobileNav();
      }
    });

    this.closeSub = this.sidenav.openedChange.pipe(filter(isOpen => !isOpen)).subscribe(() => {
      this.store.dispatch(new CloseSideNav());
    });

    const dashboardState$ = this.store.select('dashboard');
    this.openCloseSub = dashboardState$
      .subscribe((dashboard: DashboardState) => {
        dashboard.sidenavOpen ? this.sidenav.open() : this.sidenav.close();
        this.sidenav.mode = dashboard.sideNavMode;
        if (dashboard.sideHelpOpen) {
          this.showSideHelp(dashboard.sideHelpDocument);
        }
      });
  }

  private showSideHelp(documentUrl: string) {
    // Need to hide any open dialogs first
    this.hideShowOverlays(true);
    this.helpDocumentUrl = documentUrl;
    this.sideHelp.open();
  }

  public sideHelpClosed() {
    this.hideShowOverlays(false);
    this.store.dispatch(new CloseSideHelp());

  }

  private hideShowOverlays(hide: boolean) {
    const overlay = this.document.querySelector('.cdk-overlay-container');
    if (!!overlay) {
      const display = hide ? 'none' : 'unset';
      this.renderer.setStyle(overlay, 'display', display);
    }
  }

  private enableMobileNav() {
    this.store.dispatch(new CloseSideNav());
    this.store.dispatch(new ChangeSideNavMode('over'));
  }

  private disableMobileNav() {
    this.store.dispatch(new OpenSideNav());
    this.store.dispatch(new ChangeSideNavMode('side'));
  }

  private getNavigationRoutes(): SideNavItem[] {
    let navItems = this.collectNavigationRoutes('', this.router.config);

    // Sort by name
    navItems = navItems.sort((a: any, b: any) => a.text.localeCompare(b.text));

    // Sort by position
    navItems = navItems.sort((a: any, b: any) => {
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
        nav.push(item);
      }

      const navs = this.collectNavigationRoutes(route.path, route.children);
      return nav.concat(navs);
    }, []);
  }
}

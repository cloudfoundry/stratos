import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AfterContentInit, Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material';
import { Router, ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd } from '@angular/router';

import { Store } from '@ngrx/store';
import { debounceTime } from 'rxjs/operators';

import { AppState } from '../../../store/app-state';
import { EventWatcherService } from './../../../core/event-watcher/event-watcher.service';
import { PageHeaderService } from './../../../core/page-header-service/page-header.service';
import { ChangeSideNavMode, CloseSideNav, OpenSideNav } from './../../../store/actions/dashboard-actions';
import { DashboardState } from './../../../store/reducers/dashboard-reducer';
import { SideNavItem } from './../side-nav/side-nav.component';
import { isFulfilled } from 'q';
import { Subscription } from 'rxjs/Subscription';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard-base',
  templateUrl: './dashboard-base.component.html',
  styleUrls: ['./dashboard-base.component.scss']
})

export class DashboardBaseComponent implements OnInit, OnDestroy, AfterContentInit {

  private closeSub: Subscription;

  private fullView: boolean;

  private routeChangeSubscription: Subscription;

  private breakpointSub: Subscription;

  @ViewChild('sidenav') public sidenav: MatDrawer;

  sideNavTabs: SideNavItem[] = [
    {
      text: 'Dashboard',
      matIcon: 'assessment',
      link: '/dashboard',
      // Experimental - only show in development
      hidden: environment.production,
    },
    {
      text: 'Applications',
      matIcon: 'apps',
      link: '/applications'
    },
    {
      text: 'Services',
      matIcon: 'library_books',
      link: '/service-catalog'
    },
    {
      text: 'Cloud Foundry',
      matIcon: 'cloud',
      link: '/cloud-foundry'
    },
    {
      text: 'Endpoints',
      matIcon: 'settings_ethernet',
      link: '/endpoints'
    },
  ];

  sideNaveMode = 'side';
  constructor(
    public pageHeaderService: PageHeaderService,
    private store: Store<AppState>,
    private eventWatcherService: EventWatcherService,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    if (this.breakpointObserver.isMatched(Breakpoints.Handset)) {
      this.enableMobileNav();
    }
  }



  ngOnInit() {
    this.fullView = this.isFullView(this.activatedRoute.snapshot);
    this.routeChangeSubscription = this.router.events
      .filter((event) => event instanceof NavigationEnd)
      .subscribe((event) => {
        this.fullView = this.isFullView(this.activatedRoute.snapshot);
      });
  }

  ngOnDestroy() {
    this.routeChangeSubscription.unsubscribe();
    this.breakpointSub.unsubscribe();
    this.closeSub.unsubscribe();
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

  ngAfterContentInit() {
    this.breakpointSub = this.breakpointObserver.observe([
      Breakpoints.Handset
    ]).pipe(
      debounceTime(250)
    ).subscribe(result => {
      if (result.matches) {
        this.enableMobileNav();
      } else {
        this.disableMobileNav();
      }
    });

    this.closeSub = this.sidenav.onClose.subscribe(() => {
      this.store.dispatch(new CloseSideNav());
    });

    this.store.select('dashboard')
      .subscribe((dashboard: DashboardState) => {
        dashboard.sidenavOpen ? this.sidenav.open() : this.sidenav.close();
        this.sidenav.mode = dashboard.sideNavMode;
      });
  }

  private enableMobileNav() {
    this.store.dispatch(new CloseSideNav());
    this.store.dispatch(new ChangeSideNavMode('over'));
  }

  private disableMobileNav() {
    this.store.dispatch(new OpenSideNav());
    this.store.dispatch(new ChangeSideNavMode('side'));
  }
}

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AfterContentInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material';
import { Store } from '@ngrx/store';
import { debounceTime } from 'rxjs/operators';

import { AppState } from '../../../store/app-state';
import { EventWatcherService } from './../../../core/event-watcher/event-watcher.service';
import { PageHeaderService } from './../../../core/page-header-service/page-header.service';
import { ChangeSideNavMode, CloseSideNav } from './../../../store/actions/dashboard-actions';
import { DashboardState } from './../../../store/reducers/dashboard-reducer';
import { SideNavItem } from './../side-nav/side-nav.component';

@Component({
  selector: 'app-dashboard-base',
  templateUrl: './dashboard-base.component.html',
  styleUrls: ['./dashboard-base.component.scss']
})

export class DashboardBaseComponent implements AfterContentInit {

  constructor(
    public pageHeaderService: PageHeaderService,
    private store: Store<AppState>,
    private eventWatcherService: EventWatcherService,
    private breakpointObserver: BreakpointObserver
  ) {
  }

  @ViewChild('sidenav') public sidenav: MatDrawer;

  sideNavTabs: SideNavItem[] = [
    {
      text: 'Dashboard',
      matIcon: 'assessment',
      link: '/dashboard'
    },
    {
      text: 'Applications',
      matIcon: 'apps',
      link: '/applications'
    },
    {
      text: 'Cloud Foundry',
      matIcon: 'cloud',
      link: '/cloud-foundry'
    },
    {
      text: 'Endpoints',
      matIcon: 'settings_input_component',
      link: '/endpoints'
    },
    {
      text: 'Service Catalogue',
      matIcon: 'library_books',
      link: '/service-catalogue'
    },
  ];

  sideNaveMode = 'side';

  ngAfterContentInit() {
    this.breakpointObserver.observe([
      Breakpoints.Handset
    ]).pipe(
      debounceTime(250)
      ).subscribe(result => {
        if (result.matches) {
          this.store.dispatch(new ChangeSideNavMode('over'));
        } else {
          this.store.dispatch(new ChangeSideNavMode('side'));
        }
      });

    this.sidenav.onClose.subscribe(() => {
      this.store.dispatch(new CloseSideNav());
    });

    this.store.select('dashboard')
      .subscribe((dashboard: DashboardState) => {
        dashboard.sidenavOpen ? this.sidenav.open() : this.sidenav.close();
        this.sidenav.mode = dashboard.sideNavMode;
      });
  }
}

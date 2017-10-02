import { AfterContentInit, Component, OnInit, ViewChild } from '@angular/core';
import { MdDrawer } from '@angular/material';
import { Store } from '@ngrx/store';

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

export class DashboardBaseComponent implements OnInit, AfterContentInit {

  constructor(
    public pageHeaderService: PageHeaderService,
    private store: Store<AppState>,
    private eventWatcherService: EventWatcherService
  ) {
  }

  @ViewChild('sidenav') public sidenav: MdDrawer;

  sideNavTabs: SideNavItem[];

  sideNaveMode = 'side';

  ngOnInit() {
    this.sideNavTabs = [
      {
        text: 'Dashboard',
        mdIcon: 'assessment',
        link: '/dashboard'
      },
      {
        text: 'Applications',
        mdIcon: 'apps',
        link: '/applications'
      },
      {
        text: 'Endpoints',
        mdIcon: 'settings_input_component',
        link: '/endpoints'
      }
    ];
  }
  ngAfterContentInit() {
    this.eventWatcherService.resizeEvent$.subscribe(({ innerWidth }) => {
      if (innerWidth && innerWidth < 980) {
        this.store.dispatch(new ChangeSideNavMode('over'));
        this.store.dispatch(new CloseSideNav());
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

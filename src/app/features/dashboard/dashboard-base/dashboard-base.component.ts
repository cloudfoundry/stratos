import { AfterContentInit, Component, OnInit, ViewChild } from '@angular/core';
import { MdDrawer } from '@angular/material';
import { Store } from '@ngrx/store';

import { AppState } from '../../../store/app-state';
import { PageHeaderService } from './../../../core/page-header-service/page-header.service';
import { SideNavService } from './../../../core/side-nav-service/side-nav.service';
import { DashboardState } from './../../../store/reducers/dashboard-reducer';
import { SideNavItem } from './../side-nav/side-nav.component';

@Component({
  selector: 'app-dashboard-base',
  templateUrl: './dashboard-base.component.html',
  styleUrls: ['./dashboard-base.component.scss']
})

export class DashboardBaseComponent implements OnInit, AfterContentInit {
  sidenavOpen = true;

  constructor(
    private sideNaveService: SideNavService,
    public pageHeaderService: PageHeaderService,
    private store: Store<AppState>
  ) {
  }

  @ViewChild('sidenav') public sidenav: MdDrawer;

  sideNavTabs: SideNavItem[];

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
    this.store.select('dashboard')
      .subscribe((dashboard: DashboardState) => {
        dashboard.sidenavOpen ? this.sidenav.open() : this.sidenav.close();
      });
  }
}

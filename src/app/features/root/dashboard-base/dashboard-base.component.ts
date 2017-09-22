import { Component, OnInit, ViewChild } from '@angular/core';

import { SideNavService } from './../../../core/side-nav-service/side-nav.service';
import { SideNavItem } from './../../../shared/components/side-nav/side-nav.component';

@Component({
  selector: 'app-dashboard-base',
  templateUrl: './dashboard-base.component.html',
  styleUrls: ['./dashboard-base.component.scss']
})

export class DashboardBaseComponent implements OnInit {

  constructor(private sideNaveService: SideNavService) {

  }

  @ViewChild('sidenav') public sidenav;
  sideNavTabs: SideNavItem[];

  ngOnInit() {
    this.sideNaveService.sideNav = this.sidenav;
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
}

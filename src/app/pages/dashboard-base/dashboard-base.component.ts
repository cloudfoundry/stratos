import { SideNavItem } from '../../components/side-nav/side-nav.component';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard-base',
  templateUrl: './dashboard-base.component.html',
  styleUrls: ['./dashboard-base.component.scss']
})

export class DashboardBaseComponent implements OnInit {

  constructor() { }

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
        link: '/application-wall'
      },
      {
        text: 'Endpoints',
        mdIcon: 'settings_input_component',
        link: '/endpoints'
      }
    ];
  }

}

import { ngContentDef } from '@angular/core/src/view/ng_content';
import { SideNavService } from './../../services/side-nav/side-nav.service';
import { SideNavItem } from '../../components/side-nav/side-nav.component';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-dashboard-base',
  templateUrl: './dashboard-base.component.html',
  styleUrls: ['./dashboard-base.component.scss']
})

export class DashboardBaseComponent implements OnInit, AfterViewInit {

  constructor(private sideNaveService: SideNavService) {

  }

  @ViewChild('sidenav') public sidenav;
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

  ngAfterViewInit() {
    this.sideNaveService.sideNav = this.sidenav;
  }
}

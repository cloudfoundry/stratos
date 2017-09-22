import { AfterContentInit, Component, ContentChildren, forwardRef, OnInit, QueryList, ViewChild } from '@angular/core';

import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PageHeaderService } from './../../../core/page-header-service/page-header.service';
import { SideNavService } from './../../../core/side-nav-service/side-nav.service';
import { SideNavItem } from './../side-nav/side-nav.component';

@Component({
  selector: 'app-dashboard-base',
  templateUrl: './dashboard-base.component.html',
  styleUrls: ['./dashboard-base.component.scss']
})

export class DashboardBaseComponent implements OnInit, AfterContentInit {

  @ContentChildren(forwardRef(() => PageHeaderComponent), { descendants: true })
  header: QueryList<PageHeaderComponent>;

  constructor(private sideNaveService: SideNavService, public pageHeaderService: PageHeaderService) {
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
  ngAfterContentInit() {
    this.sideNaveService.sideNav = this.sidenav;
    this.header.changes.subscribe(headers => {
      console.log(headers.length);
    });
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';

import { PageHeaderService } from '../../../core/page-header-service/page-header.service';
import { SideNavService } from '../../../core/side-nav-service/side-nav.service';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnInit, OnDestroy {

  constructor(public sideNavService: SideNavService, public pageHeaderService: PageHeaderService) { }
  // Assumes there will only ever be one header per page
  ngOnInit() {
    this.pageHeaderService.headerActive = true;
  }

  ngOnDestroy() {
    this.pageHeaderService.headerActive = false;
  }

}

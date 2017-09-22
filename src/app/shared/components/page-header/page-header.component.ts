import { Component, OnInit } from '@angular/core';

import { SideNavService } from '../../../core/side-nav-service/side-nav.service';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnInit {

  constructor(public sideNavService: SideNavService) { }

  ngOnInit() {
  }

}

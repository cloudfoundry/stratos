import { TemplatePortal } from '@angular/cdk/portal';
import { AfterViewInit, Component, OnDestroy, TemplateRef, ViewChild } from '@angular/core';

import { TabNavService } from '../../../../tab-nav.service';

@Component({
  selector: 'app-page-sub-nav',
  templateUrl: './page-sub-nav.component.html',
  styleUrls: ['./page-sub-nav.component.scss']
})
export class PageSubNavComponent implements AfterViewInit, OnDestroy {
  @ViewChild('subNavTmpl', { static: true }) subNavTmpl: TemplateRef<any>;

  constructor(private tabNavService: TabNavService) { }

  ngAfterViewInit() {
    const portal = new TemplatePortal(this.subNavTmpl, undefined, {});
    this.tabNavService.setSubNav(portal);
  }
  ngOnDestroy() {
    this.tabNavService.clearSubNav();
  }
}

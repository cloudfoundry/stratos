import { TemplatePortal } from '@angular/cdk/portal';
import { AfterViewInit, Component, Input, OnDestroy, TemplateRef, ViewChild } from '@angular/core';

import { TabNavService } from '../../../../tab-nav.service';
import { IHeaderBreadcrumbLink } from '../page-header/page-header.types';

@Component({
  selector: 'app-page-sub-nav',
  templateUrl: './page-sub-nav.component.html',
  styleUrls: ['./page-sub-nav.component.scss']
})
export class PageSubNavComponent implements AfterViewInit, OnDestroy {

  @Input('breadcrumbs')
  set breadcrumbs(crumbs: IHeaderBreadcrumbLink[]) {
    this.tabNavService.setSubNavBreadcrumbs(crumbs);
  }
  
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

import { TemplatePortal } from '@angular/cdk/portal';

import { AfterViewInit, Component, OnDestroy, TemplateRef, ViewChild, ViewContainerRef, effect, inject, input, ChangeDetectionStrategy } from '@angular/core';

import { TabNavService } from '../../../tab-nav.service';
import { IHeaderBreadcrumbLink } from '../page-header/page-header.types';

@Component({
  selector: 'app-page-sub-nav',
  templateUrl: './page-sub-nav.component.html',
  styleUrls: ['./page-sub-nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: []
})
export class PageSubNavComponent implements AfterViewInit, OnDestroy {
  private tabNavService = inject(TabNavService);
  private viewContainerRef = inject(ViewContainerRef);

  readonly breadcrumbs = input<IHeaderBreadcrumbLink[]>();

  @ViewChild('subNavTmpl', { static: true }) subNavTmpl!: TemplateRef<any>;

  constructor() {
    // Publish the breadcrumbs to the dashboard. Most sub-navs bind none and
    // publish nothing.
    effect(() => {
      const crumbs = this.breadcrumbs();
      if (crumbs !== undefined) {
        this.tabNavService.setSubNavBreadcrumbs(crumbs);
      }
    });
  }

  ngAfterViewInit() {
    const portal = new TemplatePortal(this.subNavTmpl, this.viewContainerRef, {});
    this.tabNavService.setSubNav(portal);
  }
  ngOnDestroy() {
    this.tabNavService.clearSubNav();
  }
}

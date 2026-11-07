import { TemplatePortal } from '@angular/cdk/portal';

import { AfterViewInit, Component, OnDestroy, TemplateRef, ViewContainerRef, effect, inject, input, ChangeDetectionStrategy, viewChild } from '@angular/core';

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

  readonly subNavTmpl = viewChild.required<TemplateRef<any>>('subNavTmpl');

  // Who had the row before this sub-nav, to hand it back in ngOnDestroy: a
  // tabbed page can hold a sub-nav for every tab while a tab that brings its
  // own shows that one instead. Read here, before the breadcrumbs effect
  // below publishes this sub-nav's own.
  private previousPortal = this.tabNavService.tabSubNav();
  private previousBreadcrumbs = this.tabNavService.tabSubNavBreadcrumbs();
  // Set in ngAfterViewInit, read in ngOnDestroy.
  private myPortal?: TemplatePortal;

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
    this.myPortal = new TemplatePortal(this.subNavTmpl(), this.viewContainerRef, {});
    this.tabNavService.setSubNav(this.myPortal);
  }

  ngOnDestroy() {
    // Only act if the row is still ours; a later sub-nav that took it over
    // and is still alive keeps it.
    if (this.tabNavService.tabSubNav() !== this.myPortal) {
      return;
    }
    if (this.previousPortal) {
      this.tabNavService.setSubNav(this.previousPortal);
      this.tabNavService.setSubNavBreadcrumbs(this.previousBreadcrumbs);
    } else {
      this.tabNavService.clearSubNav();
    }
  }
}

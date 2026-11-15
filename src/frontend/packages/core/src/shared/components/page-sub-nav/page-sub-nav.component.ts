import { TemplatePortal } from '@angular/cdk/portal';

import { AfterViewInit, Component, OnDestroy, TemplateRef, ViewContainerRef, effect, inject, input, ChangeDetectionStrategy, viewChild } from '@angular/core';

import { SubNavEntry, TabNavService } from '../../../tab-nav.service';
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

  /**
   * A tabbed page's shared row. It shows only when no tab brought its own
   * sub-nav, whichever of them initialised first.
   */
  readonly fallback = input(false);

  // Set in ngAfterViewInit, read in ngOnDestroy.
  private entry?: SubNavEntry;

  constructor() {
    // Publish the breadcrumbs to the dashboard. Most sub-navs bind none and
    // publish nothing.
    effect(() => {
      const crumbs = this.breadcrumbs();
      if (crumbs !== undefined && this.entry) {
        this.entry = this.tabNavService.setSubNavBreadcrumbs(this.entry, crumbs);
      }
    });
  }

  ngAfterViewInit() {
    this.entry = this.tabNavService.addSubNav(
      new TemplatePortal(this.subNavTmpl(), this.viewContainerRef, {}), this.fallback(), this.breadcrumbs());
  }

  ngOnDestroy() {
    if (this.entry) {
      this.tabNavService.removeSubNav(this.entry);
    }
  }
}

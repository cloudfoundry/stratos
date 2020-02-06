import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BREADCRUMB_URL_PARAM, IBreadcrumb, IBreadcrumbLink } from './breadcrumbs.types';

@Component({
  selector: 'app-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss']
})
export class BreadcrumbsComponent {
  public breadcrumbDefinitions: IBreadcrumbLink[] = null;
  breadcrumbKey: string;

  @Input()
  set breadcrumbs(breadcrumbs: IBreadcrumb[]) {
    this.breadcrumbDefinitions = this.getBreadcrumb(breadcrumbs);
  }

  private getBreadcrumb(breadcrumbs: IBreadcrumb[]) {
    if (!breadcrumbs || !breadcrumbs.length) {
      return [];
    }
    return this.getBreadcrumbFromKey(breadcrumbs).breadcrumbs;
  }

  private getBreadcrumbFromKey(breadcrumbs: IBreadcrumb[]) {
    if (breadcrumbs.length === 1 || !this.breadcrumbKey) {
      return breadcrumbs[0];
    }
    return breadcrumbs.find(breadcrumb => {
      return breadcrumb.key === this.breadcrumbKey;
    }) || breadcrumbs[0];
  }

  constructor(route: ActivatedRoute) {
    this.breadcrumbKey = route.snapshot.queryParams[BREADCRUMB_URL_PARAM] || null;
  }
}

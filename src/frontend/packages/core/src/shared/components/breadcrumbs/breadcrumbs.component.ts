
import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { BREADCRUMB_URL_PARAM, IBreadcrumb, IBreadcrumbLink } from './breadcrumbs.types';
import { CustomIconComponent } from '../custom-material/custom-material.component';

@Component({
  selector: 'app-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CustomIconComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush
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

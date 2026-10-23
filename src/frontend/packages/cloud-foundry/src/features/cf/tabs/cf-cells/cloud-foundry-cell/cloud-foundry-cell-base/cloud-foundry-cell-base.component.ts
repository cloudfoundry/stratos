import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith, take } from 'rxjs/operators';

import { PageHeaderComponent } from '../../../../../../../../core/src/shared/components/page-header/page-header.component';
import { LoadingPageComponent } from '../../../../../../../../core/src/shared/components/loading-page/loading-page.component';
import { IPageSideNavTab } from '../../../../../../../../core/src/features/dashboard/page-side-nav/page-side-nav.component';
import { IHeaderBreadcrumb } from '../../../../../../../../core/src/shared/components/page-header/page-header.types';
import { getActiveRouteCfCellProvider } from '../../../../cf.helpers';
import { CloudFoundryEndpointService } from '../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';

@Component({
  selector: 'app-cloud-foundry-cell-base',
  templateUrl: './cloud-foundry-cell-base.component.html',
  providers: [
    getActiveRouteCfCellProvider,
    CloudFoundryCellService
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    LoadingPageComponent
  ]
})
export class CloudFoundryCellBaseComponent {

  static AppsLinks = 'apps';

  tabLinks: IPageSideNavTab[] = [
    {
      link: 'summary',
      label: 'Summary',
      icon: 'description'
    },
    {
      link: 'charts',
      label: 'Metrics',
      icon: 'equalizer'
    },
    {
      link: CloudFoundryCellBaseComponent.AppsLinks,
      label: 'App Instances',
      icon: 'application_instance',
      iconFont: 'stratos-icons'
    },
  ];

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  public name$: Observable<string>;
  public isLoading$: Observable<boolean>;
  public cfCellService = inject(CloudFoundryCellService);

  constructor() {
    const cfEndpointService = inject(CloudFoundryEndpointService);
    const cfCellService = this.cfCellService;

    // cellMetric$ does not error: a failed request emits null and sets
    // cfCellService.error(), which the template shows above the tabs.
    this.isLoading$ = cfCellService.cellMetric$.pipe(
      map(() => false),
      startWith(true)
    );
    // cellMetric$ emits null when there is no sample or the request
    // failed; the route's cell ID is the same bosh_job_id, so show that.
    this.name$ = cfCellService.cellMetric$.pipe(
      map(metric => metric?.bosh_job_id ?? cfCellService.cellId)
    );

    this.breadcrumbs$ = cfEndpointService.endpoint$.pipe(
      map(endpoint => ([
        {
          breadcrumbs: [
            {
              value: endpoint.entity.name,
              routerLink: `/cloud-foundry/${endpoint.entity.guid}/cells`
            }
          ]
        }
      ])),
      take(1)
    );

    // strict: AppsLinks tab is statically present in the tabLinks array literal above
    this.tabLinks.find(link => link.link === CloudFoundryCellBaseComponent.AppsLinks)!.hidden$ =
      cfEndpointService.currentUser$.pipe(
        map(user => !user.admin)
      );
  }
}

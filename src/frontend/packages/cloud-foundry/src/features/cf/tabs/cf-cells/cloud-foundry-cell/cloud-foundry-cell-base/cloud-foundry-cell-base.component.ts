import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

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

  public name$: Observable<string>;
  public isLoading$: Observable<boolean>;
  public cfCellService = inject(CloudFoundryCellService);
  private cfEndpointService = inject(CloudFoundryEndpointService);

  readonly breadcrumbs = computed<IHeaderBreadcrumb[] | null>(() => {
    const endpoint = this.cfEndpointService.endpoint();
    return endpoint ? [{
      breadcrumbs: [{
        value: endpoint.entity.name,
        routerLink: `/cloud-foundry/${endpoint.entity.guid}/cells`
      }]
    }] : null;
  });

  constructor() {
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

    // Admins only; hidden until the endpoint's user is known.
    // strict: AppsLinks tab is statically present in the tabLinks array literal above
    this.tabLinks.find(link => link.link === CloudFoundryCellBaseComponent.AppsLinks)!.isHidden =
      computed(() => !this.cfEndpointService.endpoint()?.entity.user?.admin);
  }
}

import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { entityFactory, metricSchemaKey } from '../../../../../../../../store/src/helpers/entity-factory';
import { IHeaderBreadcrumb } from '../../../../../../shared/components/page-header/page-header.types';
import { IPageSideNavTab } from '../../../../../dashboard/page-side-nav/page-side-nav.component';
import { getActiveRouteCfCellProvider } from '../../../../cf.helpers';
import { CloudFoundryEndpointService } from '../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';

@Component({
  selector: 'app-cloud-foundry-cell-base',
  templateUrl: './cloud-foundry-cell-base.component.html',
  styleUrls: ['./cloud-foundry-cell-base.component.scss'],
  providers: [
    getActiveRouteCfCellProvider,
    CloudFoundryCellService
  ]
})
export class CloudFoundryCellBaseComponent {

  static AppsLinks = 'apps';

  tabLinks: IPageSideNavTab[] = [
    {
      link: 'summary',
      label: 'Summary',
      matIcon: 'description'
    },
    {
      link: 'charts',
      label: 'Metrics',
      matIcon: 'equalizer'
    },
    {
      link: CloudFoundryCellBaseComponent.AppsLinks,
      label: 'App Instances',
      matIcon: 'application_instance',
      matIconFont: 'stratos-icons'
    },
  ];

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  public name$: Observable<string>;
  public waitForEntityId: string;
  public waitForEntitySchema = entityFactory(metricSchemaKey);
  public cfCellService: CloudFoundryCellService;


  constructor(
    cfEndpointService: CloudFoundryEndpointService,
    cfCellService: CloudFoundryCellService
  ) {

    this.waitForEntityId = cfCellService.healthyMetricId;
    this.name$ = cfCellService.cellMetric$.pipe(
      map(metric => `${metric.bosh_job_id}`)
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
      first()
    );

    this.tabLinks.find(link => link.link === CloudFoundryCellBaseComponent.AppsLinks).hidden =
      cfEndpointService.currentUser$.pipe(
        map(user => !user.admin)
      );
  }
}

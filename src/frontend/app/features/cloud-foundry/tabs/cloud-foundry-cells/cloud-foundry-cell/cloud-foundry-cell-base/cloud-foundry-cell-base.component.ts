import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { IHeaderBreadcrumb } from '../../../../../../shared/components/page-header/page-header.types';
import { ISubHeaderTabs } from '../../../../../../shared/components/page-subheader/page-subheader.types';
import { entityFactory, metricSchemaKey } from '../../../../../../store/helpers/entity-factory';
import { getActiveRouteCfCellProvider } from '../../../../cf.helpers';
import { CloudFoundryEndpointService } from '../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';
import { CfUserService } from '../../../../../../shared/data-services/cf-user.service';

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

  tabLinks: ISubHeaderTabs[] = [
    {
      link: 'summary',
      label: 'Summary'
    },
    {
      link: 'charts',
      label: 'Metrics'
    },
    {
      link: CloudFoundryCellBaseComponent.AppsLinks,
      label: 'App Instances'
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

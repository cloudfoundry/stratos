import { Component } from '@angular/core';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { Observable } from 'rxjs';
import { IHeaderBreadcrumb } from '../../../../../shared/components/page-header/page-header.types';
import { map, first, startWith } from 'rxjs/operators';
import { ActivatedRouteSnapshot, ActivatedRoute } from '@angular/router';
import { getIdFromRoute } from '../../../cf.helpers';
import { CardStatus } from '../../../../../shared/components/application-state/application-state.service';
import { FetchCFMetricsAction, MetricQueryConfig, MetricQueryType } from '../../../../../store/actions/metrics.actions';
import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import { IMetrics, IMetricMatrixResult, IMetricVectorResult } from '../../../../../store/types/base-metric.types';
import { IMetricApplication } from '../../../../../store/types/metric.types';
import { metricSchemaKey, entityFactory } from '../../../../../store/helpers/entity-factory';

@Component({
  selector: 'app-cloud-foundry-cell-summary',
  templateUrl: './cloud-foundry-cell-summary.component.html',
  styleUrls: ['./cloud-foundry-cell-summary.component.scss'],
})
export class CloudFoundryCellSummaryComponent {

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  public name$: Observable<string>;
  public status$: Observable<CardStatus>;
  public cellId: string;
  public entityId: string;
  public entitySchema = entityFactory(metricSchemaKey);
  public healthyAction: FetchCFMetricsAction;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    activatedRoute: ActivatedRoute,
    entityServiceFactory: EntityServiceFactory
  ) {

    this.healthyAction = new FetchCFMetricsAction(
      cfEndpointService.cfGuid,
      new MetricQueryConfig('firehose_value_metric_rep_unhealthy_cell', {}),
      MetricQueryType.QUERY
    );
    this.entityId = this.healthyAction.metricId;
    const cellHealth = entityServiceFactory.create<IMetrics<IMetricVectorResult<IMetricApplication>>>(
      metricSchemaKey,
      this.entitySchema,
      this.healthyAction.metricId,
      this.healthyAction,
      false
    ).waitForEntity$.pipe(
      map(entityInfo => entityInfo.entity)
    );
    this.name$ = cellHealth.pipe(
      map(entity => entity.data.result[0].metric.bosh_job_name)
    );
    this.status$ = cellHealth.pipe(
      map(entity => {
        if (!entity.data || !entity.data.result) {
          return CardStatus.NONE;
        }
        // TODO: RC
        const health = entity.data.result[0];
        return health.value[1] === '0' ? CardStatus.OK : CardStatus.ERROR;
      })
      // map(entityInfo => entityInfo.entity),
      // filter(metrics => !!metrics && !!metrics.data && !!metrics.data.result),
      // map(metrics => metrics.data.result)
    );
    // this.status$.subscribe(status => console.log(status));

    // this.status$ = cellHealth$.pipe(
    //   startWith(CardStatus.NONE)
    // );


    this.cellId = getIdFromRoute(activatedRoute, 'cellId');

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
  }
}

import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { FetchMetricsAction } from '../../../store/actions/metrics.actions';
import { AppState } from '../../../store/app-state';
import { entityFactory, metricSchemaKey } from '../../../store/helpers/entity-factory';
import { IMetrics } from '../../../store/types/base-metric.types';
import { getIdFromRoute } from '../../cloud-foundry/cf.helpers';
import { EndpointIcon, getIconForEndpoint, getNameForEndpointType } from '../../endpoints/endpoint-helpers';
import { MetricsEndpointProvider, MetricsService } from '../services/metrics-service';

interface EndpointMetadata {
  type: string;
  icon: EndpointIcon;
}
interface MetricsInfo {
  entity: MetricsEndpointProvider;
  metadata: {
    [guid: string]: EndpointMetadata;
  };
}

interface PrometheusJobDetail {
  name: string;
  health: string;
  lastError: string;
  lastScrape: string;
}

interface PrometheusJobs {
  [guid: string]: PrometheusJobDetail;
}

@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss']
})
export class MetricsComponent {

  getNameForEndpointType = getNameForEndpointType;

  public metricsEndpoint$: Observable<MetricsInfo>;
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  public jobDetails$: Observable<PrometheusJobs>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private metricsService: MetricsService,
    private store: Store<AppState>,
    private entityMonitorFactory: EntityMonitorFactory
  ) {

    const metricsGuid = getIdFromRoute(this.activatedRoute, 'metricsId');
    const metricsAction = new FetchMetricsAction(metricsGuid, 'targets');
    this.store.dispatch(metricsAction);

    this.metricsEndpoint$ = this.metricsService.metricsEndpoints$.pipe(
      map((ep) => ep.find((item) => item.provider.guid === metricsGuid)),
      map((ep) => {
        const metadata = {};
        ep.endpoints.forEach(endpoint => {
          metadata[endpoint.guid] = {
            type: getNameForEndpointType(endpoint.cnsi_type),
            icon: getIconForEndpoint(endpoint.cnsi_type)
          };
        });
        return {
          entity: ep,
          metadata: metadata
        };
      }
      ));

    this.breadcrumbs$ = this.metricsEndpoint$.pipe(
      map(() => ([
        {
          breadcrumbs: [
            {
              value: 'Endpoints',
              routerLink: `/endpoints`
            }
          ]
        }
      ])),
      first()
    );

    const metricsMonitor = this.entityMonitorFactory.create<IMetrics>(
      metricsAction.metricId,
      metricSchemaKey,
      entityFactory(metricSchemaKey)
    );

    this.jobDetails$ = metricsMonitor.entity$.pipe(
      filter(a => !!a),
      map((targetsData: any) => {
        const mapped = {};
        if (targetsData.data.activeTargets) {
          targetsData.data.activeTargets.forEach(t => {
            if (t.labels && t.labels.job) {
              mapped[t.labels.job] = t;
            }
          });
        }
        return mapped;
      })
    );
  }
}

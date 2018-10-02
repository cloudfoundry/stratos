import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { MetricsAPIAction, MetricsAPITargets } from '../../../store/actions/metrics-api.actions';
import { AppState } from '../../../store/app-state';
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
  ) {

    const metricsGuid = getIdFromRoute(this.activatedRoute, 'metricsId');
    const metricsAction = new MetricsAPIAction(metricsGuid, 'targets');
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

    this.jobDetails$ = this.metricsEndpoint$.pipe(
      filter(mi => !!mi && !!mi.entity.provider && !!mi.entity.provider.metadata && !!mi.entity.provider.metadata.metrics_targets),
      map(mi => mi.entity.provider.metadata.metrics_targets),
      map((targetsData: MetricsAPITargets) => targetsData.activeTargets.reduce((mapped, t) => {
        if (t.labels && t.labels.job) {
          mapped[t.labels.job] = t;
        }
        return mapped;
      }, {}))
    );
  }
}

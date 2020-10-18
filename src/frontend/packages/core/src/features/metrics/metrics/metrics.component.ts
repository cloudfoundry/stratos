import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import {
  MetricAPIQueryTypes,
  MetricsAPIAction,
  MetricsAPITargets,
  MetricsStratosAction,
} from '../../../../../store/src/actions/metrics-api.actions';
import { AppState } from '../../../../../store/src/app-state';
import {
  EndpointRelationshipTypeMetadata,
  EndpointRelationshipTypeMetadataJob,
  EndpointRelationshipTypes,
} from '../../../../../store/src/types/endpoint.types';
import { getIdFromRoute } from '../../../core/utils.service';
import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { EndpointIcon } from '../../endpoints/endpoint-helpers';
import { mapMetricsData, MetricsEndpointInfo } from '../metrics.helpers';
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
  public metricsEndpoint$: Observable<MetricsEndpointProvider>;
  public metricsInfo$: Observable<MetricsEndpointInfo[]>;
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  public jobDetails$: Observable<PrometheusJobs>;

  // Was there an error retrieving data from the Prometheus server?
  public error = false;
  public metadataLabels: { [key: string]: string; } = {};
  public metadataTypes: { [key: string]: EndpointRelationshipTypeMetadata[]; } = {};
  public metadataJobTypes: { [key: string]: EndpointRelationshipTypeMetadata[]; } = {};

  constructor(
    private activatedRoute: ActivatedRoute,
    private metricsService: MetricsService,
    private store: Store<AppState>,
  ) {

    const metricsGuid = getIdFromRoute(this.activatedRoute, 'metricsId');
    // This will call the backend and fetch a collection of targets that are actively collecting metrics
    this.store.dispatch(new MetricsAPIAction(metricsGuid, MetricAPIQueryTypes.TARGETS));
    // This will call the backend and fetch a collection of stratos metric jobs from the metrics endpoint
    this.store.dispatch(new MetricsStratosAction(metricsGuid));

    // Raw endpoint data for this metrics endpoint
    this.metricsEndpoint$ = this.metricsService.metricsEndpoints$.pipe(
      map((ep) => ep.find((item) => item.provider.guid === metricsGuid)),
    );

    // Processed endpoint data
    this.metricsInfo$ = this.metricsEndpoint$.pipe(map((ep) => {
      if (ep.provider && ep.provider.metadata && ep.provider.metadata && ep.provider.metadata.metrics_stratos
        && (ep.provider.metadata.metrics_stratos as any).error) {
        this.error = true;
      }
      return mapMetricsData(ep);
    }));

    // Breadcrumbs
    this.breadcrumbs$ = this.metricsEndpoint$.pipe(
      map(() => ([{ breadcrumbs: [{ value: 'Endpoints', routerLink: `/endpoints` }] }])),
      first()
    );

    // Each endpoint might be receiving different types of metrics from this endpoint. Each different type may need to show different
    // status info. Here we create lists for every relationship type that we know of.
    Object.entries(EndpointRelationshipTypes).forEach(([relationTypeLabel, relationType]) => {
      this.metadataLabels[relationTypeLabel] = relationType.label;
      this.metadataTypes[relationTypeLabel] = relationType.metadata.filter(type => !type.type);
      this.metadataJobTypes[relationTypeLabel] = relationType.metadata.filter(type => type.type === EndpointRelationshipTypeMetadataJob);
    });

    // Job details will provide info on the status of the metrics being pulled
    this.jobDetails$ = this.metricsEndpoint$.pipe(
      filter(mi => !!mi && !!mi.provider && !!mi.provider.metadata && !!mi.provider.metadata.metrics_targets),
      map(mi => mi.provider.metadata.metrics_targets),
      map((targetsData: MetricsAPITargets) => targetsData.activeTargets.reduce((mapped, t) => {
        if (t.labels && t.labels.job) {
          mapped[t.labels.job] = t;
        }
        return mapped;
      }, {}))
    );
  }

}

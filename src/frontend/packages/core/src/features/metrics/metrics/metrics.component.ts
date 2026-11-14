import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MetricsAPITargets } from '@stratosui/store';

import { getIdFromRoute } from '../../../core/utils.service';
import { CardStatusComponent } from '../../../shared/components/cards/card-status/card-status.component';
import { MetadataItemComponent } from '../../../shared/components/metadata-item/metadata-item.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { ProductNameComponent } from '../../../shared/components/product-name.ccomponent';

import { mapMetricsData, MetricsEndpointInfo } from '../metrics.helpers';
import { MetricsEndpointProvider, MetricsService } from '../services/metrics-service';

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
  styleUrls: ['./metrics.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    CardStatusComponent,
    MetadataItemComponent,
    ProductNameComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricsComponent {
  private activatedRoute = inject(ActivatedRoute);
  private metricsService = inject(MetricsService);

  private readonly metricsGuid = getIdFromRoute(this.activatedRoute, 'metricsId');

  // find() may not match the routed guid, so the provider can be absent; the template guards with @if/?.
  // Raw endpoint data for this metrics endpoint
  public readonly metricsEndpoint = computed<MetricsEndpointProvider | undefined>(
    () => this.metricsService.metricsEndpoints().find(item => item.provider.guid === this.metricsGuid));

  // Processed endpoint data
  public readonly metricsInfo = computed<MetricsEndpointInfo[]>(() => {
    const ep = this.metricsEndpoint();
    return ep ? mapMetricsData(ep) : [];
  });

  // Was there an error retrieving data from the Prometheus server?
  public readonly error = computed(() => !!(this.metricsEndpoint()?.provider.metadata?.metrics_stratos as any)?.error);

  public readonly breadcrumbs: IHeaderBreadcrumb[] = [{ breadcrumbs: [{ value: 'Endpoints', routerLink: `/endpoints` }] }];

  // Job details obtained from the Prometheus server
  public readonly jobDetails = computed<PrometheusJobs | null>(() => {
    const targets = this.metricsEndpoint()?.provider?.metadata?.metrics_targets;
    return targets ? (targets as MetricsAPITargets).activeTargets.reduce((mapped: PrometheusJobs, t) => {
      if (t.labels && t.labels.job) {
        mapped[t.labels.job] = t as any;
      }
      return mapped;
    }, {} as PrometheusJobs) : null;
  });
}

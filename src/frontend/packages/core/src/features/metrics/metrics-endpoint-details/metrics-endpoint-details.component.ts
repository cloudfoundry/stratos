import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { EndpointListDetailsComponent } from '../../../shared/components/endpoint-list/endpoint-list.helpers';
import { mapMetricsData } from '../metrics.helpers';
import { MetricsEndpointProvider, MetricsService } from '../services/metrics-service';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';

interface MetricsDetailsInfo {
  ok: number;
  total: number;
  warning: boolean;
  plural: boolean;
}

@Component({
  selector: 'app-metrics-endpoint-details',
  templateUrl: './metrics-endpoint-details.component.html',
  standalone: true,
  imports: [
    CommonModule,
    CustomIconComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricsEndpointDetailsComponent extends EndpointListDetailsComponent {

  // The guid of the metrics endpoint that this row shows
  public guid = computed<string | undefined>(() => this.row().guid);

  private metricsService = inject(MetricsService);

  // The counts of what this metrics endpoint provides for, once it is connected.
  public readonly data = computed<MetricsDetailsInfo | null>(() => {
    const guid = this.guid();
    const provider = guid ? this.metricsService.metricsEndpoints().find(item => item.provider.guid === guid) : undefined;
    return provider?.provider.connectionStatus === 'connected' ? this.processProvider(provider) : null;
  });

  private hasStratosData(provider: MetricsEndpointProvider): boolean {
    const data = provider.provider;
    return !!data && !!data.metadata && !!data.metadata.metrics_stratos;
  }

  private processProvider(provider: MetricsEndpointProvider): MetricsDetailsInfo {
    const hasStratosData = this.hasStratosData(provider);
    const parsed = mapMetricsData(provider);
    const known = parsed.filter(item => item.known).length;
    return {
      ok: known,
      total: hasStratosData ? parsed.length : -1,
      warning: known === 0,
      plural: hasStratosData ? parsed.length !== 1 : known !== 1,
    };
  }
}

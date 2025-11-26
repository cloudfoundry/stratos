import { ChangeDetectionStrategy, Component, Input, type OnInit} from '@angular/core';
import { CustomCardComponent, CustomCardHeaderComponent, CustomCardContentComponent } from '../../../../../../core/src/shared/components/custom-card/custom-card.component';
import { CardWrapperComponent } from '../../../../../../core/src/shared/components/cards/card/card.component';

import { MetricsChartComponent, type MetricsConfig } from '../../../../../../core/src/shared/components/metrics-chart/metrics-chart.component';
import type { MetricsLineChartConfig } from '../../../../../../core/src/shared/components/metrics-chart/metrics-chart.types';
import { MetricsChartHelpers } from '../../../../../../core/src/shared/components/metrics-chart/metrics.component.helpers';
import type { IMetricMatrixResult } from '../../../../../../store/src/types/base-metric.types';
import type { IMetricApplication } from '../../../../../../store/src/types/metric.types';
import { FetchKubernetesMetricsAction } from '../../../store/kubernetes.actions';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-node-metrics-chart',
  templateUrl: './kubernetes-node-metrics-chart.component.html',
  styleUrls: ['./kubernetes-node-metrics-chart.component.scss'],
  standalone: true,
  imports: [
    CustomCardComponent,
    CustomCardHeaderComponent,
    CustomCardContentComponent,
    MetricsChartComponent,
    CardWrapperComponent
  ]
})
export class KubernetesNodeMetricsChartComponent implements OnInit {

  @Input()
  private nodeName: string;
  @Input()
  private endpointGuid: string;
  @Input()
  private yAxisLabel: string;
  @Input()
  private metricName: string;
  @Input()
  private seriesTranslation: string;
  @Input()
  public title: string;

  public instanceChartConfig: MetricsLineChartConfig;
  public instanceMetricConfig: MetricsConfig<IMetricMatrixResult<IMetricApplication>>;

  ngOnInit() {
    this.instanceChartConfig = MetricsChartHelpers.buildChartConfig(this.yAxisLabel);
    const query = `${this.metricName}{instance="${this.nodeName}"}[1h]&time=${Date.now()/ 1000}`;
    this.instanceMetricConfig = {
      getSeriesName: result => {
        const metric = result.metric as IMetricApplication & { name?: string; id?: string };
        return metric.name || metric.id || result.metric.__name__ || 'unknown';
      },
      mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
      sort: MetricsChartHelpers.sortBySeriesName,
      mapSeriesItemValue: this.getmapSeriesItemValue(),
      metricsAction: new FetchKubernetesMetricsAction(
        this.nodeName,
        this.endpointGuid,
        query,
      ),
    };
  }

  private getmapSeriesItemValue() {
    switch (this.seriesTranslation) {
      case 'mb':
        return (bytes: number) => bytes / 1000000;
      default:
        return undefined;
    }
  }
}

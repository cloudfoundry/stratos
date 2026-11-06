import { ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import { CustomCardComponent, CustomCardHeaderComponent, CustomCardContentComponent } from '../../../../../../core/src/shared/components/custom-card/custom-card.component';
import { CardWrapperComponent } from '../../../../../../core/src/shared/components/cards/card/card.component';

import { MetricsChartComponent, MetricsConfig } from '../../../../../../core/src/shared/components/metrics-chart/metrics-chart.component';
import { MetricsLineChartConfig } from '../../../../../../core/src/shared/components/metrics-chart/metrics-chart.types';
import { MetricsChartHelpers } from '../../../../../../core/src/shared/components/metrics-chart/metrics.component.helpers';
import { MetricQueryConfig } from '../../../../../../store/src/actions/metrics.actions';
import { MetricsRequest } from '../../../../../../store/src/services/metrics-data.service';
import { IMetricMatrixResult } from '../../../../../../store/src/types/base-metric.types';
import { IMetricApplication, MetricQueryType } from '../../../../../../store/src/types/metric.types';

const KUBE_METRICS_BASE_URL = '/pp/v1/metrics/kubernetes';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-node-metrics-chart',
  templateUrl: './kubernetes-node-metrics-chart.component.html',
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

  // strict: required @Input, set by Angular before ngOnInit/template render
  @Input()
  private nodeName!: string;
  // strict: required @Input, set by Angular before ngOnInit/template render
  @Input()
  private endpointGuid!: string;
  // strict: required @Input, set by Angular before ngOnInit/template render
  @Input()
  private yAxisLabel!: string;
  // strict: required @Input, set by Angular before ngOnInit/template render
  @Input()
  private metricName!: string;
  // strict: required @Input, set by Angular before ngOnInit/template render
  @Input()
  private seriesTranslation!: string;
  // strict: required @Input, set by Angular before ngOnInit/template render
  @Input()
  public title!: string;

  // strict: assigned in ngOnInit before the template reads them
  public instanceChartConfig!: MetricsLineChartConfig;
  // strict: assigned in ngOnInit before the template reads them
  public instanceMetricConfig!: MetricsConfig<IMetricMatrixResult<IMetricApplication>>;
  constructor() { }

  ngOnInit() {
    this.instanceChartConfig = MetricsChartHelpers.buildChartConfig(this.yAxisLabel);
    const queryString = `${this.metricName}{instance="${this.nodeName}"}[1h]&time=${(new Date()).getTime() / 1000}`;
    const request: MetricsRequest = {
      endpointGuid: this.endpointGuid,
      url: `${KUBE_METRICS_BASE_URL}/${this.nodeName}`,
      query: new MetricQueryConfig(queryString),
      queryType: MetricQueryType.QUERY,
      windowValue: null,
    };
    this.instanceMetricConfig = {
      getSeriesName: result => (result.metric as any).name ? (result.metric as any).name : (result.metric as any).id || result.metric.__name__ || 'unknown',
      mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
      sort: MetricsChartHelpers.sortBySeriesName,
      mapSeriesItemValue: this.getmapSeriesItemValue(),
      request,
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

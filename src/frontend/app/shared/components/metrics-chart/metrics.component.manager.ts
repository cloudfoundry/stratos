import { MetricsConfig } from './metrics-chart.component';
import { IMetrics, ChartSeries } from '../../../store/types/base-metric.types';

export class MetricsChartManager {
  static mapMatrix<T = any>(metrics: IMetrics, metricsConfig: MetricsConfig): ChartSeries[] {
    const metricsArray = metrics.result.map<ChartSeries<T>>(
      result => ({
        name: metricsConfig.getSeriesName(result),
        series: result.values.map(val => ({
          name: metricsConfig.mapSeriesItemName ? metricsConfig.mapSeriesItemName(val[0]) : val[0],
          value: metricsConfig.mapSeriesItemValue ? metricsConfig.mapSeriesItemValue(val[1]) : val[1]
        }))
      })
    );
    if (metricsConfig.sort) {
      metricsArray.sort(metricsConfig.sort);
    }
    return metricsArray;
  }
}

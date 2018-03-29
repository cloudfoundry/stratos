import { MetricsConfig } from './metrics-chart.component';
import { IMetrics, ChartSeries } from '../../../store/types/base-metric.types';

export class MetricsChartManager {
  static mapMatrix<T = any>(metrics: IMetrics, metricsConfig: MetricsConfig): ChartSeries[] {
    return metrics.result.map<ChartSeries<T>>(
      result => ({
        name: metricsConfig.getSeriesName(result),
        series: result.values.map(val => ({
          name: metricsConfig.mapSeriesItemName ? metricsConfig.mapSeriesItemName(val[0]) : val[0],
          value: metricsConfig.mapSeriesItemValue ? metricsConfig.mapSeriesItemValue(val[1]) : val[1]
        }))
      })
    );
  }
  static mapVector<T = any>(metrics: IMetrics, metricsConfig: MetricsConfig): ChartSeries[] {
    return metrics.result.map<ChartSeries<T>>(
      result => ({
        name: metricsConfig.getSeriesName(result),
        series: [{
          name: metricsConfig.mapSeriesItemName ? metricsConfig.mapSeriesItemName(result.value[0]) : result.value[0],
          value: metricsConfig.mapSeriesItemValue ? metricsConfig.mapSeriesItemValue(result.value[1]) : result.value[1]
        }]
      })
    );
  }
}

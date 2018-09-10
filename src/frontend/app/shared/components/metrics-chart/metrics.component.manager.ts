import { MetricsConfig } from './metrics-chart.component';
import { IMetrics, ChartSeries, IMetricsData } from '../../../store/types/base-metric.types';
import { MetricsChartHelpers } from './metrics.component.helpers';

export class MetricsChartManager {
  static mapMatrix<T = any>(metrics: IMetricsData, metricsConfig: MetricsConfig): ChartSeries[] {
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
  static mapVector<T = any>(metrics: IMetricsData, metricsConfig: MetricsConfig): ChartSeries[] {
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
  static fillOutTimeOrderedChartSeries(timeOrdered: ChartSeries[], start: number, end: number, step: number, metricConfig: MetricsConfig) {
    if (!timeOrdered || !timeOrdered.length) {
      return timeOrdered;
    }
    return timeOrdered.reduce((allSeries, series) => {
      let pos = 0;
      const data = series.series;
      for (let t = start; t <= end; t += step) {
        const current = data[pos];
        const name = metricConfig.mapSeriesItemName ? metricConfig.mapSeriesItemName(t) : t + '';
        if (!current) {
          data.push({
            name: metricConfig.mapSeriesItemName ? metricConfig.mapSeriesItemName(t) : t + '',
            value: 0
          });
        } else {
          if (current.name < name) {
            data.splice(pos, 0, {
              name: metricConfig.mapSeriesItemName ? metricConfig.mapSeriesItemName(t) : t + '',
              value: 0
            });
          } else {
            data.splice(pos + 1, 0, {
              name: metricConfig.mapSeriesItemName ? metricConfig.mapSeriesItemName(t) : t + '',
              value: 0
            });
            pos += 2;
          }
        }
      }
      allSeries.push(series);
      return allSeries;
    }, []);
  }
}

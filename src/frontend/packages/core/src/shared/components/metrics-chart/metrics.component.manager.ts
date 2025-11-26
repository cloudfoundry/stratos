import type { IMetricsData, ChartSeries, IMetricMatrixResult, IMetricVectorResult, IMetricSample } from '@stratosui/store';

import type { MetricsConfig } from './metrics-chart.component';

function dateLessThanUnix(date: Date, unix: number) {
  const unixDate = date.getTime() / 1000;
  return unixDate < unix;
}
export class MetricsChartManager {
  static mapMatrix<T = unknown>(metrics: IMetricsData<IMetricMatrixResult>, metricsConfig: MetricsConfig): ChartSeries<T>[] {
    return metrics.result.map<ChartSeries<T>>(
      result => ({
        name: metricsConfig.getSeriesName(result),
        metadata: result.metric as Record<string, unknown>,
        series: result.values.map((val: IMetricSample) => ({
          name: (metricsConfig.mapSeriesItemName ? metricsConfig.mapSeriesItemName(val[0]) : val[0]) as string | Date,
          value: (metricsConfig.mapSeriesItemValue ? metricsConfig.mapSeriesItemValue(val[1]) : val[1]) as T
        }))
      })
    );
  }
  static mapVector<T = unknown>(metrics: IMetricsData<IMetricVectorResult>, metricsConfig: MetricsConfig): ChartSeries<T>[] {
    return metrics.result.map<ChartSeries<T>>(
      result => ({
        name: metricsConfig.getSeriesName(result),
        metadata: result.metric as Record<string, unknown>,
        series: [{
          name: (metricsConfig.mapSeriesItemName ? metricsConfig.mapSeriesItemName(result.value[0]) : result.value[0]) as string | Date,
          value: (metricsConfig.mapSeriesItemValue ? metricsConfig.mapSeriesItemValue(result.value[1]) : result.value[1]) as T
        }]
      })
    );
  }
  static fillOutTimeOrderedChartSeries(
    timeOrdered: ChartSeries[],
    start: number,
    end: number,
    step: number,
    metricConfig: MetricsConfig
  ): ChartSeries[] {
    if (!timeOrdered || !timeOrdered.length) {
      return timeOrdered;
    }
    return timeOrdered.reduce((allSeries, series) => {
      let pos = 0;
      const newSeries = [];
      for (let t = start; t <= end; t += step) {
        const current = series.series[pos];
        if (series.series.length > pos && dateLessThanUnix(series.series[pos].name as Date, t + step)) {
          newSeries.push({
            name: current.name,
            value: current.value
          });
          pos++;
        } else {
          newSeries.push({
            name: metricConfig.mapSeriesItemName ? metricConfig.mapSeriesItemName(t) : `${t}`,
            value: 0
          });
        }
      }
      allSeries.push({
        name: series.name,
        series: newSeries
      });
      return allSeries;
    }, []);
  }
}

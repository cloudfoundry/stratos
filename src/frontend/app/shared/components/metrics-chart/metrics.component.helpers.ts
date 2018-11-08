import { MetricsAction } from './../../../store/actions/metrics.actions';
import { ChartSeries, IMetricMatrixResult, MetricsFilterSeries } from '../../../store/types/base-metric.types';
import { MetricsLineChartConfig, YAxisTickFormattingFunc } from './metrics-chart.types';
import { MetricsConfig } from './metrics-chart.component';

export class MetricsChartHelpers {
  static getDateSeriesName(value: number) {
    const date = new Date(0);
    date.setUTCSeconds(value);
    return date;
  }
  static sortBySeriesName(a: ChartSeries, b: ChartSeries) {
    if (a.name > b.name) {
      return 1;
    }
    if (a.name < b.name) {
      return -1;
    }
    return 0;
  }
  static buildChartConfig(yLabel: string, yAxisTickFormatter?: YAxisTickFormattingFunc) {
    const lineChartConfig = new MetricsLineChartConfig();
    lineChartConfig.xAxisLabel = 'Time';
    lineChartConfig.yAxisLabel = yLabel;
    if (!!yAxisTickFormatter) {
      lineChartConfig.yAxisTickFormatting = yAxisTickFormatter;
    }
    return lineChartConfig;
  }
}
export enum ChartDataTypes {
  BYTES = 'bytes'
}
export function getMetricsChartConfigBuilder<T = any>(getSeriesName: (result) => string) {
  return (
    metricsAction: MetricsAction,
    yAxisLabel: string,
    dataType: ChartDataTypes = null,
    filterSeries?: MetricsFilterSeries,
    yAxisTickFormatter?: YAxisTickFormattingFunc
  ) => buildMetricsChartConfig<T>(metricsAction, yAxisLabel, getSeriesName, dataType, filterSeries, yAxisTickFormatter);
}

export function buildMetricsChartConfig<T = any>(
  metricsAction: MetricsAction,
  yAxisLabel: string,
  getSeriesName: (result) => string,
  dataType: ChartDataTypes = null,
  filterSeries?: MetricsFilterSeries,
  yAxisTickFormatter?: YAxisTickFormattingFunc
): [
    MetricsConfig<IMetricMatrixResult<T>>,
    MetricsLineChartConfig
  ] {
  return [
    {
      getSeriesName,
      mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
      sort: MetricsChartHelpers.sortBySeriesName,
      mapSeriesItemValue: dataType === ChartDataTypes.BYTES ? (bytes) => (bytes / 1000000).toFixed(2) : null,
      metricsAction,
      filterSeries: filterSeries,
    },
    MetricsChartHelpers.buildChartConfig(yAxisLabel, yAxisTickFormatter)
  ];
}

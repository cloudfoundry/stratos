import { ChartSeries, MetricsFilterSeries, IMetricMatrixResult } from '@stratosui/store';
import { YAxisTickFormattingFunc, MetricsLineChartConfig } from './metrics-chart.types';
import { MetricsAction } from '@stratosui/store';
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
  BYTES = 'bytes',
  CPU_PERCENT = 'cpu_percent',
  CPU_TIME = 'cpu_time',
}
export function getMetricsChartConfigBuilder<T = any>(getSeriesName: (result) => string) {
  return (
    metricsAction: MetricsAction,
    yAxisLabel: string,
    dataType: ChartDataTypes = null,
    filterSeries?: MetricsFilterSeries,
    yAxisTickFormatter?: YAxisTickFormattingFunc,
    tooltipValueFormatter?: YAxisTickFormattingFunc
  ) => buildMetricsChartConfig<T>(metricsAction, yAxisLabel, getSeriesName, dataType, filterSeries, yAxisTickFormatter,
    tooltipValueFormatter);
}

export function buildMetricsChartConfig<T = any>(
  metricsAction: MetricsAction,
  yAxisLabel: string,
  getSeriesName: (result) => string,
  dataType: ChartDataTypes = null,
  filterSeries?: MetricsFilterSeries,
  yAxisTickFormatter?: YAxisTickFormattingFunc,
  tooltipValueFormatter?: YAxisTickFormattingFunc
): [
    MetricsConfig<IMetricMatrixResult<T>>,
    MetricsLineChartConfig
  ] {
  return [
    {
      getSeriesName,
      mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
      sort: MetricsChartHelpers.sortBySeriesName,
      mapSeriesItemValue: getServiceItemValueMapper(dataType),
      metricsAction,
      filterSeries,
      tooltipValueFormatter,
    },
    MetricsChartHelpers.buildChartConfig(yAxisLabel, yAxisTickFormatter)
  ];
}

function getServiceItemValueMapper(chartDataType: ChartDataTypes) {
  switch (chartDataType) {
    case ChartDataTypes.BYTES:
      // Megabytes - this should really be dynamic based on the value
      return (bytes) => (bytes / 1024 / 1024).toFixed(2);
    case ChartDataTypes.CPU_PERCENT:
      return (percent) => parseFloat(percent).toFixed(2);
    case ChartDataTypes.CPU_TIME:
      return (time) => parseFloat(time).toFixed(2);
    default:
      return null;
  }
}

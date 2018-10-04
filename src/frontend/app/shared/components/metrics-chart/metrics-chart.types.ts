import { MetricsAction } from '../../../store/actions/metrics.actions';

export interface IMetricsConfig<T = any> {
  metricsAction: MetricsAction;
  getSeriesName: (T) => string;
  mapSeriesItemName?: (any) => any;
  mapSeriesItemValue?: (any) => any;
}

export enum MetricsChartTypes {
  LINE = 'line'
}

export interface IMetricsChartConfig {
  chartType: MetricsChartTypes;
  showLegend?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export class MetricsLineChartConfig implements IMetricsChartConfig {
  chartType = MetricsChartTypes.LINE;
  showLegend = true;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
}

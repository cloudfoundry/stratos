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

interface IMetricsChartConfig {
  chartType: MetricsChartTypes;
  showLegend?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  autoScale?: boolean;
  yAxisTicks?: any[];
  yAxisTickFormatting?: (label: string) => string;
}

export class MetricsLineChartConfig implements IMetricsChartConfig {
  chartType = MetricsChartTypes.LINE;
  showLegend = true;
  xAxisLabel?: string;
  yAxisLabel?: string;
  autoScale = true; // This should be on by default
  yAxisTicks?: any[];
  yAxisTickFormatting?: (label: string) => string;
}

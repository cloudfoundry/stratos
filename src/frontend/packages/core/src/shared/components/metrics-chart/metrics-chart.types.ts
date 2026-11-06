import { MetricsRequest } from '@stratosui/store';

export interface IMetricsConfig<T = any> {
  request: MetricsRequest;
  getSeriesName: (obj: T) => string;
  mapSeriesItemName?: (anything: any) => any;
  mapSeriesItemValue?: (anything: any) => any;
}

export enum MetricsChartTypes {
  LINE = 'line'
}

export type YAxisTickFormattingFunc = (label: string) => string;
export interface IMetricsChartConfig {
  chartType: MetricsChartTypes;
  xAxisLabel?: string;
  yAxisLabel?: string;
  autoScale?: boolean;
  yAxisTicks?: any[];
  yAxisTickFormatting?: YAxisTickFormattingFunc;
}

export class MetricsLineChartConfig implements IMetricsChartConfig {
  chartType = MetricsChartTypes.LINE;
  xAxisLabel?: string;
  yAxisLabel?: string;
  autoScale = true;
  yAxisTicks?: any[];
  yAxisTickFormatting?: YAxisTickFormattingFunc;
}

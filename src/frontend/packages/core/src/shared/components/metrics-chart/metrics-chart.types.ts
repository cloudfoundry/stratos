import type { MetricsAction } from '@stratosui/store';

export interface IMetricsConfig<T = unknown> {
  metricsAction: MetricsAction;
  getSeriesName: (obj: T) => string;
  mapSeriesItemName?: (anything: unknown) => unknown;
  mapSeriesItemValue?: (anything: unknown) => unknown;
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
  yAxisTicks?: unknown[];
  yAxisTickFormatting?: YAxisTickFormattingFunc;
}

export class MetricsLineChartConfig implements IMetricsChartConfig {
  chartType = MetricsChartTypes.LINE;
  xAxisLabel?: string;
  yAxisLabel?: string;
  autoScale = true; // This should be on by default
  yAxisTicks?: unknown[];
  yAxisTickFormatting?: YAxisTickFormattingFunc;
}

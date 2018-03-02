import { MetricsAction } from "../../../store/actions/metrics.actions";

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
    // Make an enum for this.
    chartType: MetricsChartTypes;
}

export class MetricsLineChartConfig implements IMetricsChartConfig {
    chartType = MetricsChartTypes.LINE;
    xAxisLabel?: string;
    yAxisLabel?: string;
}

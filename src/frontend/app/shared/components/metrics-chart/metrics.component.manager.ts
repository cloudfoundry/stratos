import { MetricsConfig } from "./metrics-chart.component";
import { IMetrics } from "../../../store/types/base-metric.types";

export class MeticsChartManager {
    static mapMatrix<T>(metrics: IMetrics, metricsConfig: MetricsConfig) {
        return metrics.result.map(
            result => ({
                name: metricsConfig.getSeriesName(result),
                series: result.values.map(val => ({
                    name: metricsConfig.mapSeriesItemName ? metricsConfig.mapSeriesItemName(val[0]) : val[0],
                    value: metricsConfig.mapSeriesItemValue ? metricsConfig.mapSeriesItemValue(val[1]) : val[1]
                }))
            })
        )
    }
}
import { ChartSeries } from '../../../store/types/base-metric.types';

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
}

import * as moment from 'moment';

export interface ITimeRange {
  value?: string;
  label: string;
  queryType: MetricQueryType;
}

export interface StoreMetricTimeRange {
  timeRange: ITimeRange;
  start?: moment.Moment;
  end?: moment.Moment;
}

export enum MetricQueryType {
  QUERY = 'query',
  RANGE_QUERY = 'query_range'
}

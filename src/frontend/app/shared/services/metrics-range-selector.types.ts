import * as moment from 'moment';
export type momentTuple = [moment.DurationInputArg1, moment.unitOfTime.DurationConstructor];
export interface ITimeRange {
  value?: string;
  momentTuple?: momentTuple;
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
  RANGE_QUERY = 'query_range',
}

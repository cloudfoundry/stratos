import { MetricQueryType } from '@stratosui/store';

import moment from 'moment';

export type momentTuple = [moment.DurationInputArg1, moment.unitOfTime.DurationConstructor];
export interface ITimeRange {
  value?: string;
  label: string;
  queryType: MetricQueryType;
}

export interface StoreMetricTimeRange {
  timeRange: ITimeRange;
  start?: moment.Moment;
  end?: moment.Moment;
  step?: number;
}


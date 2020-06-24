import * as moment from 'moment';

import { MetricQueryType } from '../../../../store/src/types/metric.types';

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



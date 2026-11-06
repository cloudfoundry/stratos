import { MetricQueryType } from '@stratosui/store';

export type DurationTuple = [number, string];
export interface ITimeRange {
  value?: string;
  label: string;
  queryType: MetricQueryType;
}

export interface StoreMetricTimeRange {
  timeRange: ITimeRange;
  start?: Date;
  end?: Date;
  step?: number;
}


import { Injectable } from '@angular/core';
import { MetricQueryType, MetricQueryConfig, MetricsRequest } from '@stratosui/store';
import { sub, getUnixTime } from 'date-fns';

import { ITimeRange, StoreMetricTimeRange } from './metrics-range-selector.types';

@Injectable({
  providedIn: 'root'
})
export class MetricsRangeSelectorService {

  constructor() { }

  public defaultTimeValue: string;
  public times: ITimeRange[] = [
    {
      value: '5:minute',
      label: 'The past 5 minutes',
      queryType: MetricQueryType.QUERY
    },
    {
      value: '1:hour',
      label: 'The past hour',
      queryType: MetricQueryType.QUERY
    },
    {
      value: '1:day',
      label: 'The past day',
      queryType: MetricQueryType.QUERY
    },
    {
      value: '3:day',
      label: 'The past 3 days',
      queryType: MetricQueryType.QUERY
    },
    {
      value: '1:week',
      label: 'The past week',
      queryType: MetricQueryType.QUERY
    },
    {
      label: 'Custom time window',
      queryType: MetricQueryType.RANGE_QUERY
    }
  ];

  private withNewQuery(req: MetricsRequest, newQuery: MetricQueryConfig): MetricsRequest {
    return {
      ...req,
      queryType: MetricQueryType.RANGE_QUERY,
      query: newQuery,
    };
  }

  private convertWindowToRange(value: string): [Date, Date] {
    const windowSplit = value.split(':');
    const amount = parseInt(windowSplit[0], 10);
    const unit = windowSplit[1];
    const now = new Date();

    const duration: any = {};
    if (unit === 'minute') duration.minutes = amount;
    else if (unit === 'hour') duration.hours = amount;
    else if (unit === 'day') duration.days = amount;
    else if (unit === 'week') duration.weeks = amount;
    else if (unit === 'month') duration.months = amount;
    else if (unit === 'year') duration.years = amount;

    return [
      sub(now, duration),
      now
    ];
  }

  public getNewDateRangeRequest(req: MetricsRequest, start: Date, end: Date): MetricsRequest {
    const startUnix = getUnixTime(start);
    const endUnix = getUnixTime(end);
    return this.withNewQuery(req, new MetricQueryConfig(req.query.metric, {
      ...req.query.params,
      start: startUnix,
      end: endUnix,
      step: Math.max((endUnix - startUnix) / 50, 0)
    }));
  }

  public getNewTimeWindowRequest(req: MetricsRequest, windowValue: string): MetricsRequest {
    const [start, end] = this.convertWindowToRange(windowValue);
    const next = this.getNewDateRangeRequest(req, start, end);
    return { ...next, windowValue };
  }

  public getDefaultTimeRange(times = this.times): ITimeRange {
    if (this.defaultTimeValue) {
      return times.find(time => time.value === this.defaultTimeValue) || this.times[0];
    }
    return times.find(time => time.value === '1:hour') || this.times[0];
  }

  public resolveTimeRange(windowValue: string | null | undefined, times = this.times): StoreMetricTimeRange {
    if (windowValue) {
      return { timeRange: times.find(time => time.value === windowValue) || this.getDefaultTimeRange(times) };
    }
    return { timeRange: this.getDefaultTimeRange(times) };
  }

}

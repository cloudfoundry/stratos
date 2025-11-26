import { Injectable } from '@angular/core';
import { MetricQueryType, MetricQueryConfig, type MetricsAction, type IMetrics } from '@stratosui/store';
import { sub, getUnixTime } from 'date-fns';

import type { ITimeRange, StoreMetricTimeRange } from './metrics-range-selector.types';

@Injectable({
  providedIn: 'root'
})
export class MetricsRangeSelectorService {

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

  private newMetricsAction(action: MetricsAction, newQuery: MetricQueryConfig): MetricsAction {
    return {
      ...action,
      queryType: MetricQueryType.RANGE_QUERY,
      query: newQuery
    };
  }

  private convertWindowToRange(value: string): [Date, Date] {
    const windowSplit = value.split(':');
    const amount = parseInt(windowSplit[0], 10);
    const unit = windowSplit[1];
    const now = new Date();

    // Map unit string to date-fns duration object key
    const duration: Record<string, number> = {};
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

  public getNewDateRangeAction(action: MetricsAction, start: Date, end: Date) {
    const startUnix = getUnixTime(start);
    const endUnix = getUnixTime(end);
    return this.newMetricsAction(action, new MetricQueryConfig(action.query.metric, {
      ...action.query.params,
      start: startUnix,
      end: endUnix,
      step: Math.max((endUnix - startUnix) / 50, 0)
    }));
  }

  public getNewTimeWindowAction(action: MetricsAction, windowValue: string) {
    const [start, end] = this.convertWindowToRange(windowValue);
    const newAction = { ...action };
    newAction.windowValue = windowValue;
    return this.getNewDateRangeAction(newAction, start, end);
  }

  public getDateFromStoreMetric(metrics: IMetrics, times = this.times): StoreMetricTimeRange {
    if (metrics) {
      if (metrics.windowValue) {
        return {
          timeRange: times.find(time => time.value === metrics.windowValue)
        };
      } else {
        return {
          timeRange: metrics.query?.params?.window ?
            times.find(time => time.value === metrics.query.params.window) :
            this.getDefaultTimeRange(times)
        };
      }
    } else {
      const timeRange = this.getDefaultTimeRange(times);
      return {
        timeRange
      };
    }
  }

  private getDefaultTimeRange(times = this.times) {
    if (this.defaultTimeValue) {
      return times.find(time => time.value === this.defaultTimeValue) || this.times[0];
    } else {
      return times.find(time => time.value === '1:hour') || this.times[0];
    }
  }

}

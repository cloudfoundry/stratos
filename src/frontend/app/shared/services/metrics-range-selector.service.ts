import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { MetricQueryConfig, MetricsAction } from '../../store/actions/metrics.actions';
import { IMetrics } from '../../store/types/base-metric.types';
import { ITimeRange, StoreMetricTimeRange, MetricQueryType } from './metrics-range-selector.types';

@Injectable()
export class MetricsRangeSelectorService {

  constructor() { }

  public times: ITimeRange[] = [
    {
      value: '5m',
      label: 'The past 5 minutes',
      queryType: MetricQueryType.QUERY
    },
    {
      value: '1h',
      label: 'The past hour',
      queryType: MetricQueryType.QUERY
    },
    {
      value: '1w',
      label: 'The past week',
      queryType: MetricQueryType.QUERY
    },
    {
      label: 'Custom time window',
      queryType: MetricQueryType.RANGE_QUERY
    }
  ];

  private newMetricsAction(action: MetricsAction, newQuery: MetricQueryConfig, queryType: MetricQueryType): MetricsAction {
    return {
      ...action,
      query: newQuery,
      queryType
    };
  }

  public getNewDateRangeAction(action: MetricsAction, start: moment.Moment, end: moment.Moment) {
    const startUnix = start.unix();
    const endUnix = end.unix();
    const {
      window,
      ...params
    } = action.query.params || { window: undefined };

    return this.newMetricsAction(action, new MetricQueryConfig(action.query.metric, {
      ...params,
      start: startUnix,
      end: end.unix(),
      step: Math.max((endUnix - startUnix) / 200, 0)
    }), MetricQueryType.RANGE_QUERY);
  }

  public getNewTimeWindowAction(action: MetricsAction, window: ITimeRange) {
    const {
      start,
      end,
      step,
      ...params
    } = action.query.params || { start: undefined, end: undefined, step: undefined };

    return this.newMetricsAction(action, new MetricQueryConfig(action.query.metric, {
      ...params,
      window: window.value
    }), MetricQueryType.QUERY);
  }

  public getDateFromStoreMetric(metrics: IMetrics, times = this.times): StoreMetricTimeRange {
    if (metrics) {
      if (metrics.queryType === MetricQueryType.RANGE_QUERY) {
        const start = moment.unix(parseInt(metrics.query.params.start as string, 10));
        const end = moment.unix(parseInt(metrics.query.params.end as string, 10));
        return {
          timeRange: times.find(time => time.queryType === MetricQueryType.RANGE_QUERY),
          start,
          end
        };
      } else {
        return {
          timeRange: metrics.query.params.window ?
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
    return times.find(time => time.value === '1h') || this.times[0];
  }

}

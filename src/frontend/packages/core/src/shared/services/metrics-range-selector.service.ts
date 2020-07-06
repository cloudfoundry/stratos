import { Injectable } from '@angular/core';
import * as moment from 'moment';

import { MetricQueryConfig, MetricsAction } from '../../../../store/src/actions/metrics.actions';
import { IMetrics } from '../../../../store/src/types/base-metric.types';
import { MetricQueryType } from '../../../../store/src/types/metric.types';
import { ITimeRange, StoreMetricTimeRange } from './metrics-range-selector.types';

@Injectable()
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

  private convertWindowToRange(value: string): [moment.Moment, moment.Moment] {
    const windowSplit = value.split(':');
    return [
      moment().subtract(parseInt(windowSplit[0], 10), windowSplit[1] as moment.unitOfTime.DurationConstructor),
      moment()
    ];
  }

  public getNewDateRangeAction(action: MetricsAction, start: moment.Moment, end: moment.Moment) {
    const startUnix = start.unix();
    const endUnix = end.unix();
    return this.newMetricsAction(action, new MetricQueryConfig(action.query.metric, {
      ...action.query.params,
      start: startUnix,
      end: end.unix(),
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
          timeRange: metrics.query && metrics.query.params && metrics.query.params.window ?
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

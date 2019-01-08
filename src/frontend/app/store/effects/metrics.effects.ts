import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, mergeMap } from 'rxjs/operators';

import { MetricQueryType } from '../../shared/services/metrics-range-selector.types';
import {
  METRIC_API_FAILED,
  METRIC_API_START,
  MetricsAPIAction,
  MetricsAPIActionSuccess,
} from '../actions/metrics-api.actions';
import { getFullMetricQueryQuery, METRICS_START, MetricsAction } from '../actions/metrics.actions';
import { metricSchemaKey } from '../helpers/entity-factory';
import { IMetricsResponse } from '../types/base-metric.types';
import { AppState } from './../app-state';
import {
  IRequestAction,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from './../types/request.types';

@Injectable()
export class MetricsEffect {

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private store: Store<AppState>
  ) { }

  @Effect() metrics$ = this.actions$.ofType<MetricsAction>(METRICS_START).pipe(
    mergeMap(action => {
      const fullUrl = action.directApi ? action.url : this.buildFullUrl(action);
      const { guid } = action;
      this.store.dispatch(new StartRequestAction(action));
      return this.httpClient.get<{ [cfguid: string]: IMetricsResponse }>(fullUrl, {
        headers: { 'x-cap-cnsi-list': action.endpointGuid }
      }).pipe(
        map(metrics => {
          const metric = metrics[action.endpointGuid];
          const metricObject = metric ? {
            [guid]: {
              query: action.query,
              windowValue: action.windowValue,
              data: metric.data
            }
          } : {};
          return new WrapperRequestActionSuccess(
            {
              entities: {
                [metricSchemaKey]: metricObject
              },
              result: [guid]
            },
            action
          );
        })
      ).pipe(catchError(errObservable => {
        return [
          new WrapperRequestActionFailed(
            errObservable.message,
            action,
            'fetch', {
              endpointIds: [action.endpointGuid],
              url: errObservable.url || fullUrl,
              eventCode: errObservable.status ? errObservable.status + '' : '500',
              message: 'Metric request error',
            }
          )
        ];
      }));
    }));

  @Effect() metricsAPI$ = this.actions$.ofType<MetricsAPIAction>(METRIC_API_START).pipe(
    mergeMap(action => {
      return this.httpClient.get<{ [cfguid: string]: IMetricsResponse }>(action.url, {
        headers: { 'x-cap-cnsi-list': action.endpointGuid }
      }).pipe(
        map(metrics => {
          const metric = metrics[action.endpointGuid];
          return new MetricsAPIActionSuccess(action.endpointGuid, metric);
        })
      ).pipe(catchError(errObservable => {
        return [
          {
            type: METRIC_API_FAILED,
            error: errObservable.message
          }
        ];
      }));
    }));

  private buildFullUrl(action: MetricsAction) {
    return `${action.url}/${action.queryType}?query=${getFullMetricQueryQuery(action.query)}`;
  }

}


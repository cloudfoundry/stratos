import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';

import {
  METRIC_API_FAILED,
  METRIC_API_START,
  MetricsAPIAction,
  MetricsAPIActionSuccess,
} from '../actions/metrics-api.actions';
import { METRICS_START, MetricsAction } from '../actions/metrics.actions';
import { metricSchemaKey } from '../helpers/entity-factory';
import { IMetricsResponse } from '../types/base-metric.types';
import { IRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from './../types/request.types';


@Injectable()
export class MetricsEffect {

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
  ) { }

  @Effect() metrics$ = this.actions$.ofType<MetricsAction>(METRICS_START).pipe(
    mergeMap(action => {
      const fullUrl = action.directApi ? action.url : this.buildFullUrl(action);
      const apiAction = {
        guid: action.guid,
        entityKey: metricSchemaKey
      } as IRequestAction;
      return this.httpClient.get<{ [cfguid: string]: IMetricsResponse }>(fullUrl, {
        headers: { 'x-cap-cnsi-list': action.cfGuid }
      }).pipe(
        map(metrics => {
          const metric = metrics[action.cfGuid];
          const metricKey = MetricsAction.buildMetricKey(action.guid, action.query);
          const metricObject = metric ? {
            [metricKey]: metric.data
          } : {};
          return new WrapperRequestActionSuccess(
            {
              entities: {
                [metricSchemaKey]: metricObject
              },
              result: [action.guid]
            },
            apiAction
          );
        })
      ).pipe(catchError(errObservable => {
        return [
          new WrapperRequestActionFailed(
            errObservable.message,
            apiAction,
            'fetch'
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
    return `${action.url}/query?query=${action.query}`;
  }
}


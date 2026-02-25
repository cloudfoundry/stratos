import { HttpClient } from '@angular/common/http';
import { ApplicationRef, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, mergeMap } from 'rxjs/operators';

import {
  METRIC_API_FAILED,
  METRIC_API_START,
  MetricsAPIAction,
  MetricsAPIActionSuccess,
} from '../actions/metrics-api.actions';
import { getFullMetricQueryQuery, METRICS_START, MetricsAction } from '../actions/metrics.actions';
import { DispatchOnlyAppState } from '../app-state';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { IMetricsResponse } from '../types/base-metric.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from './../types/request.types';

@Injectable({
  providedIn: 'root'
})
export class MetricsEffect {

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private store: Store<DispatchOnlyAppState>,
    private appRef: ApplicationRef
  ) { }

   metrics$ = createEffect(() => this.actions$.pipe(
    ofType<MetricsAction>(METRICS_START),
    mergeMap((action: MetricsAction) => {
      const fullUrl = action.directApi ? action.url : this.buildFullUrl(action);
      const { guid } = action;
      this.store.dispatch(new StartRequestAction(action));
      return this.httpClient.get<{ [cfguid: string]: IMetricsResponse }>(fullUrl, {
        headers: { 'x-cap-cnsi-list': action.endpointGuid }
      }).pipe(
        map((metrics: { [cfguid: string]: IMetricsResponse }) => {
          const catalogEntity = entityCatalog.getEntity(action);
          const metric = metrics[action.endpointGuid];
          const metricObject = metric ? {
            [guid]: {
              query: action.query,
              windowValue: action.windowValue,
              data: metric.data
            }
          } : {};
          this.appRef.tick();
          return new WrapperRequestActionSuccess(
            {
              entities: {
                [catalogEntity.entityKey]: metricObject
              },
              result: [guid]
            },
            action
          );
        })
      ).pipe(catchError((errObservable: any) => {
        this.appRef.tick();
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
    })));

   metricsAPI$ = createEffect(() => this.actions$.pipe(
    ofType<MetricsAPIAction>(METRIC_API_START),
    mergeMap((action: MetricsAPIAction) => {
      return this.httpClient.get<{ [cfguid: string]: IMetricsResponse }>(action.url, {
        headers: { 'x-cap-cnsi-list': action.endpointGuid }
      }).pipe(
        map((metrics: { [cfguid: string]: IMetricsResponse }) => {
          const metric = metrics[action.endpointGuid];
          this.appRef.tick();
          return new MetricsAPIActionSuccess(action.endpointGuid, metric, action.queryType);
        })
      ).pipe(catchError((errObservable: any) => {
        this.appRef.tick();
        return [
          {
            type: METRIC_API_FAILED,
            error: errObservable.message
          }
        ];
      }));
    })));

  private buildFullUrl(action: MetricsAction) {
    return `${action.url}/${action.queryType}?query=${getFullMetricQueryQuery(action.query)}`;
  }

}


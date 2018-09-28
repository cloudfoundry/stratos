import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { getFullMetricQueryQuery, MetricsAction, METRICS_START } from '../actions/metrics.actions';
import { AppState } from '../app-state';
import { metricSchemaKey } from '../helpers/entity-factory';
import { IMetricsResponse } from '../types/base-metric.types';
import { IRequestAction, StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from './../types/request.types';




@Injectable()
export class MetricsEffect {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private httpClient: HttpClient,
  ) { }

  @Effect() metrics$ = this.actions$.ofType<MetricsAction>(METRICS_START).pipe(
    mergeMap(action => {
      const fullUrl = this.buildFullUrl(action);
      const apiAction = {
        guid: action.metricId,
        entityKey: metricSchemaKey
      } as IRequestAction;
      this.store.dispatch(new StartRequestAction(apiAction));
      return this.httpClient.get<{ [cfguid: string]: IMetricsResponse }>(fullUrl, {
        headers: { 'x-cap-cnsi-list': action.endpointGuid }
      }).pipe(
        map(metrics => {
          const metric = metrics[action.endpointGuid];
          const metricObject = metric ? {
            [action.metricId]: {
              query: action.query,
              queryType: action.queryType,
              data: metric.data
            }
          } : {};
          return new WrapperRequestActionSuccess(
            {
              entities: {
                [metricSchemaKey]: metricObject
              },
              result: [action.metricId]
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

  private buildFullUrl(action: MetricsAction) {
    return `${action.url}/${action.queryType}?query=${getFullMetricQueryQuery(action.query)}`;
  }
}


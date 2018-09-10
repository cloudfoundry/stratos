
import { catchError, mergeMap, map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { METRICS_START, MetricsAction } from '../actions/metrics.actions';
import { AppState } from '../app-state';
import { metricSchemaKey } from '../helpers/entity-factory';
import { IMetricsResponse } from '../types/base-metric.types';
import { IRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess, StartRequestAction } from './../types/request.types';


@Injectable()
export class MetricsEffect {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private httpClient: HttpClient,
  ) { }

  @Effect() metrics$ = this.actions$.ofType<MetricsAction>(METRICS_START).pipe(
    switchMap(action => {
      const fullUrl = this.buildFullUrl(action);
      const apiAction = {
        guid: action.guid,
        entityKey: metricSchemaKey
      } as IRequestAction;
      this.store.dispatch(new StartRequestAction(apiAction));
      return this.httpClient.get<{ [cfguid: string]: IMetricsResponse }>(fullUrl, {
        headers: { 'x-cap-cnsi-list': action.cfGuid }
      }).pipe(
        map(metrics => {
          const metric = metrics[action.cfGuid];
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

  private buildFullUrl(action: MetricsAction) {
    return `${action.url}/${action.queryType}?query=${action.query.getFullQuery()}`;
  }
}


import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { METRICS_START, MetricsAction } from '../actions/metrics.actions';
import { AppState } from '../app-state';
import { metricSchemaKey } from '../helpers/entity-factory';
import { IMetricsResponse } from '../types/base-metric.types';
import { IRequestAction, WrapperRequestActionSuccess } from './../types/request.types';


@Injectable()
export class MetricsEffect {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private httpClient: HttpClient
  ) { }

  @Effect() metrics$ = this.actions$.ofType<MetricsAction>(METRICS_START)
    .mergeMap(action => {
      const fullUrl = this.buildFullUrl(action);
      return this.httpClient.get<{ [cfguid: string]: IMetricsResponse }>(fullUrl, {
        headers: { 'x-cap-cnsi-list': action.cfGuid }
      }).pipe(
        map(metrics => {
          const metric = metrics[action.cfGuid];
          const metricKey = MetricsAction.buildMetricKey(action.guid, action.query);
          const apiAction = {
            guid: action.guid,
            entityKey: metricSchemaKey
          } as IRequestAction;
          return new WrapperRequestActionSuccess(
            {
              entities: {
                [metricSchemaKey]: {
                  [metricKey]: metric.data
                }
              },
              result: [action.guid]
            },
            apiAction
          );
        })
      );
    });

  private buildFullUrl(action: MetricsAction) {
    return `${action.url}/query?query=${action.query}`;
  }
}


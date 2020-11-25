import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, mergeMap } from 'rxjs/operators';

import { environment } from '../../../../core/src/environments/environment';
import { AppState } from '../../../../store/src/app-state';
import { isHttpErrorResponse } from '../../../../store/src/jetstream';
import { entityCatalog, NormalizedResponse, WrapperRequestActionSuccess } from '../../../../store/src/public-api';
import { StartRequestAction, WrapperRequestActionFailed } from '../../../../store/src/types/request.types';
import { AUTOSCALER_INFO, GetAppAutoscalerInfoAction } from '../../actions/autoscaler.actions';

const { proxyAPIVersion } = environment;
const commonPrefix = `/pp/${proxyAPIVersion}/autoscaler`;

function extractAutoscalerError(error): string {
  const httpResponse: HttpErrorResponse = isHttpErrorResponse(error);
  if (httpResponse) {
    return httpResponse.error ? httpResponse.error.error : JSON.stringify(httpResponse.error);
  }
  return error._body;
}

function createAutoscalerErrorMessage(requestType: string, error) {
  return `Unable to ${requestType}: ${error.status} ${extractAutoscalerError(error) || ''}`;
}

@Injectable()
export class AutoscalerInfoEffects {
  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>,
  ) { }

  @Effect()
  fetchAutoscalerInfo$ = this.actions$.pipe(
    ofType<GetAppAutoscalerInfoAction>(AUTOSCALER_INFO),
    mergeMap(action => {

      console.log('fetchAutoscalerInfo');
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      const requestArgs = {
        headers: {
          'x-cap-api-host': 'autoscaler',
          'x-cap-passthrough': 'true',
          'x-cap-cnsi-list': action.endpointGuid
        }
      };
      return this.http
        .get(`${commonPrefix}/info`, requestArgs).pipe(
          mergeMap(autoscalerInfo => {
            const entityKey = entityCatalog.getEntityKey(action);
            const mappedData = {
              entities: { [entityKey]: {} },
              result: []
            } as NormalizedResponse;
            this.transformData(entityKey, mappedData, action.endpointGuid, autoscalerInfo);
            return [
              new WrapperRequestActionSuccess(mappedData, action, actionType)
            ];
          }),
          catchError(err => [
            new WrapperRequestActionFailed(createAutoscalerErrorMessage('fetch autoscaler info', err), action, actionType)
          ]));
    }));

    transformData(key: string, mappedData: NormalizedResponse, guid: string, data: any) {
      mappedData.entities[key][guid] = {
        entity: data,
        metadata: {
          guid
        }
      };
      mappedData.result.push(guid);
    }
}

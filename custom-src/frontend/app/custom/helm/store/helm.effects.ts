import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { ClearPaginationOfType } from 'frontend/packages/store/src/actions/pagination.actions';
import { AppState } from 'frontend/packages/store/src/app-state';
import { entityCatalog } from 'frontend/packages/store/src/entity-catalog/entity-catalog.service';
import { NormalizedResponse } from 'frontend/packages/store/src/types/api.types';
import {
  EntityRequestAction,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from 'frontend/packages/store/src/types/request.types';
import { Observable } from 'rxjs';
import { catchError, flatMap, mergeMap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  GET_HELM_VERSIONS,
  GET_MONOCULAR_CHARTS,
  GetHelmVersions,
  GetMonocularCharts,
  HELM_INSTALL,
  HelmInstall,
} from './helm.actions';
import { HelmVersion } from './helm.types';

@Injectable()
export class HelmEffects {

  constructor(
    private httpClient: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  proxyAPIVersion = environment.proxyAPIVersion;

  @Effect()
  fetchCharts$ = this.actions$.pipe(
    ofType<GetMonocularCharts>(GET_MONOCULAR_CHARTS),
    flatMap(action => {
      const entityKey = entityCatalog.getEntityKey(action);
      return this.makeRequest(action, `/pp/${this.proxyAPIVersion}/chartsvc/v1/charts`, (response) => {
        const base = {
          entities: { [entityKey]: {} },
          result: []
        } as NormalizedResponse;

        const items = response.data as Array<any>;
        const processedData = items.reduce((res, data) => {
          const id = data.id;
          res.entities[entityKey][id] = data;
          // Promote the name to the top-level object for simplicity
          data.name = data.attributes.name;
          res.result.push(id);
          return res;
        }, base);
        return processedData;
      }, []);
    })
  );

  @Effect()
  fetchVersions$ = this.actions$.pipe(
    ofType<GetHelmVersions>(GET_HELM_VERSIONS),
    flatMap(action => {
      const entityKey = entityCatalog.getEntityKey(action);
      return this.makeRequest(action, `/pp/${this.proxyAPIVersion}/helm/versions`, (response) => {
        const processedData = {
          entities: { [entityKey]: {} },
          result: []
        } as NormalizedResponse;

        // Go through each endpoint ID
        Object.keys(response).forEach(endpoint => {
          const endpointData = response[endpoint] || {};
          // Maintain typing
          const version: HelmVersion = {
            endpointId: endpoint,
            ...endpointData
          };
          processedData.entities[entityKey][endpoint] = version;
          processedData.result.push(endpoint);
        });
        return processedData;
      }, []);
    })
  );

  @Effect()
  helmInstall$ = this.actions$.pipe(
    ofType<HelmInstall>(HELM_INSTALL),
    flatMap(action => {
      const url = '/pp/v1/helm/install';
      this.store.dispatch(new StartRequestAction(action));
      return this.httpClient.post(url, action.values).pipe(
        mergeMap(() => {
          return [
            new ClearPaginationOfType(action),
            new WrapperRequestActionSuccess(null, action)
          ];
        }),
        catchError(error => {
          const errorMessage = `Failed to install helm chart: ${error.message}`;
          return [
            new WrapperRequestActionFailed(errorMessage, action, 'create', {
              endpointIds: [action.values.endpoint],
              url: error.url || url,
              eventCode: error.status ? error.status + '' : '500',
              message: errorMessage,
              error
            })
          ];
        })
      );
    })
  );

  private makeRequest(
    action: EntityRequestAction,
    url: string,
    mapResult: (response: any) => NormalizedResponse,
    endpointIds: string[]
  ): Observable<Action> {
    this.store.dispatch(new StartRequestAction(action));
    const requestArgs = {
      headers: null,
      params: null
    };
    return this.httpClient.get(url, requestArgs).pipe(
      mergeMap((response: any) => [new WrapperRequestActionSuccess(mapResult(response), action)]),
      catchError(error => [
        new WrapperRequestActionFailed(error.message, action, 'fetch', {
          endpointIds,
          url: error.url || url,
          eventCode: error.status ? error.status + '' : '500',
          message: 'Monocular API request error',
          error
        })
      ])
    );
  }

}

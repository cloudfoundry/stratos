import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { catchError, flatMap, mergeMap } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { NormalizedResponse } from '../../../../../store/src/types/api.types';
import {
  IRequestAction,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../../../../store/src/types/request.types';
import { environment } from '../../../environments/environment';
import {
  GET_HELM_RELEASES,
  GET_HELM_VERSIONS,
  GET_MONOCULAR_CHARTS,
  GetHelmReleases,
  GetHelmVersions,
  GetMonocularCharts,
} from './helm.actions';
import { helmReleasesSchemaKey, monocularChartsSchemaKey } from './helm.entities';
import { HelmStatus } from './helm.types';

@Injectable()
export class HelmEffects {

  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  proxyAPIVersion = environment.proxyAPIVersion;

  @Effect()
  fetchCharts$ = this.actions$.pipe(
    ofType<GetMonocularCharts>(GET_MONOCULAR_CHARTS),
    flatMap(action => {
      return this.makeRequest(action, `/pp/${this.proxyAPIVersion}/chartsvc/v1/charts`, (response) => {
        const base = {
          entities: { [monocularChartsSchemaKey]: {} },
          result: []
        } as NormalizedResponse;

        const items = response.data as Array<any>;
        const processedData = items.reduce((res, data) => {
          const id = data.id;
          res.entities[monocularChartsSchemaKey][id] = data;
          // Promote the name to the top-level object for simplicity
          data.name = data.attributes.name;
          res.result.push(id);
          return res;
        }, base);
        return processedData;
      });
    })
  );


  @Effect()
  fetchReleases$ = this.actions$.pipe(
    ofType<GetHelmReleases>(GET_HELM_RELEASES),
    flatMap(action => {
      return this.makeRequest(action, `/pp/${this.proxyAPIVersion}/helm/releases`, (response) => {
        const processedData = {
          entities: { [action.entityKey]: {} },
          result: []
        } as NormalizedResponse;

        // Go through each endpoint ID
        Object.keys(response).forEach(endpoint => {
          const endpointData = response[endpoint];
          console.log(endpointData);
          if (!endpointData) {
            return;
          }
          endpointData.releases.forEach((data) => {
            // Release name is unique for an endpoint
            const id = endpoint + ':' + data.name;
            data.guid = id;
            // Make a note of the guid of the endpoint for the release
            data.endpointId = endpoint;
            data.status = mapHelmStatus(data.info.status.code);
            data.lastDeployed = mapHelmModifiedDate(data.info.last_deployed);
            data.firstDeployed = mapHelmModifiedDate(data.info.first_deployed);
            processedData.entities[helmReleasesSchemaKey][id] = data;
            processedData.result.push(id);
          });
        });
        return processedData;
      });
    })
  );

  @Effect()
  fetchVersions$ = this.actions$.pipe(
    ofType<GetHelmVersions>(GET_HELM_VERSIONS),
    flatMap(action => {
      return this.makeRequest(action, `/pp/${this.proxyAPIVersion}/helm/versions`, (response) => {
        const processedData = {
          entities: { [action.entityKey]: {} },
          result: []
        } as NormalizedResponse;

        // Go through each endpoint ID
        Object.keys(response).forEach(endpoint => {
          const endpointData = response[endpoint] || {};
          processedData.entities[action.entityKey][endpoint] = {
            endpointId: endpoint,
            ...endpointData
          };
          processedData.result.push(endpoint);
        });
        return processedData;
      });
    })
  );

  makeRequest(
    action: IRequestAction,
    url: string,
    mapResult: (response: any) => NormalizedResponse
  ): Observable<Action> {
    this.store.dispatch(new StartRequestAction(action));
    const requestArgs = {
      headers: null,
      params: null
    };
    return this.http.get(url, requestArgs).pipe(
      mergeMap((response: any) => [new WrapperRequestActionSuccess(mapResult(response), action)]),
      catchError(error => [
        new WrapperRequestActionFailed(error.message, action, 'fetch', {
          // TODO: RC This will cause issues in error bar handlers when trying to find the endpoint with id 'monocular'
          endpointIds: ['monocular'],
          url: error.url || url,
          eventCode: error.status ? error.status + '' : '500',
          message: 'Monocular API request error',
          error
        })
      ])
    );
  }
}


function mapHelmStatus(status: number) {
  return HelmStatus[status].replace('_', ' ');
}

function mapHelmModifiedDate(date: any) {
  let unix = date.seconds * 1000 + date.nanos / 1000;
  unix = Math.floor(unix);
  return new Date(unix);
}

import { WrapperRequestActionFailed } from '../../../../../store/src/types/request.types';
import { flatMap, mergeMap, catchError } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { environment } from '../../../environments/environment';
import { AppState } from '../../../../../store/src/app-state';
import { StartRequestAction, WrapperRequestActionSuccess } from '../../../../../store/src/types/request.types';
import { NormalizedResponse } from '../../../../../store/src/types/api.types';
import { GET_MONOCULAR_CHARTS, GetMonocularCharts, GET_HELM_RELEASES, GetHelmReleases } from './helm.actions';
import { monocularChartsSchemaKey, helmReleasesSchemaKey } from './helm.entities';
import { HelmStatus } from './helm.types';

@Injectable()
export class HelmEffects {

  proxyAPIVersion = environment.proxyAPIVersion;

  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect()
  fetchCharts$ = this.actions$.pipe(
    ofType<GetMonocularCharts>(GET_MONOCULAR_CHARTS),
    flatMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      const requestArgs = {
        headers: null,
        params: null
      };
      const url = `/pp/${this.proxyAPIVersion}/chartsvc/v1/charts`;
      return this.http
      .get(url, requestArgs)
      .pipe(mergeMap((response: any) => {
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
        return [
          new WrapperRequestActionSuccess(processedData, action)
        ];
      }), catchError(error => [
        new WrapperRequestActionFailed(error.message, action, 'fetch', {
          endpointIds: ['monocular'],
          url: error.url || url,
          eventCode: error.status ? error.status + '' : '500',
          message: 'Monocular API request error',
          error
        })
      ]));
    })
  );


  @Effect()
  fetchReleases$ = this.actions$.pipe(
    ofType<GetHelmReleases>(GET_HELM_RELEASES),
    flatMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      const requestArgs = {
        headers: null,
        params: null
      };
      const url = `/pp/${this.proxyAPIVersion}/helm/releases`;
      return this.http
      .get(url, requestArgs)
      .pipe(mergeMap((response: any) => {
        const processedData = {
          entities: { [helmReleasesSchemaKey]: {} },
          result: []
        } as NormalizedResponse;

        // Go through each endpoint ID
        Object.keys(response).forEach(endpoint => {
          response[endpoint].releases.forEach((data) => {
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
        return [
          new WrapperRequestActionSuccess(processedData, action)
        ];
      }), catchError(error => [
        new WrapperRequestActionFailed(error.message, action, 'fetch', {
          endpointIds: ['monocular'],
          url: error.url || url,
          eventCode: error.status ? error.status + '' : '500',
          message: 'Monocular API request error',
          error
        })
      ]));
    })
  );
}

function mapHelmStatus(status: number) {
  return HelmStatus[status].replace('_', ' ');
}

function mapHelmModifiedDate(date: any) {
  let unix = date.seconds * 1000 + date.nanos / 1000;
  unix = Math.floor(unix);
  return new Date(unix);
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { environment } from 'frontend/packages/core/src/environments/environment';
import { Observable } from 'rxjs';
import { catchError, flatMap, mergeMap } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog';
import { NormalizedResponse } from '../../../../../../store/src/types/api.types';
import {
  EntityRequestAction,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../../../../../store/src/types/request.types';
import { HelmEffects } from '../../../helm/store/helm.effects';
import { HelmRelease } from '../workload.types';
import { getHelmReleaseId } from './workloads-entity-factory';
import { GET_HELM_RELEASE, GET_HELM_RELEASES, GetHelmRelease, GetHelmReleases } from './workloads.actions';

@Injectable()
export class WorkloadsEffects {

  constructor(
    private httpClient: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  proxyAPIVersion = environment.proxyAPIVersion;


  @Effect()
  fetchReleases$ = this.actions$.pipe(
    ofType<GetHelmReleases>(GET_HELM_RELEASES),
    flatMap(action => {
      const entityKey = entityCatalog.getEntityKey(action);
      return this.makeRequest(action, `/pp/${this.proxyAPIVersion}/helm/releases`, (response) => {
        const processedData = {
          entities: { [entityKey]: {} },
          result: []
        } as NormalizedResponse;

        // Go through each endpoint ID
        Object.keys(response).forEach(endpointId => {
          const endpointData = response[endpointId];
          if (!endpointData) {
            return;
          }
          endpointData.forEach((data) => {
            const helmRelease = this.mapHelmRelease(data, endpointId, getHelmReleaseId(endpointId, data.namespace, data.name));
            processedData.entities[entityKey][helmRelease.guid] = helmRelease;
            processedData.result.push(helmRelease.guid);
          });
        });
        return processedData;
      }, []);
    })
  );

  @Effect()
  fetchHelmRelease$ = this.actions$.pipe(
    ofType<GetHelmRelease>(GET_HELM_RELEASE),
    flatMap(action => {
      const entityKey = entityCatalog.getEntityKey(action);
      return this.makeRequest(
        action,
        `/pp/${this.proxyAPIVersion}/helm/releases/${action.endpointGuid}/${action.namespace}/${action.releaseTitle}`,
        (response) => {
          const processedData = {
            entities: { [entityKey]: {} },
            result: []
          } as NormalizedResponse;

          // Go through each endpoint ID
          processedData.entities[entityKey][action.guid] = this.mapHelmRelease(response, action.endpointGuid, action.guid);
          processedData.result.push(action.guid);
          return processedData;
        }, [action.endpointGuid]);
    })
  );

  private mapHelmRelease(data, endpointId, guid: string) {
    const helmRelease: HelmRelease = {
      ...data,
      endpointId
    };
    // Release name is unique for an endpoint - for Helm 3, include the namespace
    helmRelease.guid = guid;
    // Make a note of the guid of the endpoint for the release
    helmRelease.status = data.info.status;
    helmRelease.lastDeployed = this.mapHelmModifiedDate(data.info.last_deployed);
    helmRelease.firstDeployed = this.mapHelmModifiedDate(data.info.first_deployed);
    return helmRelease;
  }

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
      catchError(error => {
        const { status, message } = HelmEffects.createHelmError(error);
        const errorMessage = `Failed to fetch helm data: ${message}`;
        return [
          new WrapperRequestActionFailed(errorMessage, action, 'fetch', {
            endpointIds,
            url: error.url || url,
            eventCode: status,
            message: errorMessage,
            error
          })
        ]
      })
    );
  }

  private mapHelmModifiedDate(date: any) {
    let unix = date.seconds * 1000 + date.nanos / 1000;
    unix = Math.floor(unix);
    return new Date(unix);
  }
}

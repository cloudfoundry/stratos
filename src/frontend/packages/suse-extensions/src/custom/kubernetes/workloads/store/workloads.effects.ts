import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { environment } from 'frontend/packages/core/src/environments/environment';
import { Observable } from 'rxjs';
import { catchError, flatMap, mergeMap } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog';
import { ApiRequestTypes } from '../../../../../../store/src/reducers/api-request-reducer/request-helpers';
import { NormalizedResponse } from '../../../../../../store/src/types/api.types';
import {
  EntityRequestAction,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../../../../../store/src/types/request.types';
import { HelmEffects } from '../../../helm/store/helm.effects';
import { HelmRelease, HelmReleaseHistory } from '../workload.types';
import { workloadsEntityCatalog } from './../workloads-entity-catalog';
import { getHelmReleaseId } from './workloads-entity-factory';
import {
  GET_HELM_RELEASE,
  GET_HELM_RELEASE_HISTORY,
  GET_HELM_RELEASES,
  GetHelmRelease,
  GetHelmReleaseHistory,
  GetHelmReleases,
  UPGRADE_HELM_RELEASE,
  UpgradeHelmRelease,
} from './workloads.actions';

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

  @Effect()
  fetchHelmReleaseHistory$ = this.actions$.pipe(
    ofType<GetHelmReleaseHistory>(GET_HELM_RELEASE_HISTORY),
    flatMap(action => {
      const entityKey = entityCatalog.getEntityKey(action);
      return this.makeRequest(
        action,
        `/pp/${this.proxyAPIVersion}/helm/releases/${action.endpointGuid}/${action.namespace}/${action.releaseTitle}/history`,
        (response) => {
          const processedData = {
            entities: { [entityKey]: {} },
            result: []
          } as NormalizedResponse;

          const data: HelmReleaseHistory = {
            endpointId: action.endpointGuid,
            releaseTitle: action.releaseTitle,
            revisions: []
          };

          for (const version of response) {
            data.revisions.push({
              ...version.info,
              revision: version.version,
              chart: version.chart.metadata,
              values: version.chart.values
            });
          }
          // Store the data against the release guid
          processedData.entities[entityKey][action.guid] = data;
          processedData.result.push(action.guid);
          return processedData;
        }, [action.endpointGuid]);
    })
  );

  @Effect()
  helmUpgrade$ = this.actions$.pipe(
    ofType<UpgradeHelmRelease>(UPGRADE_HELM_RELEASE),
    flatMap(action => {
      const requestType: ApiRequestTypes = 'update';
      const url = `/pp/v1//helm/releases/${action.endpointGuid}/${action.namespace}/${action.releaseTitle}`;
      this.store.dispatch(new StartRequestAction(action, requestType));
      // Refresh the workload after upgrade
      const fetchAction = workloadsEntityCatalog.release.actions.get(action.releaseTitle, action.endpointGuid,
        { namespace: action.namespace });
      return this.httpClient.post(url, action.values).pipe(
        mergeMap(() => {
          return [
            fetchAction,
            new WrapperRequestActionSuccess(null, action)
          ];
        }),
        catchError(error => {
          const { status, message } = HelmEffects.createHelmError(error);
          const errorMessage = `Failed to upgrade helm release: ${message}`;
          return [
            new WrapperRequestActionFailed(errorMessage, action, requestType, {
              endpointIds: [action.endpointGuid],
              url: error.url || url,
              eventCode: status,
              message: errorMessage,
              error
            })
          ];
        })
      );
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
        ];
      })
    );
  }

  private mapHelmModifiedDate(date: any) {
    let unix = date.seconds * 1000 + date.nanos / 1000;
    unix = Math.floor(unix);
    return new Date(unix);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { catchError, flatMap, mergeMap } from 'rxjs/operators';

import { ClearPaginationOfType } from '../../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../store/src/entity-catalog/entity-catalog.service';
import { NormalizedResponse } from '../../../../../store/src/types/api.types';
import {
  EntityRequestAction,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../../../../store/src/types/request.types';
import { environment } from '../../../environments/environment';
import { HELM_ENDPOINT_TYPE, helmReleaseEntityKey } from '../helm-entity-factory';
import { parseHelmReleaseStatus } from '../release/tabs/helm-release-helper.service';
import {
  GET_HELM_RELEASE_PODS,
  GET_HELM_RELEASE_SERVICES,
  GET_HELM_RELEASE_STATUS,
  GET_HELM_RELEASES,
  GET_HELM_VERSIONS,
  GET_MONOCULAR_CHARTS,
  GetHelmReleasePods,
  GetHelmReleases,
  GetHelmReleaseServices,
  GetHelmReleaseStatus,
  GetHelmVersions,
  GetMonocularCharts,
  HELM_INSTALL,
  HelmInstall,
} from './helm.actions';
import {
  HELM_INSTALLING_KEY,
  HelmRelease,
  HelmReleasePod,
  HelmReleaseService,
  HelmReleaseStatus,
  HelmStatus,
  HelmVersion,
} from './helm.types';

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
        Object.keys(response).forEach(endpoint => {
          const endpointData = response[endpoint];
          if (!endpointData) {
            return;
          }
          endpointData.releases.forEach((data) => {
            const helmRelease: HelmRelease = {
              ...data,
              endpointId: endpoint
            };
            // Release name is unique for an endpoint
            const id = endpoint + ':' + data.name;
            helmRelease.guid = id;
            // Make a note of the guid of the endpoint for the release
            helmRelease.status = mapHelmStatus(data.info.status.code);
            helmRelease.lastDeployed = mapHelmModifiedDate(data.info.last_deployed);
            helmRelease.firstDeployed = mapHelmModifiedDate(data.info.first_deployed);
            // data.info =
            processedData.entities[entityKey][id] = helmRelease;
            processedData.result.push(id);
          });
        });
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
        // const a: HelmVersion = {};
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
  fetchHelmReleaseStatus$ = this.actions$.pipe(
    ofType<GetHelmReleaseStatus>(GET_HELM_RELEASE_STATUS),
    flatMap(action => {
      const entityKey = entityCatalog.getEntityKey(action);
      return this.makeRequest(
        action,
        `/pp/${this.proxyAPIVersion}/helm/releases/${action.endpointGuid}/${action.releaseTitle}`,
        (response) => {
          const processedData = {
            entities: { [entityKey]: {} },
            result: []
          } as NormalizedResponse;

          const status = parseHelmReleaseStatus(response.info.status.resources);

          this.updateReleasePods(action, status);

          this.updateReleaseServices(action, status);

          // Go through each endpoint ID
          const newStatus: HelmReleaseStatus = {
            endpointId: action.endpointGuid,
            releaseTitle: action.releaseTitle,
            ...status
          };
          processedData.entities[entityKey][action.key] = newStatus;
          processedData.result.push(action.key);
          return processedData;
        }, [action.endpointGuid]);
    })
  );

  @Effect()
  fetchHelmReleasePods$ = this.actions$.pipe(
    ofType<GetHelmReleasePods>(GET_HELM_RELEASE_PODS),
    mergeMap(action => [new GetHelmReleaseStatus(action.endpointGuid, action.releaseTitle)])
  );

  @Effect()
  fetchHelmReleaseServices$ = this.actions$.pipe(
    ofType<GetHelmReleaseServices>(GET_HELM_RELEASE_SERVICES),
    mergeMap(action => [new GetHelmReleaseStatus(action.endpointGuid, action.releaseTitle)])
  );


  @Effect()
  helmInstall$ = this.actions$.pipe(
    ofType<HelmInstall>(HELM_INSTALL),
    flatMap(action => {
      const apiAction = this.getHelmUpdateAction(action.guid(), action.type, HELM_INSTALLING_KEY);
      const url = '/pp/v1/helm/install';
      this.store.dispatch(new StartRequestAction(apiAction));
      return this.httpClient.post(url, action.values).pipe(
        mergeMap(() => {
          return [
            new ClearPaginationOfType(apiAction),
            new WrapperRequestActionSuccess(null, apiAction)
          ];
        }),
        catchError(error => {
          const errorMessage = `Failed to install helm chart: ${error.message}`;
          return [
            new WrapperRequestActionFailed(errorMessage, apiAction, 'create', {
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

  private getHelmUpdateAction(guid: string, type: string, updatingKey: string) {
    return {
      endpointType: HELM_ENDPOINT_TYPE,
      entityType: helmReleaseEntityKey,
      guid,
      type,
      updatingKey,
    } as EntityRequestAction;
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

  private updateReleasePods(action: GetHelmReleaseStatus, status: HelmReleaseStatus) {
    const releasePodsAction = new GetHelmReleasePods(action.endpointGuid, action.releaseTitle);
    const pods = Object.values(status.data['v1/Pod']).reduce((res, pod) => {
      const newPod: HelmReleasePod = {
        endpointId: action.endpointGuid,
        releaseTitle: action.releaseTitle,
        ...pod
      };
      res[GetHelmReleasePods.createKey(action.endpointGuid, action.releaseTitle, pod.name)] = newPod;
      return res;
    }, {});
    const keys = Object.keys(pods);
    const releasePods = {
      entities: { [entityCatalog.getEntityKey(releasePodsAction)]: pods },
      result: keys
    } as NormalizedResponse;
    this.store.dispatch(new WrapperRequestActionSuccess(
      releasePods,
      releasePodsAction,
      'fetch',
      keys.length,
      1)
    );
  }

  private updateReleaseServices(action: GetHelmReleaseStatus, status: HelmReleaseStatus) {
    const releaseServiceAction = new GetHelmReleaseServices(action.endpointGuid, action.releaseTitle);
    const services = Object.values(status.data['v1/Service']).reduce((res, service) => {
      const newService: HelmReleaseService = {
        endpointId: action.endpointGuid,
        releaseTitle: action.releaseTitle,
        ...service
      };
      res[GetHelmReleasePods.createKey(action.endpointGuid, action.releaseTitle, service.name)] = newService;
      return res;
    }, {});
    const keys = Object.keys(services);
    const releaseServices = {
      entities: { [entityCatalog.getEntityKey(releaseServiceAction)]: services },
      result: keys
    } as NormalizedResponse;
    this.store.dispatch(new WrapperRequestActionSuccess(
      releaseServices,
      releaseServiceAction,
      'fetch',
      keys.length,
      1)
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


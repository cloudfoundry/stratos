import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { environment } from 'frontend/packages/core/src/environments/environment';
import { Observable } from 'rxjs';
import { catchError, flatMap, mergeMap } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog.service';
import { NormalizedResponse } from '../../../../../../store/src/types/api.types';
import {
  EntityRequestAction,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../../../../../store/src/types/request.types';
import { HelmRelease } from '../workload.types';
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
            const helmRelease = this.mapHelmRelease(data, endpointId);
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
          processedData.entities[entityKey][action.guid] = this.mapHelmRelease(response, action.endpointGuid);
          processedData.result.push(action.guid);
          return processedData;
        }, [action.endpointGuid]);
    })
  );

  private mapHelmRelease(data, endpointId) {
    // console.log('Got helm release');
    // console.log(data);
    const helmRelease: HelmRelease = {
      ...data,
      endpointId
    };
    // Release name is unique for an endpoint - for Helm 3, include the namespace
    helmRelease.guid = endpointId + ':' + data.namespace + ':' + data.name;
    // Make a note of the guid of the endpoint for the release
    helmRelease.status = this.mapHelmStatus(data.info.status);
    helmRelease.lastDeployed = this.mapHelmModifiedDate(data.info.last_deployed);
    helmRelease.firstDeployed = this.mapHelmModifiedDate(data.info.first_deployed);
    return helmRelease;
  }


  // TODO: NWM This uses GetHelmReleaseStatus. I added `namespace` to GetHelmReleaseStatus
  // RC: Don't need this anymore - services come back over the web socket
  // @Effect()
  // fetchHelmReleaseServices$ = this.actions$.pipe(
  //   ofType<GetHelmReleaseServices>(GET_HELM_RELEASE_SERVICES),
  //   mergeMap(action => [new GetHelmReleaseStatus(action.endpointGuid, action.releaseTitle)])
  // );

  // private updateReleasePods(action: GetHelmReleaseStatus, status: HelmReleaseStatus) {
  //   const releasePodsAction = new GetHelmReleasePods(action.endpointGuid, action.releaseTitle);
  //   const pods = Object.values(status.data['v1/Pod']).reduce((res, pod) => {
  //     const newPod: HelmReleasePod = {
  //       endpointId: action.endpointGuid,
  //       releaseTitle: action.releaseTitle,
  //       ...pod
  //     };
  //     res[GetHelmReleasePods.createKey(action.endpointGuid, action.releaseTitle, pod.name)] = newPod;
  //     return res;
  //   }, {});
  //   const keys = Object.keys(pods);
  //   const releasePods = {
  //     entities: { [entityCatalog.getEntityKey(releasePodsAction)]: pods },
  //     result: keys
  //   } as NormalizedResponse;
  //   this.store.dispatch(new WrapperRequestActionSuccess(
  //     releasePods,
  //     releasePodsAction,
  //     'fetch',
  //     keys.length,
  //     1)
  //   );
  // }

  // private updateReleaseServices(action: GetHelmReleaseStatus, status: HelmReleaseStatus) {
  //   const releaseServiceAction = new GetHelmReleaseServices(action.endpointGuid, action.releaseTitle);
  //   const services = Object.values(status.data['v1/Service']).reduce((res, service) => {
  //     const newService: HelmReleaseService = {
  //       endpointId: action.endpointGuid,
  //       releaseTitle: action.releaseTitle,
  //       ...service
  //     };
  //     res[GetHelmReleasePods.createKey(action.endpointGuid, action.releaseTitle, service.name)] = newService;
  //     return res;
  //   }, {});
  //   const keys = Object.keys(services);
  //   const releaseServices = {
  //     entities: { [entityCatalog.getEntityKey(releaseServiceAction)]: services },
  //     result: keys
  //   } as NormalizedResponse;
  //   this.store.dispatch(new WrapperRequestActionSuccess(
  //     releaseServices,
  //     releaseServiceAction,
  //     'fetch',
  //     keys.length,
  //     1)
  //   );
  // }

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
          message: 'Helm Release API request error',
          error
        })
      ])
    );
  }

  // function _mapHelmStatus(status: number) {
  //   return HelmStatus[status].replace('_', ' ');
  // }

  private mapHelmStatus(status: string) {
    // TODO: Capitalize first letter
    return status;
    // return HelmStatus[status].replace('_', ' ');
  }

  private mapHelmModifiedDate(date: any) {
    let unix = date.seconds * 1000 + date.nanos / 1000;
    unix = Math.floor(unix);
    return new Date(unix);
  }
}

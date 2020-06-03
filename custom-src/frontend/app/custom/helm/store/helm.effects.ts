import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { GET_ENDPOINTS_SUCCESS, GetAllEndpointsSuccess } from 'frontend/packages/store/src/actions/endpoint.actions';
import { ClearPaginationOfType } from 'frontend/packages/store/src/actions/pagination.actions';
import { AppState } from 'frontend/packages/store/src/app-state';
import { entityCatalog } from 'frontend/packages/store/src/entity-catalog/entity-catalog';
import { ApiRequestTypes } from 'frontend/packages/store/src/reducers/api-request-reducer/request-helpers';
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
import { isJetstreamError } from '../../../jetstream.helpers';
import { HELM_ENDPOINT_TYPE } from '../helm-entity-factory';
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

  // Endpoints that we know are synchronizing
  private syncing = {};
  private syncTimer = null;

  proxyAPIVersion = environment.proxyAPIVersion;

  // Ensure that we refresh the charts when a repository finishes synchronizing
  @Effect()
  updateOnSyncFinished$ = this.actions$.pipe(
    ofType<GetAllEndpointsSuccess>(GET_ENDPOINTS_SUCCESS),
    flatMap(action => {
      // Look to see if we have any endpoints that are sycnhronizing
      let updated = false;
      Object.values(action.payload.entities.stratosEndpoint).forEach(endpoint => {
        if (endpoint.cnsi_type === HELM_ENDPOINT_TYPE && endpoint.endpoint_metadata) {
          if (endpoint.endpoint_metadata.status === 'Synchronizing') {
            // An endpoint is busy, so add it to the list to be monitored
            if (!this.syncing[endpoint.guid]) {
              this.syncing[endpoint.guid] = true;
              updated = true;
            }
          }
        }
      });

      if (updated) {
        // Schedule check
        this.scheduleSyncStatusCheck();
      }
      return [];
    })
  );

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
          if (isJetstreamError(endpointData)) {
            throw endpointData;
          }
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
      const requestType: ApiRequestTypes = 'create';
      const url = '/pp/v1/helm/install';
      this.store.dispatch(new StartRequestAction(action, requestType));
      return this.httpClient.post(url, action.values).pipe(
        mergeMap(() => {
          return [
            new ClearPaginationOfType(action),
            new WrapperRequestActionSuccess(null, action)
          ];
        }),
        catchError(error => {
          const { status, message } = this.createHelmError(error);
          const errorMessage = `Failed to install helm chart: ${message}`;
          return [
            new WrapperRequestActionFailed(errorMessage, action, requestType, {
              endpointIds: [action.values.endpoint],
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
        const { status, message } = this.createHelmError(error);
        return [
          new WrapperRequestActionFailed(message, action, 'fetch', {
            endpointIds,
            url: error.url || url,
            eventCode: status,
            message,
            error
          })
        ];
      })
    );
  }

  private createHelmErrorMessage(err: any): string {
    if (err) {
      if (err.error && err.error.message) {
        // Kube error
        return err.error.message;
      } else if (err.message) {
        // Http error
        return err.message;
      } else if (err.error.status) {
        // Jetstream error
        return err.error.status;
      }
    }
    return 'Helm API request error';
  }

  private createHelmError(err: any): { status: string, message: string } {
    let unwrapped = err;
    if (err.error) {
      unwrapped = err.error;
    }
    const jetstreamError = isJetstreamError(unwrapped);
    if (jetstreamError) {
      // Wrapped error
      return {
        status: jetstreamError.error.statusCode.toString(),
        message: this.createHelmErrorMessage(jetstreamError)
      };
    }
    return {
      status: err && err.status ? err.status + '' : '500',
      message: this.createHelmErrorMessage(err)
    };
  }

  private checkSyncStatus() {
    // Dispatch request
    const url = `/pp/${this.proxyAPIVersion}/chartrepos/status`;
    const requestArgs = {
      headers: null,
      params: null
    };
    const req = this.httpClient.post(url, this.syncing, requestArgs);
    req.subscribe(data => {
      if (data) {
        const existing = Object.keys(data).length;
        const syncing = {};
        Object.keys(data).forEach(guid => {
          if (data[guid]) {
            syncing[guid] = true;
          }
        });
        const remaining = Object.keys(syncing).length;
        this.syncing = syncing;
        if (remaining !== existing) {
          // Dispatch action to refresh charts
          this.store.dispatch(new GetMonocularCharts());
        }
        if (remaining > 0) {
          this.scheduleSyncStatusCheck();
        }
      }
    });
  }

  private scheduleSyncStatusCheck() {
    if (this.syncTimer !== null) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    this.syncTimer = setTimeout(() => this.checkSyncStatus(), 5000);
  }

}

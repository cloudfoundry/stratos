import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TailwindSnackBarService } from '../../../../core/src/shared/services/tailwind-snackbar.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { catchError, first, flatMap, map, mergeMap, withLatestFrom } from 'rxjs/operators';

import { environment } from '../../../../core/src/environments/environment';
import {
  EndpointActionComplete,
  GET_ENDPOINTS_SUCCESS,
  GetAllEndpointsSuccess,
  REGISTER_ENDPOINTS_SUCCESS,
  UNREGISTER_ENDPOINTS_SUCCESS,
  UnregisterEndpoint,
} from '../../../../store/src/actions/endpoint.actions';
import { ClearPaginationOfType, ResetPaginationOfType } from '../../../../store/src/actions/pagination.actions';
import { EntitySchema } from '../../../../store/src/helpers/entity-schema';
import { isJetstreamError } from '../../../../store/src/jetstream';
import {
  AppState,
  EndpointModel,
  entityCatalog,
  NormalizedResponse,
  WrapperRequestActionSuccess,
} from '../../../../store/src/public-api';
import { ApiRequestTypes } from '../../../../store/src/reducers/api-request-reducer/request-helpers';
import { endpointOfTypeSelector } from '../../../../store/src/selectors/endpoint.selectors';
import { stratosEntityCatalog } from '../../../../store/src/stratos-entity-catalog';
import {
  EntityRequestAction,
  StartRequestAction,
  WrapperRequestActionFailed,
} from '../../../../store/src/types/request.types';
import { helmEntityCatalog } from '../helm-entity-catalog';
import { HELM_ENDPOINT_TYPE, HELM_HUB_ENDPOINT_TYPE, HELM_REPO_ENDPOINT_TYPE } from '../helm-entity-factory';
import { Chart } from '../monocular/shared/models/chart';
import { ChartVersion } from '../monocular/shared/models/chart-version';
import { stratosMonocularEndpointGuid } from '../monocular/stratos-monocular.helper';
import {
  GET_HELM_VERSIONS,
  GET_MONOCULAR_CHART_VERSIONS,
  GET_MONOCULAR_CHARTS,
  GetHelmChartVersions,
  GetHelmVersions,
  GetMonocularCharts,
  HELM_INSTALL,
  HELM_SYNCHRONISE,
  HelmInstall,
  HelmSynchronise,
} from './helm.actions';
import { HelmVersion } from './helm.types';

type MonocularChartsResponse = {
  data: Chart[];
};

const mapMonocularChartResponse = (
  entityKey: string,
  response: MonocularChartsResponse,
  schema: EntitySchema
): NormalizedResponse => {
  const base: NormalizedResponse = {
    entities: { [entityKey]: {} },
    result: []
  };

  const items = response.data as Array<Chart>;
  const processedData: NormalizedResponse = items.reduce((res, data) => {
    const id = schema.getId(data);
    res.entities[entityKey][id] = data;
    // Promote the name to the top-level object for simplicity
    data.name = data.attributes.name;
    res.result.push(id);
    return res;
  }, base);
  return processedData;
};

const mergeMonocularChartResponses = (
  entityKey: string,
  responses: MonocularChartsResponse[],
  schema: EntitySchema
): NormalizedResponse => {
  const combined = responses.reduce((res, response) => {
    res.data = res.data.concat(response.data);
    return res;
  }, { data: [] });
  return mapMonocularChartResponse(entityKey, combined, schema);
};

const addMonocularId = (endpointId: string, response: MonocularChartsResponse): MonocularChartsResponse => {
  const data = response.data.map(chart => ({
    ...chart,
    monocularEndpointId: endpointId
  }));
  return {
    data
  };
};

@Injectable({
  providedIn: 'root'
})
export class HelmEffects {

  constructor(
    private httpClient: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>,
    public snackBar: TailwindSnackBarService
  ) { }

  // Endpoints that we know are synchronizing
  private syncing: Record<string, boolean> = {};
  private syncTimer: ReturnType<typeof setTimeout> | null = null;

  proxyAPIVersion = environment.proxyAPIVersion;

  // Ensure that we refresh the charts when a repository finishes synchronizing

  updateOnSyncFinished$ = createEffect(() => this.actions$.pipe(
    ofType<GetAllEndpointsSuccess>(GET_ENDPOINTS_SUCCESS),
    flatMap((action): Action[] => {
      // Look to see if we have any endpoints that are synchronizing
      let updated = false;
      Object.values(action.payload.entities.stratosEndpoint).forEach((endpoint: unknown) => {
        const ep = endpoint as EndpointModel;
        if (ep.cnsi_type === HELM_ENDPOINT_TYPE && ep.endpoint_metadata) {
          if (ep.endpoint_metadata.status === 'Synchronizing') {
            // An endpoint is busy, so add it to the list to be monitored
            if (!this.syncing[ep.guid]) {
              this.syncing[ep.guid] = true;
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
  ));

  
  fetchCharts$ = createEffect(() => this.actions$.pipe(
    ofType<GetMonocularCharts>(GET_MONOCULAR_CHARTS),
    withLatestFrom(this.store),
    flatMap(([action, appState]) => {
      const entityKey = entityCatalog.getEntityKey(action);

      this.store.dispatch(new StartRequestAction(action));

      const helmEndpoints = Object.values(endpointOfTypeSelector(HELM_ENDPOINT_TYPE)(appState)) as EndpointModel[];
      const helmHubEndpoint = helmEndpoints.find(endpoint => (endpoint as any).sub_type === HELM_HUB_ENDPOINT_TYPE);

      // See https://github.com/SUSE/stratos/issues/466. It would be better to use the standard proxy for this request and go out to all
      // valid helm sub types instead of making two requests here
      return combineLatest([
        this.createHelmRepoRequest(helmEndpoints as EndpointModel[]),
        this.createHelmHubRequest(helmHubEndpoint as EndpointModel)
      ]).pipe(
        map(res => mergeMonocularChartResponses(entityKey, res, action.entity[0])),
        mergeMap((response: NormalizedResponse) => {
          return [new WrapperRequestActionSuccess(response, action)];
        }),
        catchError(error => {
          const { status, message } = HelmEffects.createHelmError(error);
          const endpointIds = helmEndpoints.map(e => (e as EndpointModel).guid);
          if (helmHubEndpoint) {
            endpointIds.push((helmHubEndpoint as EndpointModel).guid);
          }
          return [
            new WrapperRequestActionFailed(message, action, 'fetch', {
              endpointIds,
              url: null,
              eventCode: status,
              message,
              error
            })
          ];
        })
      );
    })
  ));

  
  fetchVersions$ = createEffect(() => this.actions$.pipe(
    ofType<GetHelmVersions>(GET_HELM_VERSIONS),
    flatMap(action => {
      const entityKey = entityCatalog.getEntityKey(action);
      return this.makeRequest(action, `/pp/${this.proxyAPIVersion}/helm/versions`, (response) => {
        const processedData: NormalizedResponse = {
          entities: { [entityKey]: {} },
          result: []
        };

        // Go through each endpoint ID
        Object.keys(response).forEach(endpoint => {
          const responseObj = response as Record<string, unknown>;
          const endpointData = responseObj[endpoint] || {};
          if (isJetstreamError(endpointData)) {
            throw endpointData;
          }
          // Maintain typing
          const version: HelmVersion = {
            endpointId: endpoint,
            ...endpointData as Omit<HelmVersion, 'endpointId'>
          };
          processedData.entities[entityKey][action.entity[0].getId(version)] = version;
          processedData.result.push(endpoint);
        });
        return processedData;
      }, []);
    })
  ));

  
  fetchChartVersions$ = createEffect(() => this.actions$.pipe(
    ofType<GetHelmChartVersions>(GET_MONOCULAR_CHART_VERSIONS),
    flatMap(action => {
      const entityKey = entityCatalog.getEntityKey(action);
      return this.makeRequest(action, `/pp/${this.proxyAPIVersion}/chartsvc/v1/charts/${action.repoName}/${action.chartName}/versions`,
        (response) => {
          const base: NormalizedResponse = {
            entities: { [entityKey]: {} },
            result: []
          };

          const items = (response as { data: ChartVersion[] }).data;
          const processedData = items.reduce((res, data) => {
            const id = action.entity[0].getId(data);
            res.entities[entityKey][id] = data;
            // Promote the name to the top-level object for simplicity
            (data as unknown as { name: string }).name = data.attributes.name;
            res.result.push(id);
            return res;
          }, base);
          return processedData;
        }, [], {
        'x-cap-cnsi-list': action.monocularEndpoint && action.monocularEndpoint !== stratosMonocularEndpointGuid ?
          action.monocularEndpoint :
          ''
      });
    })
  ));

  
  helmInstall$ = createEffect(() => this.actions$.pipe(
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
          const { status, message } = HelmEffects.createHelmError(error);
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
  ));


  helmSynchronise$ = createEffect(() => this.actions$.pipe(
    ofType<HelmSynchronise>(HELM_SYNCHRONISE),
    flatMap((action): Action[] => {
      const requestArgs: { headers: null; params: null } = {
        headers: null,
        params: null
      };
      const proxyAPIVersion = environment.proxyAPIVersion;
      const url = `/pp/${proxyAPIVersion}/chartrepos/${action.endpoint.guid}`;
      const req = this.httpClient.post(url, requestArgs);
      req.subscribe((ok: unknown) => {
        this.snackBar.open('Helm Repository synchronization started', 'Dismiss', { duration: 3000 });
      }, (err: unknown) => {
        this.snackBar.open(`Failed to Synchronize Helm Repository '${action.endpoint.name}'`, 'Dismiss', { duration: 5000 });
      });
      return [];
    })
  ));

  
  endpointUnregister$ = createEffect(() => this.actions$.pipe(
    ofType<UnregisterEndpoint>(UNREGISTER_ENDPOINTS_SUCCESS),
    flatMap(action => stratosEntityCatalog.endpoint.store.getEntityMonitor(action.guid).entity$.pipe(
      first(),
      mergeMap(endpoint => {
        if (endpoint.cnsi_type !== HELM_ENDPOINT_TYPE) {
          return [];
        }
        return [
          new ResetPaginationOfType(helmEntityCatalog.chart.getSchema()),
          new ResetPaginationOfType(helmEntityCatalog.chartVersions.getSchema()),
          new ResetPaginationOfType(helmEntityCatalog.version.getSchema()),
        ];
      })
    ))
  ));

  
  registerEndpoint$ = createEffect(() => this.actions$.pipe(
    ofType<EndpointActionComplete>(REGISTER_ENDPOINTS_SUCCESS),
    flatMap(action => {
      const endpoint: EndpointModel = action.endpoint as EndpointModel;
      if (endpoint && endpoint.cnsi_type === HELM_ENDPOINT_TYPE && endpoint.sub_type === HELM_HUB_ENDPOINT_TYPE) {
        return [
          new ResetPaginationOfType(helmEntityCatalog.chart.getSchema()),
        ];
      }
      return [];
    })
  ));

  private static createHelmErrorMessage(err: any): string {
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

  public static createHelmError(err: any): { status: string, message: string, } {
    let unwrapped = err;
    if (err.error) {
      unwrapped = err.error;
    }
    const jetstreamError = isJetstreamError(unwrapped);
    if (jetstreamError) {
      // Wrapped error
      return {
        status: jetstreamError.error.statusCode.toString(),
        message: HelmEffects.createHelmErrorMessage(jetstreamError)
      };
    }
    return {
      status: err && err.status ? err.status + '' : '500',
      message: this.createHelmErrorMessage(err)
    };
  }

  private createHelmHubRequest(helmHubEndpoint: EndpointModel): Observable<MonocularChartsResponse> {
    return helmHubEndpoint ?
      this.httpClient.get<MonocularChartsResponse>(`/pp/${this.proxyAPIVersion}/chartsvc/v1/charts`, {
        headers: {
          'x-cap-cnsi-list': helmHubEndpoint.guid
        }
      }).pipe(map(res => addMonocularId(helmHubEndpoint.guid, res))) :
      of({ data: [] });
  }

  private createHelmRepoRequest(helmEndpoints: EndpointModel[]): Observable<MonocularChartsResponse> {
    const helmRepoEndpoints = helmEndpoints.find(endpoint => endpoint.sub_type === HELM_REPO_ENDPOINT_TYPE);
    return helmRepoEndpoints ?
      this.httpClient.get<MonocularChartsResponse>(`/pp/${this.proxyAPIVersion}/chartsvc/v1/charts`) :
      of({ data: [] });
  }

  private makeRequest(
    action: EntityRequestAction,
    url: string,
    mapResult: (response: unknown) => NormalizedResponse,
    endpointIds: string[],
    headers: Record<string, string> = {}
  ): Observable<Action> {
    this.store.dispatch(new StartRequestAction(action));
    const requestArgs: { headers: Record<string, string>; params: null } = {
      headers,
      params: null
    };
    return this.httpClient.get(url, requestArgs).pipe(
      mergeMap((response: unknown) => {
        return [new WrapperRequestActionSuccess(mapResult(response), action)];
      }),
      catchError(error => {
        const { status, message } = HelmEffects.createHelmError(error);
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

  private checkSyncStatus(): void {
    // Dispatch request
    const url = `/pp/${this.proxyAPIVersion}/chartrepos/status`;
    const requestArgs: { headers: null; params: null } = {
      headers: null,
      params: null
    };
    const req = this.httpClient.post<Record<string, boolean>>(url, this.syncing, requestArgs);
    req.subscribe((data: Record<string, boolean> | null) => {
      if (data) {
        const existing = Object.keys(data).length;
        const syncing: Record<string, boolean> = {};
        Object.keys(data).forEach((guid: string) => {
          if (data[guid]) {
            syncing[guid] = true;
          }
        });
        const remaining = Object.keys(syncing).length;
        this.syncing = syncing;
        if (remaining !== existing) {
          // Dispatch action to refresh charts
          helmEntityCatalog.chart.api.getMultiple();
        }
        if (remaining > 0) {
          this.scheduleSyncStatusCheck();
        }
      }
    });
  }

  private scheduleSyncStatusCheck(): void {
    if (this.syncTimer !== null) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    this.syncTimer = setTimeout(() => this.checkSyncStatus(), 5000);
  }

}

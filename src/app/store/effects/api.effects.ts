import { request } from 'http';
import { totalmem } from 'os';
import { WrapperRequestActionSuccess, WrapperRequestActionFailed, StartRequestAction } from './../types/request.types';
import { qParamsToString } from '../reducers/pagination-reducer/pagination-reducer.helper';
import { resultPerPageParam, resultPerPageParamDefault } from '../reducers/pagination-reducer/pagination-reducer.types';
import { getRequestTypeFromMethod } from '../reducers/api-request-reducer/request-helpers';
import {
  CFStartAction,
  IRequestAction,
  ICFAction,
  StartCFAction,
} from '../types/request.types';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

import { Injectable } from '@angular/core';
import { Headers, Http, Request, RequestMethod, Response, URLSearchParams } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { normalize } from 'normalizr';
import { Observable } from 'rxjs/Observable';
import { ClearPaginationOfType } from '../actions/pagination.actions';
import { environment } from './../../../environments/environment';
import { ApiActionTypes } from './../actions/request.actions';
import { APIResource, NormalizedResponse } from './../types/api.types';
import { AppState, IRequestEntityTypeState } from './../app-state';
import { PaginatedAction, PaginationEntityState, PaginationParam } from '../types/pagination.types';
import { selectPaginationState } from '../selectors/pagination.selectors';
import { CNSISModel, cnsisStoreNames } from '../types/cnsis.types';
import { map, mergeMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs/observable/forkJoin';

const { proxyAPIVersion, cfAPIVersion } = environment;

@Injectable()
export class APIEffect {

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  // @Effect() apiRequestStart$ = this.actions$.ofType<ICFAction>(ApiActionTypes.API_REQUEST)
  //   .map(apiAction => {
  // return new StartCFAction(
  //   apiAction,
  //   getRequestTypeFromMethod(apiAction.options.method)
  // );
  //   });

  @Effect() apiRequest$ = this.actions$.ofType<ICFAction | PaginatedAction>(ApiActionTypes.API_REQUEST_START)
    .withLatestFrom(this.store)
    .mergeMap(([action, state]) => {

      const paramsObject = {};
      const apiAction = action as ICFAction;
      const paginatedAction = action as PaginatedAction;
      const options = { ...apiAction.options };
      const requestType = getRequestTypeFromMethod(apiAction.options.method);

      this.store.dispatch(new StartRequestAction(action, requestType));
      this.store.dispatch(this.getActionFromString(apiAction.actions[0]));

      // Apply the params from the store
      if (paginatedAction.paginationKey) {
        options.params = new URLSearchParams();
        const paginationParams = this.getPaginationParams(selectPaginationState(apiAction.entityKey, paginatedAction.paginationKey)(state));
        if (paginationParams.hasOwnProperty('q')) {
          // Convert q into a cf q string
          paginationParams.qString = qParamsToString(paginationParams.q);
          for (const q of paginationParams.qString) {
            options.params.append('q', q);
          }
          delete paginationParams.qString;
          delete paginationParams.q;
        }
        for (const key in paginationParams) {
          if (paginationParams.hasOwnProperty(key)) {
            if (key === 'page' || !options.params.has(key)) { // Don't override params from actions except page.
              options.params.set(key, paginationParams[key] as string);
            }
          }
        }
        if (!options.params.has(resultPerPageParam)) {
          options.params.set(resultPerPageParam, resultPerPageParamDefault.toString());
        }
      }

      options.url = `/pp/${proxyAPIVersion}/proxy/${cfAPIVersion}/${options.url}`;
      options.headers = this.addBaseHeaders(
        apiAction.cnis ||
        state.requestData.endpoint, options.headers
      );

      if (paginatedAction.flattenPagination) {
        options.params.set('page', '1');
      }

      let request = this.makeRequest(options);

      // Should we flatten all pages into the first, thus fetching all entities?
      if (paginatedAction.flattenPagination) {
        request = this.flattenPagination(request, options);
      }

      return request
        .map(resData => this.handleMultiEndpoints(resData, apiAction)) // Check for errors and fetch entities
        .mergeMap(response => {
          const { entities, totalResults } = response;
          const actions = [];
          actions.push({ type: apiAction.actions[1], apiAction });
          actions.push(new WrapperRequestActionSuccess(
            entities,
            apiAction,
            requestType,
            totalResults
          ));

          if (
            apiAction.options.method === 'post' || apiAction.options.method === RequestMethod.Post ||
            apiAction.options.method === 'delete' || apiAction.options.method === RequestMethod.Delete
          ) {
            actions.unshift(new ClearPaginationOfType(apiAction.entityKey));
          }

          return actions;
        })
        .catch(err => {
          return [
            { type: apiAction.actions[2], apiAction },
            new WrapperRequestActionFailed(
              err.message,
              apiAction,
              requestType
            )
          ];
        });
    });

  private completeResourceEntity(resource: APIResource | any, cfGuid: string, guid: string): APIResource {
    if (!resource) {
      return resource;
    }
    return resource.metadata ? {
      entity: { ...resource.entity, guid: resource.metadata.guid, cfGuid },
      metadata: resource.metadata
    } : {
        entity: { ...resource, cfGuid },
        metadata: { guid: guid }
      };
  }

  getErrors(resData) {
    return Object.keys(resData)
      .map(guid => {
        const cnsis = resData[guid];
        cnsis.guid = guid;
        return cnsis;
      })
      .filter(cnsis => {
        return cnsis.error;
      });
  }

  getEntities(apiAction: IRequestAction, data): {
    entities: NormalizedResponse
    totalResults: number
  } {
    let totalResults = 0;
    const allEntities = Object.keys(data).map(cfGuid => {
      const cfData = data[cfGuid];
      totalResults += cfData['total_results'];
      if (cfData.resources) {
        if (!cfData.resources.length) {
          return null;
        }
        return cfData.resources.map(resource => {
          return this.completeResourceEntity(resource, cfGuid, resource.guid);
        });
      } else if (cfData[0]) {
        delete cfData.guid;
        return Object.keys(cfData).map(key => {
          const guid = apiAction.guid + '-' + key;
          const result = this.completeResourceEntity(cfData[key], cfGuid, guid);
          result.entity.guid = guid;
          return result;
        });
      } else {
        return this.completeResourceEntity(cfData, cfGuid, cfData.guid);
      }
    });
    const flatEntities = [].concat(...allEntities).filter(e => !!e);
    return {
      entities: flatEntities.length ? normalize(flatEntities, apiAction.entity) : null,
      totalResults
    };
  }

  mergeData(entity, metadata, cfGuid) {
    return { ...entity, ...metadata, cfGuid };
  }

  addBaseHeaders(cnsis: IRequestEntityTypeState<CNSISModel> | string, header: Headers): Headers {
    const cnsiHeader = 'x-cap-cnsi-list';
    const headers = header || new Headers();
    if (typeof cnsis === 'string') {
      headers.set(cnsiHeader, cnsis);
    } else {
      const registeredCNSIGuids = [];
      Object.keys(cnsis).forEach(cnsiGuid => {
        const cnsi = cnsis[cnsiGuid];
        if (cnsi.registered) {
          registeredCNSIGuids.push(cnsi.guid);
        }
      });
      headers.set(cnsiHeader, registeredCNSIGuids);
    }
    return headers;
  }

  getActionFromString(type: string) {
    return { type };
  }

  getPaginationParams(paginationState: PaginationEntityState): PaginationParam {
    return paginationState ? {
      ...paginationState.params,
      page: paginationState.currentPage.toString(),
    } : {};
  }

  private makeRequest(options): Observable<any> {
    return this.http.request(new Request(options)).map(response => {
      let resData;
      try {
        resData = response.json();
      } catch (e) {
        resData = null;
      }
      return resData;
    });
  }

  private handleMultiEndpoints(resData, apiAction): {
    resData,
    entities,
    totalResults
  } {
    if (resData) {
      const cnsisErrors = this.getErrors(resData);
      if (cnsisErrors.length) {
        // We should consider not completely failing the whole if some cnsis return.
        throw Observable.throw(`Error from cnsis: ${cnsisErrors.map(res => `${res.guid}: ${res.error}.`).join(', ')}`);
      }
    }
    let entities;
    let totalResults = 0;

    if (resData) {
      const entityData = this.getEntities(apiAction, resData);
      entities = entityData.entities;
      totalResults = entityData.totalResults;
    }

    entities = entities || {
      entities: {},
      result: []
    };

    return {
      resData,
      entities,
      totalResults
    };
  }

  private flattenPagination(firstRequest: Observable<{ resData }>, options) {
    return firstRequest.pipe(
      mergeMap(firstResData => {
        // Discover the endpoint with the most pages. This is the amount of request we will need to make to fetch all pages from all
        // endpoints
        let maxPages = 0;
        Object.keys(firstResData).forEach(endpointGuid => {
          const endpoint = firstResData[endpointGuid];
          if (maxPages < endpoint.total_pages) {
            maxPages = endpoint.total_pages;
          }
        });
        // Make those requests
        const requests = [];
        requests.push(Observable.of(firstResData)); // Already made the first request, don't repeat it
        for (let i = 2; i <= maxPages; i++) { // Make any additional page requests
          const requestOption = { ...options };
          requestOption.params.set('page', i.toString());
          requests.push(this.makeRequest(requestOption));
        }
        return forkJoin(requests);
      }),
      map((responses: Array<any>) => {
        // Merge all responses into the first page
        const newResData = responses[0];
        const endpointGuids = Object.keys(newResData);
        for (let i = 1; i < responses.length; i++) { // Make any additional page requests
          const endpointResponse = responses[i];
          endpointGuids.forEach(endpointGuid => {
            const endpoint = endpointResponse[endpointGuid];
            if (endpoint && endpoint.resources && endpoint.resources.length) {
              newResData[endpointGuid].resources = newResData[endpointGuid].resources.concat(endpoint.resources);
            }
          });
        }
        return newResData;
      })
    );
  }
}

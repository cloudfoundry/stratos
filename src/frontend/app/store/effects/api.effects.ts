import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

import { Injectable } from '@angular/core';
import { Headers, Http, Request, RequestMethod, URLSearchParams } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { normalize } from 'normalizr';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { first, map, mergeMap } from 'rxjs/operators';

import { LoggerService } from '../../core/logger.service';
import { ClearPaginationOfEntity, ClearPaginationOfType } from '../actions/pagination.actions';
import {
  EntityInlineParentAction,
  isEntityInlineParentAction,
  listRelations,
  validateEntityRelations,
} from '../helpers/entity-relations.helpers';
import { getRequestTypeFromMethod } from '../reducers/api-request-reducer/request-helpers';
import { qParamsToString } from '../reducers/pagination-reducer/pagination-reducer.helper';
import { resultPerPageParam, resultPerPageParamDefault } from '../reducers/pagination-reducer/pagination-reducer.types';
import { selectPaginationState } from '../selectors/pagination.selectors';
import { EndpointModel } from '../types/endpoint.types';
import { PaginatedAction, PaginationEntityState, PaginationParam } from '../types/pagination.types';
import { ICFAction, IRequestAction, RequestEntityLocation } from '../types/request.types';
import { environment } from './../../../environments/environment';
import { ApiActionTypes, ValidateEntitiesStart } from './../actions/request.actions';
import { AppState, IRequestEntityTypeState } from './../app-state';
import { APIResource, NormalizedResponse } from './../types/api.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from './../types/request.types';

const { proxyAPIVersion, cfAPIVersion } = environment;

@Injectable()
export class APIEffect {

  constructor(
    private logger: LoggerService,
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect() apiRequest$ = this.actions$.ofType<ICFAction | PaginatedAction>(ApiActionTypes.API_REQUEST_START)
    .withLatestFrom(this.store)
    .mergeMap(([action, state]) => {
      return this.doApiRequest(action, state);
    });

  private doApiRequest(action, state) {
    const actionClone = { ...action };
    const paramsObject = {};
    const apiAction = actionClone as ICFAction;
    const paginatedAction = actionClone as PaginatedAction;
    const options = { ...apiAction.options };
    const requestType = getRequestTypeFromMethod(apiAction.options.method);

    this.store.dispatch(new StartRequestAction(actionClone, requestType));
    this.store.dispatch(this.getActionFromString(apiAction.actions[0]));
    // Apply the params from the store
    if (paginatedAction.paginationKey) {
      options.params = new URLSearchParams();
      const paginationState = selectPaginationState(apiAction.entityKey, paginatedAction.paginationKey)(state);
      const paginationParams = this.getPaginationParams(paginationState);
      paginatedAction.pageNumber = paginationState ? paginationState.currentPage : 1;
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
      apiAction.endpointGuid ||
      state.requestData.endpoint, options.headers
    );

    if (paginatedAction.flattenPagination) {
      options.params.set('page', '1');
    }

    this.addRelationParams(options, apiAction);

    let request = this.makeRequest(options);

    // Should we flatten all pages into the first, thus fetching all entities?
    if (paginatedAction.flattenPagination) {
      request = this.flattenPagination(request, options);
    }

    return request.pipe(
      map(response => {
        return this.handleMultiEndpoints(response, actionClone);
      }),
      mergeMap(response => {
        const { entities, totalResults, totalPages } = response;
        // const validationFinished = validateEntityRelations(
        //   this.store,
        //   entities.entities,
        //   actionClone,
        //   Object.values(entities.entities[apiAction.entityKey]),
        //   true, true);
        return [new ValidateEntitiesStart(
          actionClone,
          entities.result,
          true,
          {
            response: entities,
            totalResults,
            totalPages
          }
        )];
      }),
      // mergeMap(result => {
      //   return result.validationFinished.pipe(
      //     map(() => result)
      //   );
      // }),
      // mergeMap(result => {
      //   const actions = [];
      //   actions.push({ type: actionClone.actions[1], apiAction: actionClone });
      //   actions.push(new WrapperRequestActionSuccess(
      //     result.response.entities,
      //     actionClone,
      //     requestType,
      //     result.response.totalResults,
      //     result.response.totalPages
      //   ));

      //   if (
      //     !actionClone.updatingKey &&
      //     actionClone.options.method === 'post' || actionClone.options.method === RequestMethod.Post ||
      //     actionClone.options.method === 'delete' || actionClone.options.method === RequestMethod.Delete
      //   ) {
      //     if (actionClone.removeEntityOnDelete) {
      //       actions.unshift(new ClearPaginationOfEntity(actionClone.entityKey, actionClone.guid));
      //     } else {
      //       actions.unshift(new ClearPaginationOfType(actionClone.entityKey));
      //     }
      //   }
      //   return actions;
      // })
    ).catch(errObservable => {
      this.logger.warn(`API request process failed`, errObservable.error);
      return [
        { type: actionClone.actions[2], apiAction: actionClone },
        new WrapperRequestActionFailed(
          errObservable.message,
          actionClone,
          requestType
        )
      ];
    });
  }

  private completeResourceEntity(resource: APIResource | any, cfGuid: string, guid: string): APIResource {
    if (!resource) {
      return resource;
    }

    const result = resource.metadata ? {
      entity: { ...resource.entity, guid: resource.metadata.guid, cfGuid },
      metadata: resource.metadata
    } : {
        entity: { ...resource, cfGuid },
        metadata: { guid: guid }
      };

    // Inject `cfGuid` in nested entities
    Object.keys(result.entity).forEach(resourceKey => {
      const nestedResourceEntity = result.entity[resourceKey];
      if (nestedResourceEntity &&
        nestedResourceEntity.hasOwnProperty('entity') &&
        nestedResourceEntity.hasOwnProperty('metadata')) {
        resource.entity[resourceKey] = this.completeResourceEntity(nestedResourceEntity, cfGuid, nestedResourceEntity.metadata.guid);
      }
    });

    return result;
  }

  getErrors(resData) {
    return Object.keys(resData)
      .filter(guid => resData[guid] !== null)
      .map(cfGuid => {
        // Return list of guid+error objects for those endpoints with errors
        const endpoints = resData[cfGuid];
        return endpoints.error ? {
          error: endpoints.error,
          guid: cfGuid
        } : null;
      })
      .filter(endpointErrors => !!endpointErrors);
  }

  getEntities(apiAction: IRequestAction, data): {
    entities: NormalizedResponse
    totalResults: number,
    totalPages: number,
  } {
    let totalResults = 0;
    let totalPages = 0;
    const allEntities = Object.keys(data)
      .filter(guid => data[guid] !== null)
      .map(cfGuid => {
        const cfData = data[cfGuid];
        switch (apiAction.entityLocation) {
          case RequestEntityLocation.ARRAY: // The response is an array which contains the entities
            const keys = Object.keys(cfData);
            totalResults = keys.length;
            totalPages = 1;
            return keys.map(key => {
              const guid = apiAction.guid + '-' + key;
              const result = this.completeResourceEntity(cfData[key], cfGuid, guid);
              result.entity.guid = guid;
              return result;
            });
          case RequestEntityLocation.OBJECT: // The response is the entity
            return this.completeResourceEntity(cfData, cfGuid, apiAction.guid);
          case RequestEntityLocation.RESOURCE: // The response is an object and the entities list is within a 'resource' param
          default:
            if (!cfData.resources) {
              // Treat the response as RequestEntityLocation.OBJECT
              return this.completeResourceEntity(cfData, cfGuid, apiAction.guid);
            }
            totalResults += cfData['total_results'];
            totalPages += cfData['total_pages'];
            if (!cfData.resources.length) {
              return null;
            }
            return cfData.resources.map(resource => {
              return this.completeResourceEntity(resource, cfGuid, resource.guid);
            });
        }
      });
    const flatEntities = [].concat(...allEntities).filter(e => !!e);
    return {
      entities: flatEntities.length ? normalize(flatEntities, apiAction.entity) : null,
      totalResults,
      totalPages
    };
  }

  mergeData(entity, metadata, cfGuid) {
    return { ...entity, ...metadata, cfGuid };
  }

  addBaseHeaders(endpoints: IRequestEntityTypeState<EndpointModel> | string, header: Headers): Headers {
    const endpointHeader = 'x-cap-cnsi-list';
    const headers = header || new Headers();
    if (typeof endpoints === 'string') {
      headers.set(endpointHeader, endpoints);
    } else {
      const registeredEndpointGuids = [];
      Object.keys(endpoints).forEach(endpointGuid => {
        const endpoint = endpoints[endpointGuid];
        if (endpoint.registered) {
          registeredEndpointGuids.push(endpoint.guid);
        }
      });
      headers.set(endpointHeader, registeredEndpointGuids);
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
    totalResults,
    totalPages
  } {
    if (resData) {
      const endpointsErrors = this.getErrors(resData);
      if (endpointsErrors.length) {
        // We should consider not completely failing the whole if some endpoints return.
        throw Observable.throw(`Error from endpoints: ${endpointsErrors.map(res => `${res.guid}: ${res.error}.`).join(', ')}`);
      }
    }
    let entities;
    let totalResults = 0;
    let totalPages = 0;

    if (resData) {
      const entityData = this.getEntities(apiAction, resData);
      entities = entityData.entities;
      totalResults = entityData.totalResults;
      totalPages = entityData.totalPages;
    }

    entities = entities || {
      entities: {},
      result: []
    };

    return {
      resData,
      entities,
      totalResults,
      totalPages
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

  private addRelationParams(options, action: any) {
    if (isEntityInlineParentAction(action)) {
      const relationInfo = listRelations(action as EntityInlineParentAction);
      options.params.set('inline-relations-depth', relationInfo.maxDepth > 2 ? 2 : relationInfo.maxDepth);
      options.params.set('include-relations', relationInfo.relations.join(','));
    }
  }
}


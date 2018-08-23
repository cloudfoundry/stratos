import { Injectable } from '@angular/core';
import { Headers, Http, Request, URLSearchParams } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { normalize, Schema } from 'normalizr';
import { forkJoin, Observable, of as observableOf } from 'rxjs';
import { catchError, map, mergeMap, withLatestFrom } from 'rxjs/operators';

import { LoggerService } from '../../core/logger.service';
import { SendEventAction } from '../actions/internal-events.actions';
import { endpointSchemaKey } from '../helpers/entity-factory';
import { listEntityRelations } from '../helpers/entity-relations';
import { EntityInlineParentAction, isEntityInlineParentAction } from '../helpers/entity-relations.types';
import { getRequestTypeFromMethod } from '../reducers/api-request-reducer/request-helpers';
import { qParamsToString } from '../reducers/pagination-reducer/pagination-reducer.helper';
import { resultPerPageParam, resultPerPageParamDefault } from '../reducers/pagination-reducer/pagination-reducer.types';
import { selectPaginationState } from '../selectors/pagination.selectors';
import { EndpointModel } from '../types/endpoint.types';
import { InternalEventSeverity } from '../types/internal-events.types';
import { PaginatedAction, PaginationEntityState, PaginationParam } from '../types/pagination.types';
import { APISuccessOrFailedAction, ICFAction, IRequestAction, RequestEntityLocation } from '../types/request.types';
import { environment } from './../../../environments/environment';
import { ApiActionTypes, ValidateEntitiesStart } from './../actions/request.actions';
import { AppState, IRequestEntityTypeState } from './../app-state';
import { APIResource, instanceOfAPIResource, NormalizedResponse } from './../types/api.types';
import { StartRequestAction, WrapperRequestActionFailed } from './../types/request.types';

const { proxyAPIVersion, cfAPIVersion } = environment;
const endpointHeader = 'x-cap-cnsi-list';

interface APIErrorCheck {
  error: boolean;
  errorCode: string;
  guid: string;
  url: string;
  errorResponse?: JetStreamCFErrorResponse;
}

interface JetStreamError {
  error: {
    status: string;
    statusCode: number;
  };
  errorResponse: JetStreamCFErrorResponse;
}

interface JetStreamCFErrorResponse {
  code: number;
  description: string;
  error_code: string;
}

@Injectable()
export class APIEffect {

  constructor(
    private logger: LoggerService,
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect() apiRequest$ = this.actions$.ofType<ICFAction | PaginatedAction>(ApiActionTypes.API_REQUEST_START).pipe(
    withLatestFrom(this.store),
    mergeMap(([action, state]) => {
      return this.doApiRequest(action, state);
    }), );

  private doApiRequest(action, state) {
    const actionClone = { ...action };
    const paramsObject = {};
    const apiAction = actionClone as ICFAction;
    const paginatedAction = actionClone as PaginatedAction;
    const options = { ...apiAction.options };
    const requestType = getRequestTypeFromMethod(apiAction);

    this.store.dispatch(new StartRequestAction(actionClone, requestType));
    this.store.dispatch(this.getActionFromString(apiAction.actions[0]));

    // Apply the params from the store
    if (paginatedAction.paginationKey) {
      options.params = new URLSearchParams();

      // Set initial params
      if (paginatedAction.initialParams) {
        this.setRequestParams(options.params, paginatedAction.initialParams);
      }

      // Set params from store
      const paginationState = selectPaginationState(apiAction.entityKey, paginatedAction.paginationKey)(state);
      const paginationParams = this.getPaginationParams(paginationState);
      paginatedAction.pageNumber = paginationState ? paginationState.currentPage : 1;
      this.setRequestParams(options.params, paginationParams);
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
        const { entities, totalResults, totalPages, errors = [] } = response;
        if (requestType === 'fetch' && (errors && errors.length > 0)) {
          this.handleApiEvents(errors);
        }

        let fakedAction, errorMessage;
        errors.forEach(error => {
          if (error.error) {
            // Dispatch a error action for the specific endpoint that's failed
            fakedAction = { ...actionClone, endpointGuid: error.guid };
            errorMessage = error.errorResponse ? error.errorResponse.description || error.errorCode : error.errorCode;
            this.store.dispatch(new APISuccessOrFailedAction(fakedAction.actions[2], fakedAction, errorMessage));
          }
        });

        // If this request only went out to a single endpoint ... and it failed... send the failed action now and avoid response validation.
        // This allows requests sent to multiple endpoints to proceed even if one of those endpoints failed.
        if (errors.length === 1 && errors[0].error) {
          this.store.dispatch(new WrapperRequestActionFailed(
            errorMessage,
            { ...actionClone, endpointGuid: errors[0].guid },
            requestType
          ));
          return [];
        }

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
      catchError(error => {
        const endpointString = options.headers.get(endpointHeader) || '';
        const endpoints: string[] = endpointString.split((','));
        endpoints.forEach(endpoint => this.store.dispatch(new SendEventAction(endpointSchemaKey, endpoint, {
          eventCode: error.status || '500',
          severity: InternalEventSeverity.ERROR,
          message: 'Jetstream API request error',
          metadata: {
            url: error.url || apiAction.options.url
          }
        })));
        return [
          new APISuccessOrFailedAction(actionClone.actions[2], actionClone, error.message),
          new WrapperRequestActionFailed(
            error.message,
            actionClone,
            requestType
          )
        ];
      }));
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
      const nestedResource = result.entity[resourceKey];
      if (instanceOfAPIResource(nestedResource)) {
        result.entity[resourceKey] = this.completeResourceEntity(nestedResource, cfGuid, nestedResource.metadata.guid);
      } else if (Array.isArray(nestedResource)) {
        result.entity[resourceKey] = nestedResource.map(nested => {
          return nested && typeof nested === 'object'
            ? this.completeResourceEntity(nested, cfGuid, nested.metadata ? nested.metadata.guid : guid + '-' + resourceKey)
            : nested;
        });
      }
    });

    return result;
  }

  checkForErrors(resData, action): APIErrorCheck[] {
    if (!resData) {
      if (action.endpointGuid) {
        return [{
          error: false,
          errorCode: '200',
          guid: action.endpointGuid,
          url: action.options.url,
          errorResponse: null
        }];
      }
      return null;
    }
    return Object.keys(resData)
      .map(cfGuid => {
        // Return list of guid+error objects for those endpoints with errors
        const endpoint = resData ? resData[cfGuid] as JetStreamError : null;
        const succeeded = !endpoint || !endpoint.error;
        const errorCode = endpoint && endpoint.error ? endpoint.error.statusCode.toString() : '500';
        let errorResponse = null;
        if (!succeeded) {
          errorResponse = endpoint && (!!endpoint.errorResponse && typeof endpoint.errorResponse !== 'string') ?
            endpoint.errorResponse : {} as JetStreamCFErrorResponse;
          // Use defaults if values are not provided
          errorResponse.code = errorResponse.code || 0;
          errorResponse.description = errorResponse.description || 'Unknown';
          errorResponse.error_code = errorResponse.error_code || '0';
        }
        return {
          error: !succeeded,
          errorCode: succeeded ? '200' : errorCode,
          guid: cfGuid,
          url: action.options.url,
          errorResponse: errorResponse,
        };
      });
  }

  handleApiEvents(errorChecks: APIErrorCheck[]) {
    errorChecks.forEach(check => {
      if (check.error) {
        this.store.dispatch(
          new SendEventAction(
            endpointSchemaKey,
            check.guid,
            {
              eventCode: check.errorCode,
              severity: InternalEventSeverity.ERROR,
              message: 'API request error',
              metadata: {
                url: check.url,
                errorResponse: check.errorResponse,
              }
            }
          ));
      }
    });
  }

  getEntities(apiAction: IRequestAction, data, errors: APIErrorCheck[]): {
    entities: NormalizedResponse
    totalResults: number,
    totalPages: number,
  } {
    let totalResults = 0;
    let totalPages = 0;
    const allEntities = Object.keys(data)
      .filter(guid => data[guid] !== null && !errors.findIndex(error => error.guid === guid))
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

    let entityArray;
    if (apiAction.entity['length'] > 0) {
      entityArray = apiAction.entity;
    } else {
      entityArray = new Array<Schema>();
      entityArray.push(apiAction.entity);
    }

    return {
      entities: flatEntities.length ? normalize(flatEntities, entityArray) : null,
      totalResults,
      totalPages
    };
  }

  mergeData(entity, metadata, cfGuid) {
    return { ...entity, ...metadata, cfGuid };
  }

  addBaseHeaders(endpoints: IRequestEntityTypeState<EndpointModel> | string, header: Headers): Headers {
    const headers = header || new Headers();
    if (typeof endpoints === 'string') {
      headers.set(endpointHeader, endpoints);
    } else {
      const registeredEndpointGuids = [];
      Object.keys(endpoints).forEach(endpointGuid => {
        const endpoint = endpoints[endpointGuid];
        if (endpoint.registered && endpoint.cnsi_type === 'cf') {
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
    return this.http.request(new Request(options)).pipe(map(response => {
      let resData;
      try {
        resData = response.json();
      } catch (e) {
        resData = null;
      }
      return resData;
    }));
  }

  private handleMultiEndpoints(resData, apiAction: IRequestAction): {
    resData,
    entities,
    totalResults,
    totalPages,
    errors: APIErrorCheck[]
  } {
    const errors = this.checkForErrors(resData, apiAction);
    let entities;
    let totalResults = 0;
    let totalPages = 0;

    if (resData) {
      const entityData = this.getEntities(apiAction, resData, errors);
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
      totalPages,
      errors
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
        requests.push(observableOf(firstResData)); // Already made the first request, don't repeat it
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
      const relationInfo = listEntityRelations(action as EntityInlineParentAction);
      options.params = options.params || new URLSearchParams();
      if (relationInfo.maxDepth > 0) {
        options.params.set('inline-relations-depth', relationInfo.maxDepth > 2 ? 2 : relationInfo.maxDepth);
      }
      if (relationInfo.relations.length) {
        options.params.set('include-relations', relationInfo.relations.join(','));
      }
    }
  }

  private setRequestParams(requestParams: URLSearchParams, params: { [key: string]: any }) {
    if (params.hasOwnProperty('q')) {
      // Convert q into a cf q string
      params.qString = qParamsToString(params.q);
      for (const q of params.qString) {
        requestParams.append('q', q);
      }
      delete params.qString;
      delete params.q;
    }
    // Assign other params
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        requestParams.set(key, params[key] as string);
      }
    }
  }
}


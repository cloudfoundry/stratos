import { Injectable } from '@angular/core';
import { Headers, Http, Request, RequestOptions, URLSearchParams } from '@angular/http';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { normalize, Schema } from 'normalizr';
import { Observable } from 'rxjs';
import { map, mergeMap, withLatestFrom } from 'rxjs/operators';
import { isEntityInlineParentAction } from '../../../cloud-foundry/src/entity-relations/entity-relation-tree.helpers';
import { listEntityRelations } from '../../../cloud-foundry/src/entity-relations/entity-relations';
import { EntityInlineParentAction } from '../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { endpointEntitySchema } from '../../../core/src/base-entity-schemas';
import { EntityCatalogueHelpers } from '../../../core/src/core/entity-catalogue/entity-catalogue.helper';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { EntityCatalogueEntityConfig } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { environment } from '../../../core/src/environments/environment.prod';
import { getJetStreamError } from '../../../core/src/jetstream.helpers';
import { SendEventAction } from '../actions/internal-events.actions';
import { PipelineHttpClient } from '../entity-request-pipeline/pipline-http-client.service';
import { endpointSchemaKey } from '../helpers/entity-factory';
import { CfAPIFlattener, flattenPagination } from '../helpers/paginated-request-helpers';
import { getRequestTypeFromMethod, } from '../reducers/api-request-reducer/request-helpers';
import { resultPerPageParam, resultPerPageParamDefault } from '../reducers/pagination-reducer/pagination-reducer.types';
import { selectPaginationState } from '../selectors/pagination.selectors';
import { EndpointModel } from '../types/endpoint.types';
import { InternalEventSeverity } from '../types/internal-events.types';
import { PaginatedAction, PaginationEntityState, PaginationParam } from '../types/pagination.types';
import { APISuccessOrFailedAction, EntityRequestAction, ICFAction, RequestEntityLocation } from '../types/request.types';
import { ApiActionTypes, ValidateEntitiesStart } from '../actions/request.actions';
import { IRequestEntityTypeState, InternalAppState } from '../app-state';
import { APIResource, instanceOfAPIResource, NormalizedResponse } from '../types/api.types';
import { WrapperRequestActionFailed } from '../types/request.types';
import { RecursiveDelete, RecursiveDeleteComplete, RecursiveDeleteFailed } from './recursive-entity-delete.effect';
import { baseRequestPipelineFactory } from '../entity-request-pipeline/base-single-entity-request.pipeline';
import { apiRequestPipelineFactory } from '../entity-request-pipeline/entity-request-pipeline';
import { basePaginatedRequestPipeline } from '../entity-request-pipeline/entity-pagination-request-pipeline';
import { CFAppState } from '../../../cloud-foundry/src/cf-app-state';


const { proxyAPIVersion, cfAPIVersion } = environment;
const endpointHeader = 'x-cap-cnsi-list';

interface APIErrorCheck {
  error: boolean;
  errorCode: string;
  guid: string;
  url: string;
  errorResponse?: JetStreamCFErrorResponse;
}

interface JetStreamCFErrorResponse {
  code: number;
  description: string;
  error_code: string;
}

@Injectable()
class APIEffect {
  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<InternalAppState>,
    private httpClient: PipelineHttpClient
  ) {

  }

  @Effect()
  apiRequest$ = this.actions$.pipe(
    ofType<ICFAction | PaginatedAction>(ApiActionTypes.API_REQUEST_START),
    withLatestFrom(this.store),
    mergeMap(([action, appState]) => {
      if (!(action as PaginatedAction).paginationKey) {
        return apiRequestPipelineFactory(baseRequestPipelineFactory, {
          store: this.store,
          httpClient: this.httpClient,
          action,
          appState
        });
      }
      return apiRequestPipelineFactory(basePaginatedRequestPipeline, {
        store: this.store,
        httpClient: this.httpClient,
        action,
        appState
      });
    }),
  );

  private doApiRequest(action: ICFAction | PaginatedAction, state: CFAppState) {
    const actionClone = { ...action };
    const apiAction = actionClone as ICFAction;
    const paginatedAction = actionClone as PaginatedAction;
    const options = { ...apiAction.options } as RequestOptions;
    const requestType = getRequestTypeFromMethod(apiAction);
    const catalogueEntity = entityCatalogue.getEntity(action.endpointType, action.entityType);
    if (this.shouldRecursivelyDelete(requestType, apiAction)) {
      this.store.dispatch(
        new RecursiveDelete(apiAction.guid, catalogueEntity.getSchema(action.schemaKey)),
      );
    }

    // startApiRequest(this.store, action, requestType);

    // Apply the params from the store
    if (paginatedAction.paginationKey) {
      options.params = new URLSearchParams();

      // Set initial params
      if (paginatedAction.initialParams) {
        // this.setRequestParams(options.params, paginatedAction.initialParams);
      }

      // Set params from store
      const paginationState = selectPaginationState(
        catalogueEntity.entityKey,
        paginatedAction.paginationKey,
      )(state);
      const paginationParams = this.getPaginationParams(paginationState);
      paginatedAction.pageNumber = paginationState
        ? paginationState.currentPage
        : 1;
      // this.setRequestParams(options.params, paginationParams);
      if (!options.params.has(resultPerPageParam)) {
        options.params.set(
          resultPerPageParam,
          resultPerPageParamDefault.toString(),
        );
      }
    }

    options.url = `/pp/${proxyAPIVersion}/proxy/${cfAPIVersion}/${options.url}`;
    const endpointEntityKey = EntityCatalogueHelpers.buildEntityKey(endpointEntitySchema.entityType, endpointEntitySchema.endpointType);
    const availableEndpoints =
      apiAction.endpointGuid || state.requestData[endpointEntityKey];
    if (typeof availableEndpoints !== 'string') {
      // Filter out endpoints that are currently being disconnected
      const disconnectedEndpoints = Object.keys(availableEndpoints).filter(
        endpointGuid => {
          const updating = state.request[endpointEntityKey][endpointGuid].updating;
          return !!updating.disconnecting && updating.disconnecting.busy;
        },
      );
      disconnectedEndpoints.forEach(guid => delete availableEndpoints[guid]);
    }

    options.headers = this.addBaseHeaders(availableEndpoints, options.headers);

    if (paginatedAction.flattenPagination) {
      options.params.set('page', '1');
    }

    this.addRelationParams(options, apiAction);

    let request = this.makeRequest(options);

    // Should we flatten all pages into the first, thus fetching all entities?
    if (paginatedAction.flattenPagination) {
      const forcedEntityKey = paginatedAction.__forcedPageEntityConfig__ ?
        entityCatalogue.getEntityKey(paginatedAction.__forcedPageEntityConfig__) :
        null;
      request = flattenPagination(
        pagAction => this.store.dispatch(pagAction),
        request,
        new CfAPIFlattener(this.http, options as RequestOptions),
        paginatedAction.flattenPaginationMax,
        catalogueEntity.entityKey,
        paginatedAction.paginationKey,
        forcedEntityKey
      );
    }

    return request.pipe(
      map(response => {
        return this.handleMultiEndpoints(response, actionClone as EntityRequestAction);
      }),
      mergeMap(response => {
        const {
          entities,
          totalResults,
          totalPages,
          errorsCheck = [],
        } = response;
        if (
          requestType === 'fetch' &&
          (errorsCheck && errorsCheck.length > 0)
        ) {
          this.handleApiEvents(errorsCheck);
        }

        let fakedAction;
        let errorMessage;
        errorsCheck.forEach(error => {
          if (error.error) {
            // Dispatch a error action for the specific endpoint that's failed
            fakedAction = { ...actionClone, endpointGuid: error.guid };
            errorMessage = error.errorResponse
              ? error.errorResponse.description || error.errorCode
              : error.errorCode;
            this.store.dispatch(
              new APISuccessOrFailedAction(
                fakedAction.actions[2],
                fakedAction,
                errorMessage,
              ),
            );
          }
        });

        // If this request only went out to a single endpoint ... and it failed... send the failed action now and avoid response validation.
        // This allows requests sent to multiple endpoints to proceed even if one of those endpoints failed.
        if (errorsCheck.length === 1 && errorsCheck[0].error) {
          if (this.shouldRecursivelyDelete(requestType, apiAction)) {
            this.store.dispatch(
              new RecursiveDeleteFailed(
                apiAction.guid,
                apiAction.endpointGuid,
                catalogueEntity.getSchema(apiAction.schemaKey)
              ),
            );
          }
          const { error, errorCode, guid, url, errorResponse } = errorsCheck[0];
          this.store.dispatch(
            new WrapperRequestActionFailed(
              errorMessage,
              { ...actionClone, endpointGuid: guid },
              requestType, {
                endpointIds: [guid],
                url,
                eventCode: errorCode ? errorCode + '' : '500',
                message: errorResponse ? errorResponse.description : 'Jetstream CF API request error',
                error
              }
            ),
          );
          return [];
        }

        if (this.shouldRecursivelyDelete(requestType, apiAction)) {
          this.store.dispatch(
            new RecursiveDeleteComplete(
              apiAction.guid,
              apiAction.endpointGuid,
              catalogueEntity.getSchema(apiAction.schemaKey),
            ),
          );
        }

        return [
          new ValidateEntitiesStart(actionClone, entities.result, true, {
            response: entities,
            totalResults,
            totalPages,
          }),
        ];
      })
    );
  }

  private completeResourceEntity(
    resource: APIResource | any,
    cfGuid: string,
    guid: string,
  ): APIResource {
    if (!resource) {
      return resource;
    }

    const result = resource.metadata
      ? {
        entity: { ...resource.entity, guid: resource.metadata.guid, cfGuid },
        metadata: resource.metadata,
      }
      : {
        entity: { ...resource, cfGuid },
        metadata: { guid },
      };

    // Inject `cfGuid` in nested entities
    Object.keys(result.entity).forEach(resourceKey => {
      const nestedResource = result.entity[resourceKey];
      if (instanceOfAPIResource(nestedResource)) {
        result.entity[resourceKey] = this.completeResourceEntity(
          nestedResource,
          cfGuid,
          nestedResource.metadata.guid,
        );
      } else if (Array.isArray(nestedResource)) {
        result.entity[resourceKey] = nestedResource.map(nested => {
          return nested && typeof nested === 'object'
            ? this.completeResourceEntity(
              nested,
              cfGuid,
              nested.metadata
                ? nested.metadata.guid
                : guid + '-' + resourceKey,
            )
            : nested;
        });
      }
    });

    return result;
  }

  checkForErrors(resData, action): APIErrorCheck[] {
    if (!resData) {
      if (action.endpointGuid) {
        return [
          {
            error: false,
            errorCode: '200',
            guid: action.endpointGuid,
            url: action.options.url,
            errorResponse: null,
          },
        ];
      }
      return null;
    }
    return Object.keys(resData).map(cfGuid => {
      // Return list of guid+error objects for those endpoints with errors
      const jetStreamError = getJetStreamError(resData ? resData[cfGuid] : null);
      const succeeded = !jetStreamError || !jetStreamError.error;
      const errorCode =
        jetStreamError && jetStreamError.error
          ? jetStreamError.error.statusCode.toString()
          : '500';
      let errorResponse = null;
      if (!succeeded) {
        errorResponse =
          jetStreamError &&
            (!!jetStreamError.errorResponse &&
              typeof jetStreamError.errorResponse !== 'string')
            ? jetStreamError.errorResponse
            : ({} as JetStreamCFErrorResponse);
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
        errorResponse,
      };
    });
  }

  handleApiEvents(errorChecks: APIErrorCheck[]) {
    errorChecks.forEach(check => {
      if (check.error) {
        this.store.dispatch(
          new SendEventAction(endpointSchemaKey, check.guid, {
            eventCode: check.errorCode,
            severity: InternalEventSeverity.ERROR,
            message: 'API request error',
            metadata: {
              url: check.url,
              errorResponse: check.errorResponse,
            },
          }),
        );
      }
    });
  }

  getEntities(
    apiAction: EntityRequestAction | PaginatedAction,
    data,
    errorCheck: APIErrorCheck[],
  ): {
    entities: NormalizedResponse;
    totalResults: number;
    totalPages: number;
  } {
    let totalResults = 0;
    let totalPages = 0;
    const allEntities = Object.keys(data)
      .filter(
        guid =>
          data[guid] !== null &&
          errorCheck.findIndex(error => error.guid === guid && !error.error) >=
          0,
      )
      .map(cfGuid => {
        const cfData = data[cfGuid];
        switch (apiAction.entityLocation) {
          case RequestEntityLocation.ARRAY: // The response is an array which contains the entities
            const keys = Object.keys(cfData);
            totalResults = keys.length;
            totalPages = 1;
            return keys.map(key => {
              const guid = apiAction.guid + '-' + key;
              const result = this.completeResourceEntity(
                cfData[key],
                cfGuid,
                guid,
              );
              result.entity.guid = guid;
              return result;
            });
          case RequestEntityLocation.OBJECT: // The response is the entity
            return this.completeResourceEntity(cfData, cfGuid, apiAction.guid);
          case RequestEntityLocation.RESOURCE: // The response is an object and the entities list is within a 'resource' param
          default:
            if (!cfData.resources) {
              // Treat the response as RequestEntityLocation.OBJECT
              return this.completeResourceEntity(
                cfData,
                cfGuid,
                apiAction.guid,
              );
            }
            totalResults += cfData.total_results;
            totalPages += cfData.total_pages;
            if (!cfData.resources.length) {
              return null;
            }
            return cfData.resources.map(resource => {
              return this.completeResourceEntity(
                resource,
                cfGuid,
                resource.guid,
              );
            });
        }
      });
    const flatEntities = [].concat(...allEntities).filter(e => !!e);

    // TODO NJ This need tidying up.
    let entityArray;
    const pagAction = apiAction as PaginatedAction;
    if (pagAction.__forcedPageEntityConfig__) {
      const entityConfig = pagAction.__forcedPageEntityConfig__;
      const schema = entityCatalogue.getEntity(entityConfig.endpointType, entityConfig.entityType).getSchema(entityConfig.schemaKey);
      entityArray = [schema];
    } else {
      // No need to do this, use Array.isArray - nj
      /* tslint:disable-next-line:no-string-literal  */
      if (apiAction.entity['length'] > 0) {
        entityArray = apiAction.entity;
      } else {
        entityArray = new Array<Schema>();
        entityArray.push(apiAction.entity);
      }
    }

    return {
      entities: flatEntities.length
        ? normalize(flatEntities, entityArray)
        : null,
      totalResults,
      totalPages,
    };
  }

  mergeData(entity, metadata, cfGuid) {
    return { ...entity, ...metadata, cfGuid };
  }

  addBaseHeaders(
    endpoints: IRequestEntityTypeState<EndpointModel> | string,
    header: Headers,
  ): Headers {
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


  getPaginationParams(paginationState: PaginationEntityState): PaginationParam {
    return paginationState
      ? {
        ...paginationState.params,
        q: [
          ...(paginationState.params.q as string[] || [])
        ],
        page: paginationState.currentPage.toString(),
      }
      : {};
  }

  private makeRequest(options): Observable<any> {
    return this.http.request(new Request(options)).pipe(
      map(response => {
        let resData;
        try {
          resData = response.json();
        } catch (e) {
          resData = null;
        }
        return resData;
      }),
    );
  }

  private handleMultiEndpoints(
    resData,
    apiAction: EntityRequestAction,
  ): {
    resData;
    entities;
    totalResults;
    totalPages;
    errorsCheck: APIErrorCheck[];
  } {
    const errorsCheck = this.checkForErrors(resData, apiAction);
    let entities;
    let totalResults = 0;
    let totalPages = 0;

    if (resData) {
      const entityData = this.getEntities(apiAction, resData, errorsCheck);
      entities = entityData.entities;
      totalResults = entityData.totalResults;
      totalPages = entityData.totalPages;
    }

    entities = entities || {
      entities: {},
      result: [],
    };

    return {
      resData,
      entities,
      totalResults,
      totalPages,
      errorsCheck,
    };
  }

  private addRelationParams(options, action: any) {
    if (isEntityInlineParentAction(action)) {
      const relationInfo = this.getEntityRelations(action);
      options.params = options.params || new URLSearchParams();
      if (relationInfo.maxDepth > 0) {
        options.params.set(
          'inline-relations-depth',
          relationInfo.maxDepth > 2 ? 2 : relationInfo.maxDepth,
        );
      }
      if (relationInfo.relations.length) {
        options.params.set(
          'include-relations',
          relationInfo.relations.join(','),
        );
      }
    }
  }
  // TODO NJ We need to be able to pass schema keys here
  private getEntityRelations(action: any) {
    if (action.__forcedPageEntityConfig__) {
      const entityConfig = action.__forcedPageEntityConfig__ as EntityCatalogueEntityConfig;
      const catalogueEntity = entityCatalogue.getEntity(entityConfig.endpointType, entityConfig.entityType);
      const forcedSchema = catalogueEntity.getSchema(entityConfig.schemaKey);
      return listEntityRelations(
        {
          ...action,
          entity: [forcedSchema],
          entityType: forcedSchema.entityType
        }
      );
    }
    return listEntityRelations(
      action as EntityInlineParentAction,
    );
  }

  private shouldRecursivelyDelete(requestType: string, apiAction: ICFAction) {
    return requestType === 'delete' && !apiAction.updatingKey;
  }

}

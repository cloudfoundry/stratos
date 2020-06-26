import { Action, Store } from '@ngrx/store';
import { denormalize } from 'normalizr';
import { Observable, of as observableOf } from 'rxjs';
import { filter, first, map, mergeMap, pairwise, skipWhile, switchMap, withLatestFrom } from 'rxjs/operators';

import { pathGet } from '../../../core/src/core/utils.service';
import { environment } from '../../../core/src/environments/environment';
import { SetInitialParams } from '../../../store/src/actions/pagination.actions';
import { APIResponse } from '../../../store/src/actions/request.actions';
import { GeneralEntityAppState } from '../../../store/src/app-state';
import { entityCatalog } from '../../../store/src/entity-catalog/entity-catalog';
import { isEntityBlocked } from '../../../store/src/entity-service';
import { EntitySchema } from '../../../store/src/helpers/entity-schema';
import { pick } from '../../../store/src/helpers/reducer.helper';
import { RequestInfoState } from '../../../store/src/reducers/api-request-reducer/types';
import { getAPIRequestDataState, selectEntity, selectRequestInfo } from '../../../store/src/selectors/api.selectors';
import { selectPaginationState } from '../../../store/src/selectors/pagination.selectors';
import { APIResource, NormalizedResponse } from '../../../store/src/types/api.types';
import { isPaginatedAction, PaginatedAction, PaginationEntityState } from '../../../store/src/types/pagination.types';
import { EntityRequestAction, WrapperRequestActionSuccess } from '../../../store/src/types/request.types';
import { FetchRelationAction, FetchRelationPaginatedAction, FetchRelationSingleAction } from '../actions/relation.actions';
import { EntityTreeRelation } from './entity-relation-tree';
import { validationPostProcessor } from './entity-relations-post-processor';
import { fetchEntityTree } from './entity-relations.tree';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
  EntityInlineChildAction,
  EntityInlineParentAction,
  isEntityInlineChildAction,
  ValidateEntityRelationsConfig,
  ValidationResult,
} from './entity-relations.types';

interface ValidateResultFetchingState {
  fetching: boolean;
}

/**
 * An object to represent the action and status of a missing inline depth/entity relation.
 * @export
 */
interface ValidateEntityResult {
  action: FetchRelationAction;
  fetchingState$?: Observable<ValidateResultFetchingState>;
  abortDispatch?: boolean;
}

class ValidateLoopConfig extends ValidateEntityRelationsConfig {
  /**
   * List of `{parent entity key} - {child entity key}` strings which should exist in entities structure
   */
  includeRelations: string[];
  /**
   * List of entities to validate
   */
  entities: APIResource[];
  /**
   * Parent entity relation of children in the entities param
   */
  parentRelation: EntityTreeRelation;
}

class HandleRelationsConfig extends ValidateLoopConfig {
  parentEntity: APIResource;
  childRelation: EntityTreeRelation;
  childEntities: object | any[];
  childEntitiesUrl: string;
}

function createAction(config: HandleRelationsConfig) {
  return config.childRelation.isArray ? createPaginationAction(config) : createSingleAction(config);
}

function createSingleAction(config: HandleRelationsConfig) {
  const { cfGuid, parentRelation, parentEntity, childRelation, childEntitiesUrl, includeRelations, populateMissing } = config;
  return new FetchRelationSingleAction(
    cfGuid,
    parentEntity.metadata.guid,
    parentRelation,
    childEntitiesUrl.substring(childEntitiesUrl.lastIndexOf('/') + 1),
    childRelation,
    includeRelations,
    populateMissing,
    childEntitiesUrl
  );
}

function createPaginationAction(config: HandleRelationsConfig) {
  const { cfGuid, parentRelation, parentEntity, childRelation, childEntitiesUrl, includeRelations, populateMissing } = config;
  const parentGuid = parentEntity.metadata ? parentEntity.metadata.guid : parentEntity.entity.guid;
  return new FetchRelationPaginatedAction(
    cfGuid,
    parentGuid,
    parentRelation,
    childRelation,
    includeRelations,
    createEntityRelationPaginationKey(parentRelation.entityType, parentGuid, childRelation.entity.relationKey),
    populateMissing,
    childEntitiesUrl
  );
}

function createEntityWatcher(store, paramAction, guid: string): Observable<ValidateResultFetchingState> {
  return store.select(selectRequestInfo(entityCatalog.getEntityKey(paramAction), guid)).pipe(
    map((requestInfo: RequestInfoState) => {
      return { fetching: requestInfo ? requestInfo.fetching : true };
    })
  );
}

/**
 * Create actions required to populate parent entities with exist children
 */
function createActionsForExistingEntities(config: HandleRelationsConfig): Action {
  const { allEntities, newEntities, childEntities, childRelation, action } = config;
  const childEntitiesAsArray = childEntities as Array<any>;

  const paramAction = action || createAction(config);
  // We've got the value already, ensure we create a pagination section for them
  let response: NormalizedResponse;
  const guids = childEntitiesAsGuids(childEntitiesAsArray);
  const safeEntities = newEntities || {};
  const entities = pick(safeEntities[childRelation.entityKey], guids as [string]) ||
    pick(allEntities[childRelation.entityKey], guids as [string]);
  response = {
    entities: {
      [childRelation.entityKey]: entities
    },
    result: guids
  };

  return new WrapperRequestActionSuccess(
    response,
    paramAction,
    'fetch',
    childEntitiesAsArray.length,
    1
  );
}

function createValidationPaginationWatcher(store, paramPaginationAction: PaginatedAction):
  Observable<ValidateResultFetchingState> {
  return store.select(selectPaginationState(entityCatalog.getEntityKey(paramPaginationAction), paramPaginationAction.paginationKey)).pipe(
    map((paginationState: PaginationEntityState) => {
      const pageRequest = paginationState && paginationState.pageRequests && paginationState.pageRequests[paginationState.currentPage];
      return { fetching: pageRequest ? pageRequest.busy : true };
    })
  );
}

/**
 * Create actions required to fetch missing relations
 */
function createActionsForMissingEntities(config: HandleRelationsConfig): ValidateEntityResult[] {
  const { store, childRelation, childEntitiesUrl } = config;

  if (!childEntitiesUrl) {
    // There might genuinely be no entity. In those cases the url will be blank
    return [];
  }

  const paramAction = createAction(config);
  let results: ValidateEntityResult[] = [];

  if (childRelation.isArray) {
    const paramPaginationAction = paramAction as FetchRelationPaginatedAction;
    // Why do we add this? Strictly speaking we don't want to retain or care about the pagination section AFTER the validation process is
    // finished (we want to track the result and handle the flatten whilst making the api/validation request). The only list we now care
    // about will be in the parent entity.
    paramPaginationAction.paginationKey += '-relation';
    results = [].concat(results, [{
      action: new SetInitialParams(paramAction, paramPaginationAction.paginationKey, paramPaginationAction.initialParams, true)
    },
    {
      action: paramAction,
      fetchingState$: createValidationPaginationWatcher(store, paramPaginationAction)
    }
    ]);
  } else {
    const guid = childEntitiesUrl.substring(childEntitiesUrl.lastIndexOf('/') + 1);
    results.push({
      action: paramAction,
      fetchingState$: createEntityWatcher(store, paramAction, guid)
    });
  }
  return results;
}

/**
 * For a specific relationship check it exists (and if we need to populate other parts of entity store with it) or it does not (and we
 * need to fetch it)
 */
function handleRelation(config: HandleRelationsConfig): ValidateEntityResult[] {
  const { cfGuid, childEntities, parentEntity, parentRelation, childRelation, populateMissing } = config;

  if (!cfGuid) {
    throw Error(`No CF Guid provided when validating
     ${parentRelation.entityType} ${parentEntity.metadata.guid}'s ${childRelation.entityType}`);
  }

  // Have we failed to find some required missing entities?
  let results = [];
  if (childEntities) {
    if (!childRelation.isArray) {
      // We've already got the missing entity in the store or current response, we just need to associate it with it's parent
      const connectEntityWithParent: ValidateEntityResult = {
        action: createSingleAction(config),
        abortDispatch: true // Don't need to make the request.. it's either in the store or in the apiResource
      };
      results = [].concat(results, connectEntityWithParent);
    }
  } else {
    if (populateMissing) {
      // The values are missing and we want them, go fetch
      results = [].concat(results, createActionsForMissingEntities(config));
    }
  }

  return results;
}

/**
 * Iterate through required parent-child relationships and check if they exist
 */
function validationLoop(config: ValidateLoopConfig): ValidateEntityResult[] {
  const { cfGuid, entities, parentRelation, allEntities, allPagination, newEntities, action } = config;

  if (!entities) {
    return [];
  }
  let results: ValidateEntityResult[] = [];
  parentRelation.childRelations.forEach(childRelation => {
    entities.forEach(entity => {
      let childEntities = pathGet(childRelation.path, entity);
      if (childEntities) {
        childEntities = childRelation.isArray ? childEntities : [childEntities];
      } else {
        let childEntitiesAsArray;

        if (childRelation.isArray) {
          const paginationState: PaginationEntityState = pathGet(
            `${childRelation.entityKey}.${createEntityRelationPaginationKey(parentRelation.entityType, entity.metadata.guid)}`,
            allPagination);
          childEntitiesAsArray = paginationState ? paginationState.ids[paginationState.currentPage] : null;
        } else {
          const guid = pathGet(childRelation.path + '_guid', entity);
          childEntitiesAsArray = [guid];
        }

        if (childEntitiesAsArray) {
          const guids = childEntitiesAsGuids(childEntitiesAsArray);

          childEntities = [];
          const allEntitiesOfType = allEntities ? allEntities[childRelation.entityKey] || {} : {};
          const newEntitiesOfType = newEntities ? newEntities[childRelation.entityKey] || {} : {};

          for (const guid of guids) {
            const foundEntity = newEntitiesOfType[guid] || allEntitiesOfType[guid];
            if (foundEntity) {
              childEntities.push(foundEntity);
            } else {
              childEntities = null;
              break;
            }
          }
        }
        results = [].concat(results, handleRelation({
          ...config,
          cfGuid: cfGuid || entity.entity.cfGuid,
          parentEntity: entity,
          childRelation,
          childEntities,
          childEntitiesUrl: pathGet(childRelation.path + '_url', entity),
        }));
      }

      if (childEntities && childRelation.childRelations.length) {
        results = [].concat(results, validationLoop({
          ...config,
          cfGuid: cfGuid || entity.entity.cfGuid,
          entities: childEntities,
          parentRelation: childRelation
        }));
      }
    });
  });


  return results;
}

function associateChildWithParent(
  store: Store<GeneralEntityAppState>,
  action: EntityInlineChildAction,
  apiResponse: APIResponse): Observable<boolean> {
  let childValue;
  // Fetch the child value to associate with parent. Will either be a guid or a list of guids
  if (action.child.isArray) {
    const { paginationKey } = action as FetchRelationPaginatedAction;
    childValue = store.select(selectPaginationState(entityCatalog.getEntityKey(action), paginationKey)).pipe(
      first(),
      map((paginationSate: PaginationEntityState) => paginationSate.ids[1] || [])
    );
  } else {
    const { guid } = action as FetchRelationSingleAction;
    childValue = observableOf(guid);
  }

  return childValue.pipe(
    map(value => {
      if (!value) {
        return true;
      }
      const catalogEntity = entityCatalog.getEntity(
        action.parentEntityConfig.endpointType,
        action.parentEntityConfig.entityType,
        action.parentEntityConfig.subType
      );
      if (apiResponse) {
        // Part of an api call. Assign to apiResponse which is added to store later
        apiResponse.response.entities[catalogEntity.entityKey][action.parentGuid].entity[action.child.paramName] = value;
      } else {
        // Not part of an api call. We already have the entity in the store, so fire off event to link child with parent
        const response = {
          entities: {
            [catalogEntity.entityKey]: {
              [action.parentGuid]: {
                entity: {
                  [action.child.paramName]: value
                }
              }
            }
          },
          result: [action.parentGuid]
        };
        const parentAction: EntityRequestAction = {
          endpointGuid: action.endpointGuid,
          entity: catalogEntity.getSchema(action.parentEntityConfig.schemaKey),
          guid: action.parentGuid,
          entityType: action.parentEntityConfig.entityType,
          endpointType: action.parentEntityConfig.endpointType,
          type: '[Entity] Associate with parent',
        };
        if (!environment.production) {
          // Add for easier debugging
          /* tslint:disable-next-line:no-string-literal  */
          parentAction['childEntityKey'] = action.child.entityKey;
        }


        const successAction = new WrapperRequestActionSuccess(response, parentAction, 'fetch', 1, 1);
        store.dispatch(successAction);
      }
      return true;
    })
  );
}

function handleValidationLoopResults(
  store: Store<GeneralEntityAppState>,
  results: ValidateEntityResult[],
  apiResponse: APIResponse,
  action: EntityRequestAction
): ValidationResult {
  const paginationFinished = new Array<Promise<boolean>>();
  results.forEach(request => {
    // Fetch any missing data
    if (!request.abortDispatch) {
      store.dispatch(request.action);
    }
    // Wait for the action to be completed
    const obs = request.fetchingState$ ? request.fetchingState$.pipe(
      pairwise(),
      map(([oldFetching, newFetching]) => {
        return oldFetching.fetching === true && newFetching.fetching === false;
      }),
      skipWhile(completed => !completed),
      first()) : observableOf(true);
    // Associate the missing parameter with it's parent
    const associatedObs = obs.pipe(
      switchMap(() => {
        const inlineChildAction: EntityInlineChildAction = isEntityInlineChildAction(request.action);
        return inlineChildAction ? associateChildWithParent(store, inlineChildAction, apiResponse) : observableOf(true);
      }),
    ).toPromise();
    paginationFinished.push(associatedObs);
  });

  return {
    started: !!(paginationFinished.length),
    completed: Promise.all(paginationFinished)
      .then(() => store.select(getAPIRequestDataState).pipe(first()).toPromise())
      .then(entities => {
        // Post processor needs to run once all 'results[x].fetchingState$' have finished. This will mean we've fetched any missing params
        // (fetch org and it's managers, more then 50 managers so we independently fetch list, need to ensure that the
        // apiResponse/allEntities here contains the list that's been fetched)
        const request = validationPostProcessor(store, action, apiResponse, entities);
        if (request && !request.abortDispatch && request.action) {
          store.dispatch(request.action);
        }
        return apiResponse;
      }),
  };
}

/**
 * Ensure all required inline parameters specified by the entity associated with the request exist.
 * If the inline parameter/s are..
 * - missing - (optionally) return an action that will fetch them and ultimately store in a pagination. This will also populate the parent
 * entities inline parameter (see the generic request data reducer).
 * - exist - (optionally) return an action that will store them in pagination.
 *
 * @export
 */
export function validateEntityRelations(config: ValidateEntityRelationsConfig): ValidationResult {
  const pAction = isPaginatedAction(config.action);

  if (!!pAction && pAction.__forcedPageEntityConfig__) {
    const entityConfig = pAction.__forcedPageEntityConfig__;
    const catalogEntity = entityCatalog.getEntity(entityConfig.endpointType, entityConfig.entityType);
    const forcedSchema = catalogEntity.getSchema(entityConfig.schemaKey);
    config.action = {
      ...config.action,
      entity: [forcedSchema],
      entityType: entityConfig.entityType
    };
  }
  config.newEntities = config.apiResponse ? config.apiResponse.response.entities : null;
  const { action, populateMissing, newEntities, allEntities, store, parentEntities } = config;
  if (!action.entity || !parentEntities || parentEntities.length === 0) {
    return {
      started: false,
      completed: Promise.resolve(config.apiResponse)
    };
  }
  const relationAction = getRelationAction(action);
  const entityTree = fetchEntityTree(relationAction);

  const results = validationLoop({
    ...config,
    includeRelations: relationAction.includeRelations,
    populateMissing: populateMissing || relationAction.populateMissing,
    entities: denormalize(parentEntities, [entityTree.rootRelation.entity], newEntities || allEntities),
    parentRelation: entityTree.rootRelation,
  });

  return handleValidationLoopResults(store, results, config.apiResponse, action);
}

function getRelationAction(action: EntityRequestAction): EntityInlineParentAction {
  const pagAction = action as PaginatedAction;
  if (pagAction.__forcedPageEntityConfig__) {
    const entityConfig = pagAction.__forcedPageEntityConfig__;
    const entity = entityCatalog.getEntity(entityConfig.endpointType, entityConfig.entityType).getSchema(entityConfig.schemaKey);
    return {
      ...action,
      entity
    } as EntityInlineParentAction;
  }
  return {
    ...action
  } as EntityInlineParentAction;
}

export function listEntityRelations(action: EntityInlineParentAction, fromCache = true) {
  const tree = fetchEntityTree(action, fromCache);
  return {
    maxDepth: tree.maxDepth,
    relations: tree.requiredParamNames
  };
}

function childEntitiesAsGuids(childEntitiesAsArray: any[]): string[] {
  return childEntitiesAsArray ? childEntitiesAsArray.map(entity => pathGet('metadata.guid', entity) || entity) : null;
}

/**
 * Check to see if we already have the result of the pagination action in a parent entity (we've previously fetched it inline). If so
 * create an action that can be used to populate the pagination section with the list from the parent
 * @export
 */
export function populatePaginationFromParent(store: Store<GeneralEntityAppState>, action: PaginatedAction): Observable<Action> {
  const eicAction = isEntityInlineChildAction(action);
  if (!eicAction || !action.flattenPagination) {
    return observableOf(action);
  }
  const parentEntitySchema = entityCatalog.getEntity(eicAction.parentEntityConfig).getSchema(eicAction.parentEntityConfig.schemaKey);
  const parentGuid = eicAction.parentGuid;

  // What the hell is going on here hey? Well I'll tell you...
  // Ensure that the parent is not blocked (fetching, updating, etc) before we check if it has the child param that we need
  const parentEntityKey = entityCatalog.getEntityKey(eicAction.parentEntityConfig);
  return store.select(selectEntity(parentEntityKey, parentGuid)).pipe(
    first(),
    mergeMap(entity => {
      if (!entity) {
        return observableOf(null);
      }
      return store.select(selectRequestInfo(parentEntityKey, parentGuid));
    }),
    filter((entityInfo: RequestInfoState) => {
      return !isEntityBlocked(entityInfo);
    }),
    first(),
    // At this point we should know that the parent entity is ready to be checked
    withLatestFrom(
      store.select(selectEntity<any>(parentEntityKey, parentGuid)),
      store.select(getAPIRequestDataState),
    ),
    map(([entityInfo, entity, allEntities]: [RequestInfoState, any, GeneralEntityAppState]) => {
      if (!entity) {
        return;
      }
      // Find the property name (for instance a list of routes in a parent space would have param name `routes`)
      /* tslint:disable-next-line:no-string-literal  */
      const entities = parentEntitySchema.schema['entity'] || {};
      const params = Object.keys(entities);
      for (const paramName of params) {
        const entitySchema: EntitySchema | [EntitySchema] = entities[paramName];
        /* tslint:disable-next-line:no-string-literal  */
        const arraySafeEntitySchema: EntitySchema = entitySchema['length'] >= 0 ? entitySchema[0] : entitySchema;
        if (arraySafeEntitySchema.entityType === action.entityType) {
          // Found it! Does the entity contain a value for the property name?
          if (!entity.entity[paramName]) {
            return;
          }

          const catalogEntity = entityCatalog.getEntity(eicAction);
          const entityKey = catalogEntity.entityKey;
          const normedEntities = entity.entity[paramName].reduce((newNormedEntities, guidOrEntity) => {
            const guid = typeof (guidOrEntity) === 'string' ? guidOrEntity : catalogEntity.getGuidFromEntity(guidOrEntity);
            newNormedEntities[entityKey][guid] = guidOrEntity;
            return newNormedEntities;
          }, { [entityKey]: {} });
          // Yes? Let's create the action that will populate the pagination section with the value
          const config: HandleRelationsConfig = {
            store,
            action,
            allEntities,
            allPagination: {},
            newEntities: normedEntities,
            apiResponse: null,
            parentEntities: null,
            entities: entity.entity[paramName],
            childEntities: entity.entity[paramName],
            cfGuid: action.endpointGuid,
            parentRelation: new EntityTreeRelation(parentEntitySchema, false, null, null, []),
            includeRelations: [createEntityRelationKey(parentEntitySchema.entityType, action.entityType)],
            parentEntity: entity,
            childRelation: new EntityTreeRelation(arraySafeEntitySchema, true, paramName, '', []),
            childEntitiesUrl: '',
            populateMissing: true
          };
          return createActionsForExistingEntities(config);
        }
      }
      return;
    })
  );
}

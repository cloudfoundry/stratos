import type { Store } from '@ngrx/store';
import type { Action } from '@ngrx/store';
import { denormalize } from 'normalizr';
import { type Observable, of as observableOf } from 'rxjs';
import { filter, first, map, mergeMap, pairwise, skipWhile, switchMap, withLatestFrom } from 'rxjs/operators';

import { pathGet } from '@stratosui/core';
import { environment } from '@stratosui/core';
import {
  SetInitialParams,
  type APIResponse,
  type GeneralEntityAppState,
  entityCatalog,
  isEntityBlocked,
  type EntitySchema,
  pick,
  type RequestInfoState,
  getAPIRequestDataState,
  selectEntity,
  selectRequestInfo,
  selectPaginationState,
  type APIResource,
  type NormalizedResponse,
  isPaginatedAction,
  type PaginatedAction,
  type PaginationEntityState,
  type EntityRequestAction,
  WrapperRequestActionSuccess,
} from '@stratosui/store';
import { type FetchRelationAction, FetchRelationPaginatedAction, FetchRelationSingleAction } from '../actions/relation.actions';
import { EntityTreeRelation } from './entity-relation-tree';
import { validationPostProcessor } from './entity-relations-post-processor';
import { fetchEntityTree } from './entity-relations.tree';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
  type EntityInlineChildAction,
  type EntityInlineParentAction,
  isEntityInlineChildAction,
  ValidateEntityRelationsConfig,
  type ValidationResult,
} from './entity-relations.types';

interface ValidateResultFetchingState {
  fetching: boolean;
}

/**
 * Type guard to check if a value is an array
 */
function isEntityArray(val: unknown): val is unknown[] {
  return Array.isArray(val);
}

/**
 * Type guard to check if an object has metadata with guid
 */
function hasMetadata(obj: unknown): obj is { metadata: { guid: string } } {
  return obj !== null && typeof obj === 'object' && 'metadata' in obj &&
    typeof (obj as { metadata: unknown }).metadata === 'object' &&
    (obj as { metadata: unknown }).metadata !== null &&
    'guid' in (obj as { metadata: { guid: unknown } }).metadata;
}

/**
 * Type guard to check if an object has cfGuid property
 */
function hasCfGuid(obj: unknown): obj is { cfGuid: string } {
  return obj !== null && typeof obj === 'object' && 'cfGuid' in obj;
}

/**
 * Type guard to check if an object has entity property
 */
function hasEntity(obj: unknown): obj is { entity: unknown } {
  return obj !== null && typeof obj === 'object' && 'entity' in obj;
}

/**
 * Type guard to check if a value is an APIResource
 */
function isAPIResource<T = unknown>(entity: unknown): entity is APIResource<T> {
  return entity !== null &&
         typeof entity === 'object' &&
         'entity' in entity &&
         'metadata' in entity;
}

/**
 * Safely retrieve an entity from the entities dictionary
 */
function getEntityOfType<T = unknown>(
  entities: unknown,
  entityKey: string,
  guid: string
): T | null {
  if (!entities || typeof entities !== 'object') {
    return null;
  }
  const entitiesRecord = entities as Record<string, unknown>;
  const entitiesOfType = entitiesRecord[entityKey];
  if (!entitiesOfType || typeof entitiesOfType !== 'object') {
    return null;
  }
  const entitiesOfTypeRecord = entitiesOfType as Record<string, unknown>;
  return (entitiesOfTypeRecord[guid] as T) ?? null;
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
  includeRelations!: string[];
  /**
   * List of entities to validate
   */
  entities!: APIResource[];
  /**
   * Parent entity relation of children in the entities param
   */
  parentRelation!: EntityTreeRelation;
}

class HandleRelationsConfig extends ValidateLoopConfig {
  parentEntity!: APIResource;
  childRelation!: EntityTreeRelation;
  childEntities!: object | unknown[];
  childEntitiesUrl!: string;
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
  let parentGuid: string;
  if (isAPIResource(parentEntity)) {
    parentGuid = parentEntity.metadata ? parentEntity.metadata.guid : (hasEntity(parentEntity) && hasMetadata(parentEntity.entity) ? parentEntity.entity.metadata.guid : '');
  } else {
    throw new Error('Invalid parent entity: not an APIResource');
  }
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

function createEntityWatcher(store: Store, paramAction: EntityRequestAction, guid: string): Observable<ValidateResultFetchingState> {
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
  const childEntitiesAsArray = childEntities as Array<unknown>;

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

function createValidationPaginationWatcher(store: Store, paramPaginationAction: PaginatedAction):
  Observable<ValidateResultFetchingState> {
  return store.select(selectPaginationState(entityCatalog.getEntityKey(paramPaginationAction), paramPaginationAction.paginationKey)).pipe(
    map((paginationState: PaginationEntityState) => {
      const pageRequest = paginationState?.pageRequests?.[paginationState.currentPage];
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
  let results: ValidateEntityResult[] = [];
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
        let childEntitiesAsArray: string[] | null;

        if (childRelation.isArray) {
          const paginationState: PaginationEntityState = pathGet(
            `${childRelation.entityKey}.${createEntityRelationPaginationKey(parentRelation.entityType, entity.metadata.guid)}`,
            allPagination) as PaginationEntityState;
          childEntitiesAsArray = paginationState ? (paginationState.ids as Record<number, string[]>)[paginationState.currentPage] : null;
        } else {
          const guid = pathGet(`${childRelation.path}_guid`, entity);
          childEntitiesAsArray = guid ? [guid as string] : null;
        }

        if (childEntitiesAsArray) {
          const guids = childEntitiesAsGuids(childEntitiesAsArray);

          let tempChildEntities: unknown[] = [];
          const allEntitiesOfType = allEntities ? (allEntities as Record<string, Record<string, unknown>>)[childRelation.entityKey] || {} : {};
          const newEntitiesOfType = newEntities ? (newEntities as Record<string, Record<string, unknown>>)[childRelation.entityKey] || {} : {};

          for (const guid of guids) {
            const foundEntity = getEntityOfType(newEntities, childRelation.entityKey, guid) ||
                               getEntityOfType(allEntities, childRelation.entityKey, guid);
            if (foundEntity) {
              tempChildEntities.push(foundEntity);
            } else {
              tempChildEntities = null;
              break;
            }
          }
          childEntities = tempChildEntities;
        }

        // Safely get cfGuid from entity
        const entityCfGuid = isAPIResource(entity) && hasEntity(entity) && hasCfGuid(entity.entity) ? entity.entity.cfGuid : undefined;
        const childEntitiesUrlValue = pathGet(`${childRelation.path}_url`, entity);

        results = [].concat(results, handleRelation({
          ...config,
          cfGuid: cfGuid || entityCfGuid,
          parentEntity: entity,
          childRelation,
          childEntities: childEntities as (object | unknown[]),
          childEntitiesUrl: (childEntitiesUrlValue as string) || '',
        }));
      }

      if (childEntities && childRelation.childRelations.length) {
        // Safely get cfGuid from entity
        const entityCfGuid = isAPIResource(entity) && hasEntity(entity) && hasCfGuid(entity.entity) ? entity.entity.cfGuid : undefined;

        results = [].concat(results, validationLoop({
          ...config,
          cfGuid: cfGuid || entityCfGuid,
          entities: (Array.isArray(childEntities) ? childEntities : []) as APIResource[],
          parentRelation: childRelation
        }));
      }
    });
  });


  return results;
}

function associateChildWithParent(
  store: Store,
  action: EntityInlineChildAction,
  apiResponse: APIResponse): Observable<boolean> {
  let childValue: Observable<string | string[]>;
  // Fetch the child value to associate with parent. Will either be a guid or a list of guids
  if (action.child.isArray) {
    const { paginationKey } = action as FetchRelationPaginatedAction;
    childValue = store.select(selectPaginationState(entityCatalog.getEntityKey(action), paginationKey)).pipe(
      first(undefined, null),
      map((paginationSate: PaginationEntityState) => {
        if (!paginationSate || !paginationSate.ids) {
          return [];
        }
        return (paginationSate.ids as Record<number, string[]>)[1] || [];
      })
    );
  } else {
    const { guid } = action as FetchRelationSingleAction;
    childValue = observableOf(guid);
  }

  return childValue.pipe(
    map((value: string | string[]) => {
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
        const parentEntityInResponse = apiResponse.response.entities[catalogEntity.entityKey][action.parentGuid];
        if (hasEntity(parentEntityInResponse) && typeof parentEntityInResponse.entity === 'object' && parentEntityInResponse.entity !== null) {
          (parentEntityInResponse.entity as Record<string, unknown>)[action.child.paramName] = value;
        }
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
          (parentAction as unknown as Record<string, unknown>).childEntityKey = action.child.entityKey;
        }


        const successAction = new WrapperRequestActionSuccess(response, parentAction, 'fetch', 1, 1);
        store.dispatch(successAction);
      }
      return true;
    })
  );
}

function handleValidationLoopResults(
  store: Store,
  results: ValidateEntityResult[],
  apiResponse: APIResponse,
  action: EntityRequestAction
): ValidationResult {
  const paginationFinished: Promise<boolean>[] = [];
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
      first(undefined, true)) : observableOf(true);
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
      .then(() => store.select(getAPIRequestDataState).pipe(first(undefined, null)).toPromise())
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

function childEntitiesAsGuids(childEntitiesAsArray: unknown[]): string[] {
  return childEntitiesAsArray ? childEntitiesAsArray.map(entity => {
    const guid = pathGet('metadata.guid', entity);
    return (guid || entity) as string;
  }) : [];
}

/**
 * Check to see if we already have the result of the pagination action in a parent entity (we've previously fetched it inline). If so
 * create an action that can be used to populate the pagination section with the list from the parent
 * @export
 */
export function populatePaginationFromParent(store: Store, action: PaginatedAction): Observable<Action> {
  const eicAction = isEntityInlineChildAction(action);
  if (!eicAction || !action.flattenPagination) {
    return observableOf(action);
  }

  // Defensive null checks for Angular 20 DI compatibility
  if (!store) {
    console.warn('populatePaginationFromParent: Store is null or undefined, returning action');
    return observableOf(action);
  }

  const parentEntitySchema = entityCatalog.getEntity(eicAction.parentEntityConfig).getSchema(eicAction.parentEntityConfig.schemaKey);
  const parentGuid = eicAction.parentGuid;

  // What the hell is going on here hey? Well I'll tell you...
  // Ensure that the parent is not blocked (fetching, updating, etc) before we check if it has the child param that we need
  const parentEntityKey = entityCatalog.getEntityKey(eicAction.parentEntityConfig);
  const selectEntity$ = store.select(selectEntity(parentEntityKey, parentGuid));

  // Guard against null/undefined Observable
  if (!selectEntity$) {
    console.warn('populatePaginationFromParent: selectEntity returned null/undefined, returning action');
    return observableOf(action);
  }

  return selectEntity$.pipe(
    first(undefined, null),
    mergeMap(entity => {
      if (!entity) {
        return observableOf(null);
      }
      const selectRequestInfo$ = store.select(selectRequestInfo(parentEntityKey, parentGuid));
      // Guard against null/undefined Observable
      if (!selectRequestInfo$) {
        return observableOf(null);
      }
      return selectRequestInfo$;
    }),
    filter((entityInfo: RequestInfoState) => {
      return !isEntityBlocked(entityInfo);
    }),
    first(undefined, null),
    // At this point we should know that the parent entity is ready to be checked
    withLatestFrom(
      store.select(selectEntity<unknown>(parentEntityKey, parentGuid)),
      store.select(getAPIRequestDataState) as Observable<unknown>,
    ),
    map(([_entityInfo, entity, allEntitiesState]: [RequestInfoState, unknown, unknown]) => {
      if (!entity || !isAPIResource(entity)) {
        return action; // Return action instead of undefined
      }
      // Convert GeneralEntityAppState to the format expected by the config
      const allEntities = allEntitiesState as unknown as Record<string, Record<string, unknown>>;

      // Find the property name (for instance a list of routes in a parent space would have param name `routes`)
      /* tslint:disable-next-line:no-string-literal  */
      const entities = (parentEntitySchema.schema as Record<string, unknown>).entity || {};
      const params = Object.keys(entities);
      for (const paramName of params) {
        const entitySchema: EntitySchema | [EntitySchema] = (entities as Record<string, unknown>)[paramName] as EntitySchema | [EntitySchema];
        /* tslint:disable-next-line:no-string-literal  */
        const arraySafeEntitySchema: EntitySchema = Array.isArray(entitySchema) ? entitySchema[0] : entitySchema;
        if (arraySafeEntitySchema.entityType === action.entityType) {
          // Found it! Does the entity contain a value for the property name?
          const entityData = entity.entity as Record<string, unknown>;
          if (!entityData[paramName]) {
            return action; // Return action instead of undefined
          }

          const catalogEntity = entityCatalog.getEntity(eicAction);
          const entityKey = catalogEntity.entityKey;
          const paramValue = entityData[paramName];
          const paramValueArray = Array.isArray(paramValue) ? paramValue : [paramValue];

          const normedEntities = paramValueArray.reduce((newNormedEntities: Record<string, Record<string, unknown>>, guidOrEntity: unknown) => {
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
            entities: paramValueArray as APIResource[],
            childEntities: paramValueArray,
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
      return action; // Return action instead of undefined
    })
  );
}

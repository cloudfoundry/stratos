import { Action, Store } from '@ngrx/store';
import { denormalize } from 'normalizr';
import { Observable, of as observableOf } from 'rxjs';
import { filter, first, map, mergeMap, pairwise, skipWhile, switchMap, withLatestFrom } from 'rxjs/operators';

import { isEntityBlocked } from '../../core/entity-service';
import { pathGet } from '../../core/utils.service';
import { SetInitialParams } from '../actions/pagination.actions';
import { FetchRelationAction, FetchRelationPaginatedAction, FetchRelationSingleAction } from '../actions/relation.actions';
import { APIResponse } from '../actions/request.actions';
import { AppState } from '../app-state';
import { ActionState, RequestInfoState } from '../reducers/api-request-reducer/types';
import { getAPIRequestDataState, selectEntity, selectRequestInfo } from '../selectors/api.selectors';
import { selectPaginationState } from '../selectors/pagination.selectors';
import { APIResource, NormalizedResponse } from '../types/api.types';
import { PaginatedAction, PaginationEntityState } from '../types/pagination.types';
import { IRequestAction, RequestEntityLocation, WrapperRequestActionSuccess } from '../types/request.types';
import { EntitySchema } from './entity-factory';
import { fetchEntityTree } from './entity-relations.tree';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
  EntityInlineParentAction,
  EntityTreeRelation,
  isEntityInlineChildAction,
  ValidateEntityRelationsConfig,
  ValidationResult,
} from './entity-relations.types';
import { pick } from './reducer.helper';


interface ValidateResultFetchingState {
  fetching: boolean;
}

/**
 * An object to represent the action and status of a missing inline depth/entity relation.
 * @export
 * @interface ValidateEntityResult
 */
interface ValidateEntityResult {
  action: FetchRelationAction;
  fetchingState$?: Observable<ValidateResultFetchingState>;
  abortDispatch?: boolean;
}

class ValidateLoopConfig extends ValidateEntityRelationsConfig {
  /**
   * List of `{parent entity key} - {child entity key}` strings which should exist in entities structure
   *
   * @type {string[]}
   * @memberof ValidateLoopConfig
   */
  includeRelations: string[];
  /**
   * List of entities to validate
   *
   * @type {any[]}
   * @memberof ValidateLoopConfig
   */
  entities: any[];
  /**
   * Parent entity relation of children in the entities param
   *
   * @type {EntityTreeRelation}
   * @memberof ValidateLoopConfig
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
    createEntityRelationPaginationKey(parentRelation.entityKey, parentGuid, childRelation.entity.relationKey),
    populateMissing,
    childEntitiesUrl
  );
}

function createPaginationWatcher(store, paramAction, paramPaginationAction: FetchRelationPaginatedAction):
  Observable<ValidateResultFetchingState> {
  return store.select(selectPaginationState(paramAction.entityKey, paramPaginationAction.paginationKey)).pipe(
    map((paginationState: PaginationEntityState) => {
      const pageRequest: ActionState =
        paginationState && paginationState.pageRequests && paginationState.pageRequests[paginationState.currentPage];
      return { fetching: pageRequest ? pageRequest.busy : true };
    })
  );
}

function createEntityWatcher(store, paramAction, guid: string): Observable<ValidateResultFetchingState> {
  return store.select(selectRequestInfo(paramAction.entityKey, guid)).pipe(
    map((requestInfo: RequestInfoState) => {
      return { fetching: requestInfo ? requestInfo.fetching : true };
    })
  );
}

/**
 * Create actions required to populate parent entities with exist children
 *
 * @param {HandleRelationsConfig} config
 * @returns {ValidateEntityResult[]}
 */
function createActionsForExistingEntities(config: HandleRelationsConfig): Action {
  const { store, allEntities, newEntities, childEntities, childRelation } = config;
  const childEntitiesAsArray = childEntities as Array<any>;

  const paramAction = createAction(config);
  // We've got the value already, ensure we create a pagination section for them
  let response: NormalizedResponse;
  const guids = childEntitiesAsGuids(childEntitiesAsArray);
  const safeEewEntities = newEntities || {};
  const entities = pick(safeEewEntities[childRelation.entityKey], guids as [string]) ||
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

/**
 * Create actions required to fetch missing relations
 *
 * @param {HandleRelationsConfig} config
 * @returns {ValidateEntityResult[]}
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
    // about wil be in the parent entity.
    paramPaginationAction.paginationKey += '-relation';
    results = [].concat(results, [{
      action: new SetInitialParams(paramAction.entityKey, paramPaginationAction.paginationKey, paramPaginationAction.initialParams, true)
    },
    {
      action: paramAction,
      fetchingState$: createPaginationWatcher(store, paramAction, paramPaginationAction)
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
 *
 * @param {HandleRelationsConfig} config
 * @returns {ValidateEntityResult[]}
 */
function handleRelation(config: HandleRelationsConfig): ValidateEntityResult[] {
  const { cfGuid, childEntities, parentEntity, parentRelation, childRelation, populateMissing } = config;

  if (!cfGuid) {
    throw Error(`No CF Guid provided when validating
     ${parentRelation.entityKey} ${parentEntity.metadata.guid}'s ${childRelation.entityKey}`);
  }

  // Have we failed to find some required missing entities?
  let results = [];
  if (childEntities) {
    if (!childRelation.isArray) {
      // We've already got the missing entity in the store or current response, we just need to associate it with it's parent
      const connectEntityWithParent: ValidateEntityResult = {
        action: createSingleAction(config),
        abortDispatch: true // Don't need to make the request.. it's either in the store or as part of apiResource with be
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
 *
 * @param {ValidateLoopConfig} config
 * @returns {ValidateEntityResult[]}
 */
function validationLoop(config: ValidateLoopConfig): ValidateEntityResult[] {
  const { store, cfGuid, entities, parentRelation, allEntities, allPagination, newEntities } = config;

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
            `${childRelation.entityKey}.${createEntityRelationPaginationKey(parentRelation.entityKey, entity.metadata.guid)}`,
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

          for (let i = 0; i < guids.length; i++) {
            const guid = guids[i];
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
          childEntities: childEntities,
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

function associateChildWithParent(store, action: FetchRelationAction, apiResponse: APIResponse): Observable<boolean> {
  let childValue;
  // Fetch the child value to associate with parent. Will either be a guid or a list of guids
  if (action.child.isArray) {
    const paginationAction = action as FetchRelationPaginatedAction;
    childValue = store.select(selectPaginationState(action.entityKey, paginationAction.paginationKey)).pipe(
      first(),
      map((paginationSate: PaginationEntityState) => paginationSate.ids[1] || [])
    );
  } else {
    const entityAction = action as FetchRelationSingleAction;
    childValue = observableOf(entityAction.guid);
  }

  return childValue.pipe(
    map(value => {
      if (!value) {
        return true;
      }

      if (apiResponse) {
        // Part of an api call. Assign to apiResponse which is added to store later
        apiResponse.response.entities[action.parentEntitySchema.key][action.parentGuid].entity[action.child.paramName] = value;
      } else {
        // Not part of an api call. We already have the entity in the store, so fire off event to link child with parent
        const response = {
          entities: {
            [action.parentEntitySchema.key]: {
              [action.parentGuid]: {
                entity: {
                  [action.child.paramName]: value
                }
              }
            }
          },
          result: [action.parentGuid]
        };
        const parentAction: IRequestAction = {
          endpointGuid: action.endpointGuid,
          entity: action.parentEntitySchema,
          entityLocation: RequestEntityLocation.OBJECT,
          guid: action.parentGuid,
          entityKey: action.parentEntitySchema.key,
          type: '[Entity] Associate with parent',
        };
        // Add for easier debugging
        parentAction['childEntityKey'] = action.child.entityKey;

        const successAction = new WrapperRequestActionSuccess(response, parentAction, 'fetch', 1, 1);
        store.dispatch(successAction);
      }
      return true;
    })
  );
}

function handleValidationLoopResults(store: Store<AppState>, results: ValidateEntityResult[], apiResponse: APIResponse): ValidationResult {
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
        const action: FetchRelationAction = FetchRelationAction.is(request.action);
        return action ? associateChildWithParent(store, action, apiResponse) : observableOf(true);
      }),
    ).toPromise();
    paginationFinished.push(associatedObs);
  });
  return {
    started: !!(paginationFinished.length),
    completed: Promise.all(paginationFinished),
    apiResponse
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
 * @param {ValidateEntityRelationsConfig} config See ValidateEntityRelationsConfig
 * @returns {ValidationResult}
 */
export function validateEntityRelations(config: ValidateEntityRelationsConfig): ValidationResult {
  config.newEntities = config.apiResponse ? config.apiResponse.response.entities : null;
  const { action, populateMissing, newEntities, allEntities, store } = config;
  let { parentEntities } = config;

  if (!action.entity || !parentEntities || parentEntities.length === 0) {
    return {
      apiResponse: config.apiResponse,
      started: false,
      completed: Promise.resolve([])
    };
  }

  const relationAction = action as EntityInlineParentAction;
  const entityTree = fetchEntityTree(relationAction);

  if (parentEntities && parentEntities.length && typeof (parentEntities[0]) === 'string') {
    parentEntities = denormalize(parentEntities, [entityTree.rootRelation.entity], newEntities || allEntities);
  }

  const results = validationLoop({
    ...config,
    includeRelations: relationAction.includeRelations,
    populateMissing: populateMissing || relationAction.populateMissing,
    entities: parentEntities,
    parentRelation: entityTree.rootRelation,
  });

  return handleValidationLoopResults(store, results, config.apiResponse);
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
 * @param {Store<AppState>} store
 * @param {PaginatedAction} action
 * @returns {Observable<boolean>}
 */
export function populatePaginationFromParent(store: Store<AppState>, action: PaginatedAction): Observable<Action> {
  if (!isEntityInlineChildAction(action) || !action.flattenPagination) {
    return observableOf(null);
  }
  const parentEntitySchema = action['parentEntitySchema'] as EntitySchema;
  const parentGuid = action['parentGuid'];

  // What the hell is going on here hey? Well I'll tell you...
  // Ensure that the parent is not blocked (fetching, updating, etc) before we check if it has the child param that we need
  return store.select(selectEntity(parentEntitySchema.key, parentGuid)).pipe(
    first(),
    mergeMap(entity => {
      if (!entity) {
        return observableOf(null);
      }
      return store.select(selectRequestInfo(parentEntitySchema.key, parentGuid));
    }),
    filter((entityInfo: RequestInfoState) => {
      return !isEntityBlocked(entityInfo);
    }),
    first(),
    // At this point we should know that the parent entity is ready to be checked
    withLatestFrom(store.select(selectEntity(parentEntitySchema.key, parentGuid))),
    withLatestFrom(store.select(getAPIRequestDataState)),
    map(([entityState, allEntities]) => {
      const [entityInfo, entity] = entityState;
      if (!entity) {
        return;
      }
      // Find the property name (for instance a list of routes in a parent space would have param name `routes`)
      const entities = parentEntitySchema.schema['entity'] || {};
      const params = Object.keys(entities);
      for (let i = 0; i < params.length; i++) {
        const paramName = params[i];
        const entitySchema: EntitySchema | [EntitySchema] = entities[paramName];
        const arraySafeEntitySchema: EntitySchema = entitySchema['length'] >= 0 ? entitySchema[0] : entitySchema;
        if (arraySafeEntitySchema.key === action.entityKey) {
          // Found it! Does the entity contain a value for the property name?
          if (!entity.entity[paramName]) {
            return;
          }
          // Yes? Let's create the action that will populate the pagination section with the value
          const config: HandleRelationsConfig = {
            store,
            action: null,
            allEntities,
            allPagination: {},
            newEntities: {},
            apiResponse: null,
            parentEntities: null,
            entities: entity.entity[paramName],
            childEntities: entity.entity[paramName],
            cfGuid: action.endpointGuid,
            parentRelation: new EntityTreeRelation(parentEntitySchema, false, null, null, []),
            includeRelations: [createEntityRelationKey(parentEntitySchema.key, action.entityKey)],
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

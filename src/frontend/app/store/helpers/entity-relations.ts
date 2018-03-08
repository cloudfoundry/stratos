import { Action, Store } from '@ngrx/store';
import { denormalize } from 'normalizr';
import { Observable } from 'rxjs/Observable';
import { first, map, pairwise, skipWhile } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { pathGet } from '../../core/utils.service';
import { SetInitialParams } from '../actions/pagination.actions';
import { FetchRelationPaginatedAction, FetchRelationSingleAction } from '../actions/relation.actions';
import { AppState } from '../app-state';
import { ActionState, RequestInfoState } from '../reducers/api-request-reducer/types';
import { selectRequestInfo } from '../selectors/api.selectors';
import { selectPaginationState } from '../selectors/pagination.selectors';
import { APIResource, NormalizedResponse } from '../types/api.types';
import { PaginationEntityState } from '../types/pagination.types';
import { IRequestAction, WrapperRequestActionSuccess } from '../types/request.types';
import {
  createEntityRelationPaginationKey,
  EntityInlineParentAction,
  EntityTreeRelation,
  ValidationResult,
} from './entity-relations.types';
import { pick } from './reducer.helper';
import { fetchEntityTree } from './entity-relations.tree';

class AppStoreLayout {
  [entityKey: string]: {
    [guid: string]: any;
  }
}

// TODO: RC
// interface ListRelationsResult {
//   maxDepth: number;
//   relations: string[];
// }

interface ValidateResultFetchingState {
  fetching: boolean;
}

/**
 * An object to represent the action and status of a missing inline depth/entity relation.
 * @export
 * @interface ValidateEntityResult
 */
interface ValidateEntityResult {
  action: Action;
  fetchingState$?: Observable<ValidateResultFetchingState>;
}



class ValidateEntityRelationsConfig {
  /**
   * The guid of the cf. If this is null or not known we'll try to extract it from the list of parentEntities
   *
   * @type {string}
   * @memberof ValidateEntityRelationsConfig
   */
  cfGuid: string;
  store: Store<AppState>;
  /**
   * Entities store. Used to determine if we already have the entity/entities and to watch when fetching entities
   *
   * @type {AppStoreLayout}
   * @memberof ValidateEntityRelationsConfig
   */
  allEntities: AppStoreLayout;
  /**
   * New entities that have not yet made it into the store (as a result of being called mid-api handling). Used to determine if we already
   * have an entity/entities
   *
   * @type {AppStoreLayout}
   * @memberof ValidateEntityRelationsConfig
   */
  newEntities: AppStoreLayout;
  /**
   * The action that has fetched the entity/entities
   *
   * @type {IRequestAction}
   * @memberof ValidateEntityRelationsConfig
   */
  action: IRequestAction;
  /**
   * Collection of parent entities whose children may be missing. for example a list of organisations that have missing spaces
   *
   * @type {any[]}
   * @memberof ValidateEntityRelationsConfig
   */
  parentEntities: any[];
  /**
   * If a child is missing, should we raise an action to fetch it?
   *
   * @memberof ValidateEntityRelationsConfig
   */
  populateMissing = false;
  /**
   * If a child exists, should we raise an action to store it as a pagination list?
   *
   * @memberof ValidateEntityRelationsConfig
   */
  populateExisting = false;
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

function createEntityUrl(relation: EntityTreeRelation) {
  return relation.path + '_url';
}

function createAction(config: HandleRelationsConfig) {
  const { cfGuid, parentRelation, parentEntity, childRelation, childEntitiesUrl, includeRelations, populateMissing } = config;
  return childRelation.isArray ? new FetchRelationPaginatedAction(
    cfGuid,
    parentEntity.metadata.guid,
    parentRelation,
    childRelation,
    includeRelations,
    createEntityRelationPaginationKey(parentRelation.entityKey, parentEntity.metadata.guid),
    populateMissing,
    childEntitiesUrl
  ) : new FetchRelationSingleAction(
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
/**
 * Create actions required to populate parent entities with exist children
 *
 * @param {HandleRelationsConfig} config
 * @returns {ValidateEntityResult[]}
 */
function createActionsForExistingEntities(config: HandleRelationsConfig): ValidateEntityResult[] {
  const { allEntities, newEntities, childEntities, childRelation } = config;
  const childEntitiesAsArray = childEntities as Array<any>;

  const paramAction = createAction(config);
  // We've got the value already, ensure we create a pagination section for them
  let response: NormalizedResponse;
  const guids = childEntitiesAsArray.map(entity => entity.metadata.guid);
  const entities = pick(newEntities[childRelation.entityKey], guids as [string]) ||
    pick(allEntities[childRelation.entityKey], guids as [string]);
  response = {
    entities: {
      [childRelation.entityKey]: entities
    },
    result: guids
  };

  const paginationSuccess = new WrapperRequestActionSuccess(
    response,
    paramAction,
    'fetch',
    childEntitiesAsArray.length,
    1
  );
  return [{
    action: paginationSuccess,
  }];
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
 * Create actions required to fetch missing relations
 *
 * @param {HandleRelationsConfig} config
 * @returns {ValidateEntityResult[]}
 */
function createActionsForMissingEntities(config: HandleRelationsConfig): ValidateEntityResult[] {
  const { store, childRelation, childEntitiesUrl } = config;

  const paramAction = createAction(config);
  let results: ValidateEntityResult[] = [];

  if (childRelation.isArray) {
    const paramPaginationAction = paramAction as FetchRelationPaginatedAction;
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
  const { cfGuid, allEntities, parentRelation, parentEntity, childRelation, childEntities, populateExisting, populateMissing } = config;

  if (!cfGuid) {
    throw Error(`No CF Guid provided when validating
     ${parentRelation.entityKey} ${parentEntity.metadata.guid}'s ${childRelation.entityKey}`);
  }

  // Have we found some entities that need to go into the pagination store OR are some entities missing that are required?
  let results = [];
  if (childEntities) {
    // The values exist do we want to put them anywhere else?
    if (!allEntities || !childRelation.isArray || !populateExisting) {
      // Only care about paginated (array schema)
      return results;
    }
    results = [].concat(results, createActionsForExistingEntities(config));
  } else if (!childEntities && populateMissing) {
    // The values are missing and we want them, go fetch
    results = [].concat(results, createActionsForMissingEntities(config));
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
  const { cfGuid, entities, parentRelation } = config;

  if (!entities) {
    return [];
  }

  let results: ValidateEntityResult[] = [];
  parentRelation.childRelations.forEach(childRelation => {
    entities.forEach(entity => {
      const childEntities = pathGet(childRelation.path, entity);
      results = [].concat(results, handleRelation({
        ...config,
        cfGuid: cfGuid || entity.entity.cfGuid,
        parentEntity: entity,
        childRelation,
        childEntities: childEntities,
        childEntitiesUrl: pathGet(createEntityUrl(childRelation), entity),
      }
      ));
      if (childEntities && childRelation.childRelations.length) {
        results = [].concat(results,
          validationLoop({
            ...config,
            cfGuid: cfGuid || entity.entity.cfGuid,
            entities: childRelation.isArray ? childEntities : [childEntities],
            parentRelation: childRelation
          }));
      }
    });
  });

  return results;
}

function handleValidationLoopResults(store, results) {
  const paginationFinished = new Array<Promise<boolean>>();

  results.forEach(newActions => {
    // console.log('Dispatching: ', newActions.action);
    store.dispatch(newActions.action);
    if (newActions.fetchingState$) {
      const obs = newActions.fetchingState$.pipe(
        pairwise(),
        map(([oldFetching, newFetching]) => {
          return oldFetching.fetching === true && newFetching.fetching === false;
        }),
        skipWhile(completed => !completed),
        first(),
      ).toPromise();
      paginationFinished.push(obs);
    }
  });

  return {
    started: !!(paginationFinished.length),
    completed: Promise.all(paginationFinished)
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
  const { action, populateMissing, newEntities, allEntities, store } = config;
  let { parentEntities } = config;

  if (!action.entity || !parentEntities || parentEntities.length === 0) {
    return {
      started: false,
      completed: Promise.resolve([])
    };
  }

  const startTime = new Date().getTime().toString();
  // console.group(startTime);
  // console.time(startTime);

  const relationAction = action as EntityInlineParentAction;
  // console.time(startTime + 'fetch');
  const entityTree = fetchEntityTree(relationAction);
  // console.timeEnd(startTime + 'fetch');

  if (parentEntities && parentEntities.length && typeof (parentEntities[0]) === 'string') {
    parentEntities = denormalize(parentEntities, [entityTree.rootRelation.entity], newEntities || allEntities);
  }

  // console.time(startTime + 'validate');
  const results = validationLoop({
    ...config,
    includeRelations: relationAction.includeRelations,
    populateMissing: populateMissing || relationAction.populateMissing,
    entities: parentEntities,
    parentRelation: entityTree.rootRelation,
  });
  // console.timeEnd(startTime + 'validate');

  const result = handleValidationLoopResults(store, results);
  // console.timeEnd(startTime);
  // console.groupEnd();
  return result;

}

export function listEntityRelations(action: EntityInlineParentAction) {
  // console.group('listRelations' + action.entityKey);
  // console.time('adsdgdssgf' + action.entityKey);
  const tree = fetchEntityTree(action);
  // console.timeEnd('adsdgdssgf' + action.entityKey);
  // console.groupEnd();
  return {
    maxDepth: tree.maxDepth,
    relations: tree.requiredParamNames
  };
}

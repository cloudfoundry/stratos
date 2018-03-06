import { Action, Store } from '@ngrx/store';
import { denormalize, schema } from 'normalizr';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/operator/combineLatest';
import { first, map, skipWhile, combineAll, pairwise, tap, zip } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { pathGet } from '../../core/utils.service';
import { SetInitialParams } from '../actions/pagination.actions';
import { FetchRelationPaginatedAction, FetchRelationSingleAction } from '../actions/relation.actions';
import { AppState } from '../app-state';
import { ActionState, RequestInfoState } from '../reducers/api-request-reducer/types';
import { selectRequestInfo } from '../selectors/api.selectors';
import { selectPaginationState } from '../selectors/pagination.selectors';
import { APIResource, NormalizedResponse } from '../types/api.types';
import { PaginatedAction, PaginationEntityState } from '../types/pagination.types';
import { IRequestAction, WrapperRequestActionSuccess, IRequestActionEntity } from '../types/request.types';
import { pick } from './reducer.helper';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { EntitySchema } from './entity-factory';

export interface ListRelationsResult {
  maxDepth: number;
  relations: string[];
}

export class EntityTreeRelation {
  constructor(
    public entityKey: string,
    public entity: EntitySchema,
    public isArray = false,
    public paramName: string, // space/spaces
    public path = '', // entity.space
    public childRelations: EntityTreeRelation[]
  ) {

  }
}

/**
 * Helper interface. Actions with entities that are children of a parent entity should specify the parent guid.
 *
 * @export
 * @interface EntityInlineChildAction
 */
export interface EntityInlineChildAction {
  parentGuid: string;
}

/**
 * Helper interface. Actions that are a parent of children entities should have these included parent-child relations
 *
 * @export
 * @interface EntityInlineParentAction
 * @extends {PaginatedAction}
 */
export interface EntityInlineParentAction extends IRequestAction {
  includeRelations: string[];
  populateMissing: boolean;
}

// TODO: RC remove uneeded exports
interface ValidateResultFetchingState {
  fetching: boolean;
}
/**
 * An object to represent the action and monitor for a missing inline depth/entity relation. For instance, if spaces are missing from an
 * organisation then the action would be for GetAllOrganisationSpaces and the paginationMonitor would contain a monitor for that pagination
 * section
 * //TODO: RC check
 * @export
 * @interface ValidateEntityResult
 */
export interface ValidateEntityResult {
  action: Action;
  fetchingState$?: Observable<ValidateResultFetchingState>;
}

export class tempAppStore { // TODO: RC
  [entityKey: string]: {
    [guid: string]: any;
  }
}

export class ValidationResult {
  started: boolean;
  completed: Promise<boolean[]>;
}

class EntityTree {
  rootRelation: EntityTreeRelation;
  requiredParamNames: string[];
  maxDepth?: number;
}

const entityTreeCache: {
  [entityKey: string]: EntityTree
} = {};

export function generateEntityRelationKey(parentKey: string, childKey) { return `${parentKey}-${childKey}`; }

export function entityRelationCreatePaginationKey(schemaKey: string, guid: string) { return `${schemaKey}-${guid}`; }

export function isEntityInlineParentAction(action: Action) {
  return action && !!action['includeRelations'];
}

function createEntityUrl(relation: EntityTreeRelation) {
  return relation.path + '_url';
}

function handleRelation(
  config: {
    cfGuid: string,
    store: any,
    allEntities: tempAppStore,
    newEntities: tempAppStore,
    parentRelation: EntityTreeRelation,
    parentEntity: APIResource,
    childRelation: EntityTreeRelation,
    childEntities: object | any[],
    childEntitiesUrl: string,
    includeRelations: string[],
    populateExisting: boolean,
    populateMissing: boolean
  }
): ValidateEntityResult[] {
  const {
    cfGuid,
    store,
    allEntities,
    newEntities,
    parentRelation,
    parentEntity,
    childRelation,
    childEntities,
    childEntitiesUrl,
    includeRelations,
    populateExisting,
    populateMissing
  } = config;

  if (!cfGuid) {
    throw Error(`No CF Guid provided when validating
     ${parentRelation.entityKey} ${parentEntity.metadata.guid}'s ${childRelation.entityKey}`);
  }

  let results = [];
  // Step 2) Determine what actions, if any, need to be raised given the state of the relationship and children
  // No relevant relation, skip

  function createAction() {
    return childRelation.isArray ? new FetchRelationPaginatedAction(
      cfGuid,
      parentEntity.metadata.guid,
      parentRelation,
      childRelation,
      includeRelations,
      entityRelationCreatePaginationKey(parentRelation.entityKey, parentEntity.metadata.guid),
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

  // Have we found some entities that need to go into the pagination store OR are some entities missing that are required?
  if (childEntities) {
    if (!allEntities || !childRelation.isArray || !populateExisting) {
      // Only care about paginated (array schema)
      return results;
    }
    const childEntitiesAsArray = childEntities as Array<any>;

    const paramAction = createAction();
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
    results.push({
      action: paginationSuccess,
    });
  } else if (!childEntities && populateMissing) {
    // The values are missing and we want them, go fetch

    const paramAction = createAction();

    if (childRelation.isArray) {
      const paramPaginationAction = paramAction as FetchRelationPaginatedAction;
      results = [].concat(results, [{
        action: new SetInitialParams(paramAction.entityKey, paramPaginationAction.paginationKey, paramPaginationAction.initialParams, true)
      },
      {
        action: paramAction,
        fetchingState$: store.select(selectPaginationState(paramAction.entityKey, paramPaginationAction.paginationKey)).pipe(
          map((paginationState: PaginationEntityState) => {
            const pageRequest: ActionState =
              paginationState && paginationState.pageRequests && paginationState.pageRequests[paginationState.currentPage];
            return {
              fetching: pageRequest ? pageRequest.busy : true
            } as ValidateResultFetchingState;
          })
        )
      }
      ]);
    } else {
      const guid = childEntitiesUrl.substring(childEntitiesUrl.lastIndexOf('/') + 1);
      results.push({
        action: paramAction,
        fetchingState$: store.select(selectRequestInfo(paramAction.entityKey, guid)).pipe(
          map((requestInfo: RequestInfoState) => {
            return {
              fetching: requestInfo ? requestInfo.fetching : true
            };
          })
        )
      });
    }
  }

  return results;
}

function validationLoop(
  config: {
    cfGuid: string,
    store: Store<AppState>,
    includeRelations: string[],
    allEntities: tempAppStore,
    newEntities: tempAppStore,
    populateExisting: boolean,
    populateMissing: boolean,
    entities: any[],
    parentRelation: EntityTreeRelation,
  }
)
  : ValidateEntityResult[] {
  let results = [];

  const {
    cfGuid,
    store,
    includeRelations,
    allEntities,
    newEntities,
    populateExisting,
    populateMissing,
    entities,
    parentRelation,
  } = config;

  // Step 1) Iterate through the entities schema structure discovering all the entities and whether they need to be checked for relations
  if (!entities) {
    return results;
  }
  parentRelation.childRelations.forEach(childRelation => {
    entities.forEach(entity => {
      const childEntities = pathGet(childRelation.path, entity);
      results = [].concat(results, handleRelation({
        cfGuid: cfGuid || entity.entity.cfGuid,
        store,
        allEntities,
        newEntities,
        parentRelation,
        parentEntity: entity,
        childRelation,
        childEntities: childEntities,
        childEntitiesUrl: pathGet(createEntityUrl(childRelation), entity),
        includeRelations,
        populateExisting,
        populateMissing,
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

/**
 * Ensure all required inline parameters specified by the entity associated with the request exist.
 * If the inline parameter/s are..
 * - missing - (optionally) return an action that will fetch them and ultimately store in a pagination. This will also populate the parent
 * entities inline parameter (see the generic request data reducer).
 * - exist - (optionally) return an action that will store them in pagination.
 *
 * @export
 * @param {Store<AppState>} store //TODO: RC Check all
 * @param {IRequestAction} action The action that has fetched the collection of entities
 * @param {any[]} parentEntities Collection of parent entities whose children may be missing
 * @param {boolean} [populateMissing=false] If a child is missing, should we raise an action to fetch it?
 * @param {boolean} [populateExisting=false] If a child exists, should we raise an action to store it as a pagination list?
 * @returns {Observable<{
 *     allFinished: Observable<any>,
 *     entityResults: ValidateEntityResult[] // TODO: RC
 *   }>}
 */
export function validateEntityRelations(
  cfGuid: string,
  store: Store<AppState>,
  allEntities: tempAppStore,
  newEntities: tempAppStore,
  action: IRequestAction,
  parentEntities: any[],
  populateMissing = false,
  populateExisting = false): ValidationResult {

  if (!action.entity || !parentEntities || parentEntities.length === 0) {
    return {
      started: false,
      completed: Promise.resolve([])
    };
  }

  const startTime = new Date().getTime().toString();
  console.group(startTime);
  console.time(startTime);
  const emptyResponse = {
    started: false,
    completed$: Observable.of(null)
  };

  if (parentEntities && parentEntities.length && typeof (parentEntities[0]) === 'string') {
    parentEntities = denormalize(parentEntities, action.entity, newEntities || allEntities);
  }

  const relationAction = action as EntityInlineParentAction;

  console.time(startTime + 'fetch');
  const entityTree = fetchEntityTree(relationAction);
  console.timeEnd(startTime + 'fetch');

  console.time(startTime + 'validate');
  const results = validationLoop({
    cfGuid,
    store,
    includeRelations: relationAction.includeRelations,
    allEntities,
    newEntities,
    populateExisting,
    populateMissing: populateMissing || relationAction.populateMissing,
    entities: parentEntities,
    parentRelation: entityTree.rootRelation,
  });
  console.timeEnd(startTime + 'validate');


  const paginationFinished = new Array<Promise<boolean>>();

  const dispatchInterval = environment.production ? 0 : 10000;

  // setInterval((a) => {
  //   console.log('1wank: ', a);
  // }, 1000);
  // interval(1000).pipe(
  //   tap((a) => {
  //     console.log('2wank: ', a);
  //   }),
  // ).subscribe();

  results.forEach(newActions => {
    console.log('Dispatching: ', newActions.action);
    store.dispatch(newActions.action);
    if (newActions.fetchingState$) {
      const obs = newActions.fetchingState$.pipe(
        pairwise(),
        map(([oldFetching, newFetching]) => {
          // console.log(`--------------------${relationAction.entityKey} - ${newActions.action['entityKey']}-${oldFetching.fetching}-${newFetching.fetching}`);
          return oldFetching.fetching === true && newFetching.fetching === false;
        }),
        skipWhile(completed => !completed),
        first(),
      ).toPromise();
      paginationFinished.push(obs);
    }
  });

  const b = Promise.all(paginationFinished);

  console.timeEnd(startTime);
  console.groupEnd();
  const started = !!(paginationFinished.length);
  return {
    started,
    completed: Promise.all(paginationFinished)
  };
}


export function listRelations(action: EntityInlineParentAction): ListRelationsResult {
  console.group('listRelations' + action.entityKey);
  console.time('adsdgdssgf' + action.entityKey);
  const tree = fetchEntityTree(action);
  console.timeEnd('adsdgdssgf' + action.entityKey);
  console.groupEnd();
  return {
    maxDepth: tree.maxDepth,
    relations: tree.requiredParamNames
  };
}

function generateCacheKey(entityKey: string, action: EntityInlineParentAction): string {
  let includeRelations = action.includeRelations || [];
  includeRelations = includeRelations.sort((a, b) => {
    return a.localeCompare(b);
  });
  return entityKey + '+' + includeRelations.join(',');
}

export function fetchEntityTree(action: EntityInlineParentAction): EntityTree {
  let entity = action.entity;
  const isArray = entity['length'] > 0;
  entity = isArray ? entity[0] : entity;
  const entityKey = entity['key'];
  const cacheKey = generateCacheKey(entityKey, action);
  let entityTree = entityTreeCache[cacheKey];
  if (!entityTree) {
    const rootEntityRelation = new EntityTreeRelation(
      entityKey,
      entity as schema.Entity,
      isArray,
      null,
      '',
      new Array<EntityTreeRelation>()
    );
    entityTree = {
      rootRelation: rootEntityRelation,
      requiredParamNames: new Array<string>(),
    };
    createEntityTree(entityTree, rootEntityRelation);
    entityTreeCache[cacheKey] = entityTree;
    console.log('fetchEntity: Not Found');
  } else {
    console.log('fetchEntity: Found');
  }
  // Calc max depth and exclude not needed
  entityTree.rootRelation.childRelations = parseEntityTree(entityTree, entityTree.rootRelation, action.includeRelations);
  return entityTree;
}

export function createEntityTree(tree: EntityTree, entityRelation: EntityTreeRelation, schemaObj?, path: string = '') {
  const rootEntitySchema = schemaObj || entityRelation.entity['schema'];
  Object.keys(rootEntitySchema).forEach(key => {
    let value = rootEntitySchema[key];
    const isArray = value['length'] > 0;
    value = isArray ? value[0] : value;

    const newPath = path ? path + '.' + key : key;
    if (value instanceof schema.Entity) {
      const newEntityRelation = new EntityTreeRelation(
        value.key,
        value,
        isArray,
        key,
        newPath,
        new Array<EntityTreeRelation>()
      );
      entityRelation.childRelations.push(newEntityRelation);
      createEntityTree(tree, newEntityRelation, null, '');
    } else if (value instanceof Object) {
      createEntityTree(tree, entityRelation, value, newPath);
    }
  });
}

export function parseEntityTree(tree: EntityTree, entityRelation: EntityTreeRelation, includeRelations: string[] = [])
  : EntityTreeRelation[] {
  const newChildRelations = new Array<EntityTreeRelation>();
  entityRelation.childRelations.forEach((relation, index, array) => {
    const parentChildKey = generateEntityRelationKey(entityRelation.entityKey, relation.entityKey);
    if (includeRelations.indexOf(parentChildKey) >= 0) {
      const clone = { ...relation };
      newChildRelations.push(clone);
      if (tree.requiredParamNames.indexOf(relation.paramName) < 0) {
        tree.requiredParamNames.push(relation.paramName);
      }
      clone.childRelations = parseEntityTree(tree, relation, includeRelations);
    }
  });
  entityRelation.childRelations = newChildRelations;
  if (entityRelation.childRelations.length) {
    tree.maxDepth = tree.maxDepth || 0;
    tree.maxDepth++;
  }
  return newChildRelations;
}


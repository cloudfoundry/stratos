import { Action, Store } from '@ngrx/store';
import { denormalize, Schema, schema } from 'normalizr';
import { Observable } from 'rxjs/Observable';
import { skipWhile, takeWhile, zip, tap, pairwise, map } from 'rxjs/operators';

import { pathGet } from '../../core/utils.service';
import { PaginationMonitor } from '../../shared/monitors/pagination-monitor';
import { SetInitialParams } from '../actions/pagination.actions';
import { FetchRelationAction } from '../actions/relation.actions';
import { AppState } from '../app-state';
import { PaginatedAction } from '../types/pagination.types';
import { IRequestAction, WrapperRequestActionSuccess } from '../types/request.types';
import { pick } from './reducer.helper';

export function generateEntityRelationKey(parentKey: string, childKey) {
  return `${parentKey}-${childKey}`;
}

export function entityRelationCreatePaginationKey(schemaKey: string, guid: string) { return `${schemaKey}-${guid}`; }

/**
 * Helper interface. Actions with entities that are children of a parent entity should specify the parent guid.
 *
 * @export
 * @interface EntityInlineChildAction
 */
export interface EntityInlineChildAction extends PaginatedAction {
  parentGuid: string;
}

export function isEntityInlineParentAction(action: Action) {
  return action && !!action['includeRelations'];
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

/**
 * An object to represent the action and monitor for a missing inline depth/entity relation. For instance, if spaces are missing from an
 * organisation then the action would be for GetAllOrganisationSpaces and the paginationMonitor would contain a monitor for that pagination
 * section
 *
 * @export
 * @interface ValidateEntityResult
 */
export interface ValidateEntityResult {
  action: Action;
  paginationMonitor?: PaginationMonitor;
}

function handleRelation({
  store,
  allEntities,
  entities,
  parentEntitySchemaKey,
  parentEntity,
  childEntityParentParam,
  childEntitySchemaKey,
  childEntitySchema,
  childEntitiesUrl,
  populateExisting,
  populateMissing
}): ValidateEntityResult[] {
  let results = [];
  // Step 2) Determine what actions, if any, need to be raised given the state of the relationship and children
  // No relevant relation, skip
  if (!childEntitySchema) {
    return results;
  }
  const childEntitySchemaSafe = extractEntitySchema(childEntitySchema);

  function createParamAction() {
    return new FetchRelationAction(
      parentEntity.entity.cfGuid,
      parentEntity.metadata.guid,
      parentEntitySchemaKey,
      childEntitiesUrl,
      childEntitySchema,
      childEntitySchemaKey, // TODO: RC routesInSpaceKey??
      childEntityParentParam,
      entityRelationCreatePaginationKey(parentEntitySchemaKey, parentEntity.metadata.guid)
    );
  }

  // Have we found some entities that need to go into the pagination store OR are some entities missing that are required?
  if (entities && populateExisting) {
    if (!allEntities) {
      return results;
    }
    const paramAction = createParamAction();
    // We've got the value already, ensure we create a pagination section for them
    const guids = entities.map(entity => entity.metadata.guid);
    const normalizedEntities = pick(allEntities[childEntitySchemaKey], guids as [string]);
    const paginationSuccess = new WrapperRequestActionSuccess(
      {
        entities: {
          [childEntitySchemaKey]: normalizedEntities
        },
        result: guids
      },
      paramAction,
      'fetch',
      entities.length,
      1
    );
    results.push({
      action: paginationSuccess,
    });
  } else if (!entities && populateMissing) {
    const paramAction = createParamAction();
    // The values are missing and we want them, go fetch
    results = [].concat(results, [{
      action: new SetInitialParams(paramAction.entityKey, paramAction.paginationKey, paramAction.initialParams, true)
    },
    {
      action: paramAction,
      paginationMonitor: new PaginationMonitor(store, paramAction.paginationKey, childEntitySchemaSafe)
    }
    ]);
  }

  return results;
}

/**
 * Inner loop for validateEntityRelations. Does two parts
 * 1) Iterates through the schema of an entity alongside an entity. For example a schema could be
 * ```
 * {
 *  entity: {
 *    spaces: SpacesSchema  {
 *                            entity: {
 *                              routes: RoutesSchema
 *                            }
 *                          }
 *  }
 * }
 * ```
 * whilst a entity structure could be
 * ```
 * {
 *  entity: {
 *    spaces: [
 *      xyz: {
 *        routes: [
 *        ]
 *      }
 *    ]
 *  }
 * }
 * ```
 * We'd recurse through both structures at the same time, ensuring all entities (parent, space, route) checking the state of each defined
 * relationship (parent-space, space-route)
 *
 * 2) Check for missing or existing inline relations
 * At each state of the recursion ensure all entities at that level (spaces, routes) satisfy any configured relationship (parent-space,
 * space-route).
 *
 * @param {{
 *     store: Store<AppState>,
 *     action: EntityInlineParentAction,
 *     allEntities: {},
 *     populateExisting: boolean,
 *     populateMissing: boolean,
 *     parentEntity: any,
 *     entities: any[],
 *     parentEntitySchemaKey: string,
 *     parentEntitySchemaParam,
 *     childRelation: EntityRelation,
 *     path: string,
 *   }} config
 * @returns {ValidateEntityResult[]}
 */
function validationLoop(
  config: {
    store: Store<AppState>,
    action: EntityInlineParentAction,
    allEntities: tempAppStore,
    populateExisting: boolean,
    populateMissing: boolean,
    parentEntity: any,
    entities: any[],
    parentEntitySchemaKey: string,
    parentEntitySchemaParam: any,
    path: string,
  }
)
  : ValidateEntityResult[] {
  let results = [];

  const {
    store,
    action,
    allEntities,
    populateExisting,
    populateMissing,
    parentEntity,
    entities,
    parentEntitySchemaKey,
    parentEntitySchemaParam,
    path
  } = config;

  // Step 1) Iterate through the entities schema structure discovering all the entities and whether they need to be checked for relations
  if (entities) {
    Object.keys(parentEntitySchemaParam).forEach(key => {
      const value = parentEntitySchemaParam[key];
      const arraySchema = value['length'] > 0;
      const arraySafeValue = arraySchema ? value[0] : value;

      // TODO: RC comment... if this is not an array we'll never be missing it... however we may want to check it's own relations in the else
      if (arraySafeValue instanceof schema.Entity) {
        const schema: schema.Entity = arraySafeValue;
        if (!validRelation(parentEntitySchemaKey, schema.key, action.includeRelations)) {
          return;
        }
        const newPath = path.length ? path + '.' + key : key;
        entities.forEach(entity => {
          const childEntities = pathGet(newPath, entity);

          if (arraySchema) {
            results = [].concat(results, handleRelation({
              store,
              allEntities,
              entities: childEntities,
              parentEntitySchemaKey,
              parentEntity: entity,
              childEntityParentParam: key,
              childEntitySchemaKey: schema.key,
              childEntitySchema: value,
              childEntitiesUrl: pathGet(newPath + '_url', entity),
              populateExisting,
              populateMissing
            }));
          }

          // The actual check is step two of validation loop, but only after we've tried to discover if this child has any children
          // it needs validating
          results = [].concat(results,
            validationLoop({
              ...config,
              parentEntity: entity,
              entities: childEntities,
              parentEntitySchemaKey: schema.key,
              parentEntitySchemaParam: schema['schema'],
              path: ''
            }));
        });
      } else if (arraySafeValue instanceof Object) {
        // This isn't a relation, continue checking it's children
        results = [].concat(results, validationLoop({
          ...config,
          parentEntitySchemaParam: arraySafeValue,
          path: path.length ? path + '.' + key : key
        }));
      }
    });
  }

  return results;
}

export class tempAppStore { // TODO: RC
  [entityKey: string]: {
    [guid: string]: any;
  }
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
 *     entityResults: ValidateEntityResult[]
 *   }>}
 */
export function validateEntityRelations(
  store: Store<AppState>,
  allEntities: tempAppStore,
  action: IRequestAction,
  parentEntities: any[],
  populateMissing = false,
  populateExisting = false): {
    started: boolean,
    completed$: Observable<any[]>
  } {

  const emptyResponse = {
    started: false,
    completed$: Observable.of(null)
  };
  // Does the entity associated with the action have inline params that need to be validated?
  const parentEntitySchema = extractActionEntitySchema(action);
  if (!parentEntitySchema) {
    return emptyResponse;
  }

  // Do we have entities in the response to validate?
  if (!parentEntities || !parentEntities.length) {
    return emptyResponse;
  }
  // let denormedEnterties = entities;
  if (parentEntities && parentEntities.length && typeof (parentEntities[0]) === 'string') {
    parentEntities = denormalize(parentEntities, action.entity, allEntities);
  }

  const relationAction = action as EntityInlineParentAction;

  const results = validationLoop({
    store,
    action: relationAction,
    allEntities,
    populateExisting,
    populateMissing: populateMissing || relationAction.populateMissing,
    parentEntity: null,
    entities: parentEntities,
    parentEntitySchemaKey: parentEntitySchema['key'],
    parentEntitySchemaParam: parentEntitySchema['schema'],
    path: ''
  });

  const paginationFinished = new Array<Observable<any>>(Observable.of(true));
  results.forEach(newActions => {
    store.dispatch(newActions.action);
    // TODO: RC Failures?
    if (newActions.paginationMonitor) {
      console.log('Adding... ', newActions.action);
      const obs = newActions.paginationMonitor.fetchingCurrentPage$.pipe(
        tap(a => console.log(a)),
        pairwise(),
        // skipWhile(fetching => fetching),
        takeWhile(([oldFetching, newFetching]) => {
          // Don't tweak this unless you test child actions finish before parent action
          return oldFetching !== true && newFetching !== false;
        }),
      );
      paginationFinished.push(obs);
    }
  });

  return {
    started: !!results.length,
    completed$: Observable.zip(...paginationFinished)
  };
}

function extractActionEntitySchema(action: IRequestAction): {
  key: string;
} {
  return extractEntitySchema(action.entity);
}

function extractEntitySchema(entity) {
  return entity['length'] > 0 ? entity[0] : entity;
}

export interface ListRelationsResult {
  maxDepth: number;
  relations: string[];
}
export function listRelations(action: EntityInlineParentAction): ListRelationsResult {
  const res = {
    maxDepth: 0,
    relations: []
  };
  const parentEntitySchema = extractActionEntitySchema(action);
  if (!parentEntitySchema) {
    return res;
  }

  loop(res, action.includeRelations, parentEntitySchema.key, parentEntitySchema['schema']);
  return res;
}

function loop(res: ListRelationsResult, includeRelations: string[], parentEntitySchemaKey: string, parentEntitySchemaObj: string) {
  let haveDelved = false;
  Object.keys(parentEntitySchemaObj).forEach(key => {
    let value = parentEntitySchemaObj[key];
    value = value['length'] > 0 ? value[0] : value;
    const entityKey = value.key;
    const entitySchema = value['schema'];
    if (res.relations.indexOf(key) >= 0) {
      return;
    }

    if (value instanceof schema.Entity) {
      if (validRelation(parentEntitySchemaKey, entityKey, includeRelations)) {
        res.relations.push(key);
        haveDelved = true;
      }
      loop(res, includeRelations, entityKey, entitySchema);
    } else if (value instanceof Object) {
      loop(res, includeRelations, parentEntitySchemaKey, value);
    }
  });
  if (haveDelved) {
    res.maxDepth++;
  }
}

function validRelation(parentSchemaKey: string, childSchemaKey: string, includeRelations: string[] = []): boolean {
  return includeRelations.indexOf(`${parentSchemaKey}-${childSchemaKey}`) >= 0;
}

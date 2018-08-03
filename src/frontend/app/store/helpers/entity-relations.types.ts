import { Action, Store } from '@ngrx/store';

import { getPaginationKey } from '../actions/pagination.actions';
import { APIResponse } from '../actions/request.actions';
import { AppState, IRequestTypeState } from '../app-state';
import { PaginatedAction } from '../types/pagination.types';
import { IRequestAction } from '../types/request.types';
import { EntitySchema } from './entity-factory';

export class ValidateEntityRelationsConfig {
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
   * @type {IRequestTypeState}
   * @memberof ValidateEntityRelationsConfig
   */
  allEntities: IRequestTypeState;
  /**
   * Pagination store. Used to determine if we already have the entity/entites. This and allEntities make the inner loop code much easier
   * and quicker
   *
   * @type {IRequestTypeState}
   * @memberof ValidateEntityRelationsConfig
   */
  allPagination: IRequestTypeState;
  /**
   * New entities that have not yet made it into the store (as a result of being called mid-api handling). Used to determine if we already
   * have an entity/entities
   *
   * @type {IRequestTypeState}
   * @memberof ValidateEntityRelationsConfig
   */
  newEntities?: IRequestTypeState;
  /**
   * The action that has fetched the entity/entities
   *
   * @type {IRequestAction}
   * @memberof ValidateEntityRelationsConfig
   */
  action: IRequestAction;
  /**
   * Collection of entity (guids) whose children may be missing. For example a list of organizations that have missing spaces
   *
   * @type {string[]}
   * @memberof ValidateEntityRelationsConfig
   */
  parentEntities: string[];
  /**
   * If a child is missing, should we raise an action to fetch it?
   *
   * @memberof ValidateEntityRelationsConfig
   */
  populateMissing = true;
  /**
   * If we're validating an api request we'll have the apiResponse, otherwise it's null and we're ad hoc validating an entity/list
   *
   * @memberof ValidateEntityRelationsConfig
   */
  apiResponse: APIResponse;
}

export class EntityTree {
  rootRelation: EntityTreeRelation;
  requiredParamNames: string[];
  maxDepth?: number;
}

/**
 * A structure which represents the tree like layout of entity dependencies. For example organization --> space --> routes
 *
 * @export
 * @class EntityTreeRelation
 */
export class EntityTreeRelation {
  entityKey: string;

  /**
 * Creates an instance of EntityTreeRelation.
 * @param {EntitySchema} entity
 * @param {boolean} [isArray=false] is this a collection of entities (should be paginationed) or not
 * @param {string} paramName parameter name of the entity within the schema. For example `space` may be `spaces` (entity.spaces)
 * @param {string} [path=''] location of the entity within the parent. For example `space` entity maybe be `entity.spaces`
 * @param {EntityTreeRelation[]} childRelations
 * @memberof EntityTreeRelation
 */
  constructor(
    public entity: EntitySchema,
    public isArray = false,
    public paramName: string, // space/spaces
    public path = '', // entity.space
    public childRelations: EntityTreeRelation[]
  ) {
    this.entityKey = entity.key;
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
  parentEntitySchema: EntitySchema;
}

export function isEntityInlineChildAction(action: Action) {
  return action && !!action['parentGuid'] && !!action['parentEntitySchema'];
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

export function isEntityInlineParentAction(action: Action) {
  return action && !!action['includeRelations'] && action['populateMissing'] !== undefined;
}

export function createEntityRelationKey(parentKey: string, childKey) { return `${parentKey}-${childKey}`; }

export function createEntityRelationPaginationKey(parentSchemaKey: string, parentGuid = 'all', childSchemaRelation?: string) {
  let key = getPaginationKey(parentSchemaKey, parentGuid);
  // Usually, the above is enough to be unique, however in situations where there is more than one child with the same type we need to
  // expand this to include this child relation text
  // For instance
  // Fine - Space with a collection of routes (stored in pagination 'route' section as 'space-<guid>)
  // Fine - User with a collection of organizations (i.e is an org user of) (stored in pagination 'organization' section as 'user-<guid>')
  // Needs additional childSchemaRelation - User with a collection of organizations that they're billing manager of (stored in pagination
  // 'organization' section as 'user-<guid>-billing_managed_organizations')
  key += childSchemaRelation ? `-${childSchemaRelation}` : '';
  return key;
}

/**
 * The result of a validation run. Indicates if any separate api requests have been started and a promise firing when they have completed
 *
 * @export
 * @class ValidationResult
 */
export class ValidationResult {
  /**
   * True if data was missing an api requests have been kicked off to fetch
   *
   * @type {boolean}
   * @memberof ValidationResult
   */
  started: boolean;
  /**
   * Promise that fires when the api requests kicked off to fetch missing data have all completed
   *
   * @type {Promise<boolean[]>}
   * @memberof ValidationResult
   */
  completed: Promise<boolean[]>;

  /**
   * The new apiResponse. For the case of validating api calls this might be updated to ensure parent entities are associated with missing
   * children.
   *
   * @type {APIResponse}
   * @memberof ValidationResult
   */
  apiResponse?: APIResponse;
}

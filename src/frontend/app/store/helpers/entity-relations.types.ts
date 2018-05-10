import { Action } from '@ngrx/store';

import { IRequestAction } from '../types/request.types';
import { EntitySchema } from './entity-factory';


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

export function createEntityRelationPaginationKey(schemaKey: string, guid: string, childSchemaRelation?: string) {
  let key = `${schemaKey}-${guid}`;
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
}

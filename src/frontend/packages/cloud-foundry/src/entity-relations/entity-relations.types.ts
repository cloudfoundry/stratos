import { Action, Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { EntityCatalogEntityConfig } from '../../../store/src/entity-catalog/entity-catalog.types';
import { getPaginationKey } from '../../../store/src/actions/pagination.actions';
import { APIResponse } from '../../../store/src/actions/request.actions';
import { GeneralEntityAppState, GeneralRequestDataState, IRequestTypeState } from '../../../store/src/app-state';
import { EntityRequestAction } from '../../../store/src/types/request.types';
import { EntityTreeRelation } from './entity-relation-tree';

export class ValidateEntityRelationsConfig<T extends GeneralEntityAppState = GeneralEntityAppState> {
  /**
   * The guid of the cf. If this is null or not known we'll try to extract it from the list of parentEntities
   */
  cfGuid: string;
  store: Store<T>;
  /**
   * Entities store. Used to determine if we already have the entity/entities and to watch when fetching entities
   */
  allEntities: GeneralRequestDataState;
  /**
   * Pagination store. Used to determine if we already have the entity/entites. This and allEntities make the inner loop code much easier
   * and quicker
   */
  allPagination: IRequestTypeState;
  /**
   * New entities that have not yet made it into the store (as a result of being called mid-api handling). Used to determine if we already
   * have an entity/entities
   */
  newEntities?: IRequestTypeState;
  /**
   * The action that has fetched the entity/entities
   */
  action: EntityRequestAction;
  /**
   * Collection of entity (guids) whose children may be missing. For example a list of organizations that have missing spaces
   */
  parentEntities: string[];
  /**
   * If a child is missing, should we raise an action to fetch it?
   *
   */
  populateMissing = true;
  /**
   * If we're validating an api request we'll have the apiResponse, otherwise it's null and we're ad hoc validating an entity/list
   *
   */
  apiResponse: APIResponse;
}

export class EntityTree {
  rootRelation: EntityTreeRelation;
  requiredParamNames: string[];
  maxDepth?: number;
}

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

export const createEntityRelationKey = (parentEntityType: string, childEntityType: string) => `${parentEntityType}-${childEntityType}`;

/**
 * Helper interface. Actions with entities that are children of a parent entity should specify the parent guid.
 *
 * @export
 */
export interface EntityInlineChildAction {
  entityType: string;
  endpointType: string;
  parentGuid: string;
  parentEntityConfig: EntityCatalogEntityConfig;
  child?: EntityTreeRelation; // Not required on base actions
  endpointGuid: string;
}

export function isEntityInlineChildAction(anything: any): EntityInlineChildAction {
  const inlineChildAction = anything as EntityInlineChildAction;
  return inlineChildAction &&
    !!inlineChildAction.parentGuid &&
    !!inlineChildAction.parentEntityConfig
    ? inlineChildAction : null;
}

/**
 * Helper interface. Actions that are a parent of children entities should have these included parent-child relations
 *
 * @export
 * @extends {PaginatedAction}
 */
export interface EntityInlineParentAction extends EntityRequestAction {
  includeRelations: string[];
  populateMissing: boolean;
}

export function isEntityInlineParentAction(anything: any): EntityInlineParentAction {
  return anything && !!anything.includeRelations && anything.populateMissing !== undefined ? anything as EntityInlineParentAction : null;
}


/**
 * The result of a validation run. Indicates if any separate api requests have been started and a promise firing when they have completed
 *
 * @export
 */
export class ValidationResult {
  /**
   * True if data was missing an api requests have been kicked off to fetch
   */
  started: boolean;
  /**
   * Promise that fires when the api requests kicked off to fetch missing data have all completed. Contains the new apiResponse (for the
   * case of validating api calls this might be updated to ensure parent entities are associated with missing children).
   */
  completed: Promise<APIResponse>;
}

export interface ValidateResultFetchingState {
  fetching: boolean;
}

/**
 * An object to represent the action and status of a missing inline depth/entity relation.
 * @export
 */
export interface ValidateEntityResult {
  action: Action;
  fetchingState$?: Observable<ValidateResultFetchingState>;
  abortDispatch?: boolean;
}


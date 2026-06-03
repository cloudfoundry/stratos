import {
  EntityCatalogEntityConfig,
  getPaginationKey,
  EntityRequestAction,
} from '@stratosui/store';
import { EntityTreeRelation } from './entity-relation-tree';

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


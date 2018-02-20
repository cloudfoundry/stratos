import { Schema, schema } from 'normalizr';

import { pathGet } from '../../core/utils.service';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { APIResource, NormalizedResponse } from '../types/api.types';
import { PaginatedAction } from '../types/pagination.types';

/**
 * Provides a way for a collection of child entities to populate a parent entity with itself,.. or request child entities if missing
 *
 * @export
 * @class EntityRelationParent
 */
export class EntityRelationParent {
  /*
   * The entity key of the parent that should contain the child entities
   */
  parentEntityKey: string;
  /*
   * The entity key of the child that should be in the parent entity
   */
  childEntityKey: string;
  /*
   * Create a new parent entity that contains the child entities
   */
  createParentEntity: (state, parentGuid: string, response: NormalizedResponse) => APIResource;
  /*
   * An actiont that will fetch missing child entities
   */
  fetchChildrenAction: (resource: APIResource) => PaginatedAction;
}

/**
 * Defines an schema entity array which should exist as a parameter in a parent entity. For example a space array in a parent organisation.
 * Also provides a framework to populate a parent entity's parameter with itself
 *
 * @export
 * @class EntityInlineChild
 * @extends {schema.Array}
 */
export class EntityInlineChild extends schema.Array {
  constructor(
    public parentRelations: EntityRelationParent[],
    definition: Schema,
    schemaAttribute?: string | schema.SchemaFunction) {
    super(definition, schemaAttribute);
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

export const organisationSchemaKey = 'organization';
export const OrganisationSchema = new schema.Entity(organisationSchemaKey, {}, {
  idAttribute: getAPIResourceGuid
});

export const spaceSchemaKey = 'space';
export const SpaceSchema = new schema.Entity(spaceSchemaKey, {}, {
  idAttribute: getAPIResourceGuid
});


import { Schema, schema } from 'normalizr';

import { pathGet } from '../../core/utils.service';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { APIResource, NormalizedResponse } from '../types/api.types';
import { PaginatedAction } from '../types/pagination.types';

/**
 * Provides a way for a child entity to populate a parent entity with itself
 *
 * @export
 * @class EntityRelationParent
 */
export class EntityRelationParent {
  parentEntityKey: string;
  childEntityKey: string;
  mergeResult: (state, parentGuid: string, response: NormalizedResponse) => {
    parentGuid: string;
    newParentEntity: APIResource;
  };
  createAction: (resource: APIResource) => PaginatedAction; // TODO: RC Comment
}
// /**
//  * Provides a way for a parent entity to populate a child parameter
//  *
//  * @export
//  * @class EntityRelationChild
//  */
// export class EntityRelationChild {
//   path: string;
//   createAction: (resource: APIResource) => PaginatedAction;
// }

/**
 * Defines an entity array which should exist in as a parameter in a parent entity. For example a space array in an parent organisation.
 * Provides a framework to populate a parent entity's parameter with itself
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

// /**
//  * Defines an entity which should contain inline children. Provides a framework to fetch those if missing
//  * //TODO: RE
//  * @export
//  * @class EntityInlineParent
//  * @extends {schema.Entity}
//  */
// export class EntityInlineParent extends schema.Entity {
//   constructor(
//     // public childRelations: EntityRelationChild[],
//     key: string,
//     public definition: Schema,
//     options?: schema.EntityOptions) {
//     super(key, definition, options);
//   }
// }

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


import { Schema, schema } from 'normalizr';

import { getAPIResourceGuid } from '../selectors/api.selectors';
import { APIResource } from '../types/api.types';
import { PaginatedAction } from '../types/pagination.types';

export class EntityValidateParent {
  parentEntityKey: string;
  createPath: (resources: APIResource[]) => {
    parentPath: any
    childPropertyName: string
  };
}

export class EntityValidateInline {
  path: string;
  createAction: (resource: APIResource) => PaginatedAction;
}

export class EntityWithParent extends schema.Array {
  /**
   *
   */
  constructor(
    public parentValidation: EntityValidateParent[],
    definition: Schema,
    schemaAttribute?: string | schema.SchemaFunction) {
    super(definition, schemaAttribute);
  }

}

export class EntityWithInline extends schema.Entity {

  /**
   * Creates an instance of EntityWithInline.
   * @param {EntityValidateInline | EntityValidateParent[]} inlineValidation A collection defining the inline relationship of this entity.
   * Parent entities have parameters that must exist in the response (if missing dispatch the associated paginated action to fetch).
   * Child entities must populate a parent entity with their content at the associated param.//TODO:
   * @param {string} key
   * @param {Schema} [definition]
   * @param {schema.EntityOptions} [options]
   * @memberof EntityWithInline
   */
  constructor(
    public inlineValidation: EntityValidateInline[],
    key: string,
    definition?: Schema,
    options?: schema.EntityOptions) {
    super(key, definition, options);
  }

}

export const organisationSchemaKey = 'organization';
export const OrganisationSchema = new schema.Entity(organisationSchemaKey, {}, {
  idAttribute: getAPIResourceGuid
});

export const spaceSchemaKey = 'space';

export const SpaceSchema = new schema.Entity(spaceSchemaKey, {}, {
  idAttribute: getAPIResourceGuid
});
export const SpacesSchema = new EntityWithParent([
  {
    parentEntityKey: organisationSchemaKey,
    createPath: (spaces: APIResource[]) => {
      const space = spaces && spaces.length > 0 ? spaces[0] : null;
      if (!space) {
        return null;
      }
      const orgUrl = space.entity.organization_url;
      const guid = orgUrl.substring(orgUrl.lastIndexOf('/') + 1, orgUrl.length);
      return {
        parentPath: `${organisationSchemaKey}.${guid}.entity`,
        childPropertyName: 'spaces'
      };
    }
  }
], SpaceSchema);

import { Schema, schema } from 'normalizr';

import { getAPIResourceGuid } from '../selectors/api.selectors';
import { APIResource, NormalizedResponse } from '../types/api.types';
import { PaginatedAction } from '../types/pagination.types';
import { AppState } from '../app-state';
import { pathGet } from '../../core/utils.service';

export class EntityValidateParent {
  parentEntityKey: string;
  childEntityKey: string;
  mergeResult: (state, response: NormalizedResponse) => {
    parentGuid: string;
    newParentEntity: APIResource;
  };
}

export class EntityValidateInline {
  path: string;
  createAction: (resource: APIResource) => PaginatedAction;
}

export class EntityInlineParent extends schema.Array {
  // TODO: RC
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

export class EntityInline extends schema.Entity {

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
export const SpacesSchema = new EntityInlineParent([
  {
    parentEntityKey: organisationSchemaKey,
    childEntityKey: spaceSchemaKey,
    mergeResult: (state, response) => {
      // TODO: RC
      const spacesGuids = response.result;
      const space = spacesGuids && spacesGuids.length > 0 ? response.entities[spaceSchemaKey][spacesGuids[0]] : null;
      if (!space) {
        return null;
      }
      const orgUrl = space.entity.organization_url;
      const parentGuid = orgUrl.substring(orgUrl.lastIndexOf('/') + 1, orgUrl.length);
      const parentPath = `${organisationSchemaKey}.${parentGuid}`;
      const parentEntity = pathGet(parentPath, state);
      const newParentEntity = {
        ...parentEntity,
        entity: {
          ...parentEntity.entity,
          spaces: response.result
        }
      };
      return {
        parentGuid,
        newParentEntity
      };
    }
  }
], SpaceSchema);

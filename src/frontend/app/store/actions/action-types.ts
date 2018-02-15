import { schema, Schema } from 'normalizr';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { APIResource } from '../types/api.types';
import { PaginatedAction } from '../types/pagination.types';
import { GetAllOrganisationSpaces } from './organisation.actions';

export class ValidateInlineParam {
  path: string;
  createAction: (entity: APIResource) => PaginatedAction;
}

export class SchemaEntityWithInline extends schema.Entity {

  /**
   * Creates an instance of EntityWithInline.
   * @param {ValidateInlineParam[]} validateInline A collection of params that must exist in the response. If missing dispatch the
   * associated paginated action to fetch
   * @param {string} key
   * @param {Schema} [definition]
   * @param {schema.EntityOptions} [options]
   * @memberof EntityWithInline
   */
  constructor(public validateInline: ValidateInlineParam[], key: string, definition?: Schema, options?: schema.EntityOptions) {
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

export const SpaceWithOrganisationSchema = new schema.Entity(spaceSchemaKey, {
  entity: {
    organization: OrganisationSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });

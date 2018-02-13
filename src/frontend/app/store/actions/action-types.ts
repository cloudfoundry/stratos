import { schema } from 'normalizr';
import { getAPIResourceGuid } from '../selectors/api.selectors';

export const organisationSchemaKey = 'organization';
export const OrganisationSchema = new schema.Entity(
  organisationSchemaKey,
  {},
  {
    idAttribute: getAPIResourceGuid
  }
);

export const spaceSchemaKey = 'space';
export const SpaceSchema = new schema.Entity(
  spaceSchemaKey,
  {},
  {
    idAttribute: getAPIResourceGuid
  }
);

export const OrganisationWithSpaceSchema = new schema.Entity(
  organisationSchemaKey,
  {
    entity: {
      spaces: [SpaceSchema]
    }
  },
  {
    idAttribute: getAPIResourceGuid
  }
);

export const SpaceWithOrganisationSchema = new schema.Entity(
  spaceSchemaKey,
  {
    entity: {
      organization: OrganisationSchema
    }
  },
  {
    idAttribute: getAPIResourceGuid
  }
);

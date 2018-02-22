import { schema } from 'normalizr';

import { getAPIResourceGuid } from '../selectors/api.selectors';
import { RoutesSchema } from './space.actions';

export const organisationSchemaKey = 'organization';
export const OrganisationSchema = new schema.Entity(organisationSchemaKey, {}, {
  idAttribute: getAPIResourceGuid
});

export const spaceSchemaKey = 'space';

export const SpaceWithOrganisationSchema = new schema.Entity(spaceSchemaKey, {
  entity: {
    organization: OrganisationSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const RouteSchema = new schema.Entity('route', {}, {
  idAttribute: getAPIResourceGuid
});

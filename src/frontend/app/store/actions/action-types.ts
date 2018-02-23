import { schema } from 'normalizr';

import { getAPIResourceGuid } from '../selectors/api.selectors';
import { RoutesInSpaceSchema } from './space.actions';
import { DomainSchema } from './domains.actions';
import { ApplicationSchema } from './application.actions';

export const QuotaDefinitionSchema = new schema.Entity('quota_definition', {}, {
  idAttribute: getAPIResourceGuid
});

export const organisationSchemaKey = 'organization';
export const OrganisationSchema = new schema.Entity(organisationSchemaKey, {
  entity: {
    quota_definition: QuotaDefinitionSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const spaceSchemaKey = 'space';

export const SpaceWithOrganisationSchema = new schema.Entity(spaceSchemaKey, {
  entity: {
    apps: ApplicationSchema,
    organization: OrganisationSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const RouteSchema = new schema.Entity('route', {
  entity: {
    domain: DomainSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });

import { schema } from 'normalizr';

import { getAPIResourceGuid } from '../selectors/api.selectors';
import { ApplicationSchema } from './application.actions';

export const organisationSchemaKey = 'organization';
export const OrganisationSchema = new schema.Entity(organisationSchemaKey, {}, {
  idAttribute: getAPIResourceGuid
});

export const spaceSchemaKey = 'space';
export const SpaceSchema = new schema.Entity(spaceSchemaKey, {}, {
  idAttribute: getAPIResourceGuid
});

export const OrganisationWithSpaceSchema = new schema.Entity(organisationSchemaKey, {
  entity: {
    spaces: [SpaceSchema]
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const SpaceWithOrganisationSchema = new schema.Entity(spaceSchemaKey, {
  entity: {
    organization: OrganisationSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });


export const ServiceSchema = new schema.Entity('service', {}, {
  idAttribute: getAPIResourceGuid
}
);

export const ServiceBindingsSchema = new schema.Entity('serviceBinding', {}, {
  idAttribute: getAPIResourceGuid
}
);

export const ServicePlanSchema = new schema.Entity('servicePlan', {
  entity: {
    service: ServiceSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  }
);

export const ServiceInstancesSchema = new schema.Entity('serviceInstance', {
  entity: {
    service_plan: ServicePlanSchema,
    service_bindings: [ServiceBindingsSchema]
  }
}, {
    idAttribute: getAPIResourceGuid,
  }
);

export const ServiceInstanceSchemaWithServiceBinding = new schema.Entity('serviceInstance', {
  entity: {
    service_bindings: ServiceBindingsSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  }
);

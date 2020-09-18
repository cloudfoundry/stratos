import { Schema, schema } from 'normalizr';

import { EntitySchema } from '../../store/src/helpers/entity-schema';
import {
  applicationEntityType,
  cfUserEntityType,
  domainEntityType,
  organizationEntityType,
  privateDomainsEntityType,
  quotaDefinitionEntityType,
  routeEntityType,
  serviceBindingEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  servicePlanEntityType,
  spaceEntityType,
  stackEntityType,
} from './cf-entity-types';
import { CF_ENDPOINT_TYPE } from './cf-types';
import { getAPIResourceGuid } from './store/selectors/api.selectors';


export class CFEntitySchema extends EntitySchema {
  /**
   * @param entityKey As per schema.Entity ctor
   * @param [definition] As per schema.Entity ctor
   * @param [options] As per schema.Entity ctor
   * @param [relationKey] Allows multiple children of the same type within a single parent entity. For instance user with developer
   * spaces, manager spaces, auditor space, etc
   */
  constructor(
    entityKey: string,
    definition?: Schema,
    options?: schema.EntityOptions,
    relationKey?: string,
    excludeFromRecursiveDelete?: string[]
  ) {
    super(entityKey, CF_ENDPOINT_TYPE, definition, options, relationKey, null, excludeFromRecursiveDelete);
  }
}

export class CFOrgEntitySchema extends CFEntitySchema {
  constructor(
    definition?: Schema,
    relationKey?: string
  ) {
    super(organizationEntityType, definition, { idAttribute: getAPIResourceGuid }, relationKey, [
      domainEntityType,
      quotaDefinitionEntityType,
      privateDomainsEntityType
    ]);
  }
}

export class CFServiceBindingEntitySchema extends CFEntitySchema {
  constructor(
    definition?: Schema,
    relationKey?: string
  ) {
    super(serviceBindingEntityType, definition, { idAttribute: getAPIResourceGuid }, relationKey, [
      applicationEntityType,
      serviceInstancesEntityType,
      serviceEntityType
    ]);
  }
}

export class CFServiceInstanceEntitySchema extends CFEntitySchema {
  constructor(
    definition?: Schema,
    relationKey?: string
  ) {
    super(serviceInstancesEntityType, definition, { idAttribute: getAPIResourceGuid }, relationKey, [
      servicePlanEntityType,
      // Service bindings
      applicationEntityType,
      serviceInstancesEntityType,
      serviceEntityType
    ]);
  }
}

export class CFUserEntitySchema extends CFEntitySchema {
  constructor(
    definition: Schema = {},
    options: schema.EntityOptions = { idAttribute: getAPIResourceGuid },
    relationKey?: string
  ) {
    super(cfUserEntityType, definition, options, relationKey, [
      organizationEntityType,
      spaceEntityType
    ]);
  }
}

export class CFRouteEntitySchema extends CFEntitySchema {
  constructor(
    definition?: Schema,
    relationKey?: string
  ) {
    super(routeEntityType, definition, { idAttribute: getAPIResourceGuid }, relationKey, [
      domainEntityType,
      applicationEntityType,
      spaceEntityType
    ]);
  }
}

export class CFApplicationEntitySchema extends CFEntitySchema {
  constructor(
    definition: Schema = {},
    relationKey?: string
  ) {
    super(applicationEntityType, definition, { idAttribute: getAPIResourceGuid }, relationKey, [
      stackEntityType,
      spaceEntityType,
      routeEntityType,
      serviceBindingEntityType,
      serviceInstancesEntityType
    ]);
  }
}

export class CFSpaceEntitySchema extends CFEntitySchema {
  constructor(
    definition?: Schema,
    relationKey?: string
  ) {
    super(spaceEntityType, definition, { idAttribute: getAPIResourceGuid }, relationKey, [
      domainEntityType,
      // Service instance related
      serviceEntityType,
      servicePlanEntityType,
      // App Related
      stackEntityType
    ]);
  }
}

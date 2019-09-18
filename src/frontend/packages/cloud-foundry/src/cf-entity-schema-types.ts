import { Schema, schema } from 'normalizr';

import { EntitySchema } from '../../store/src/helpers/entity-schema';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import { getAPIResourceGuid } from './store/selectors/api.selectors';

export const applicationEntityType = 'application';
export const stackEntityType = 'stack';
export const spaceEntityType = 'space';
export const routeEntityType = 'route';
export const domainEntityType = 'domain';
export const organizationEntityType = 'organization';
export const quotaDefinitionEntityType = 'quota_definition';
export const appEventEntityType = 'applicationEvent';
export const cfInfoEntityType = 'cloudFoundryInfo';
export const cfUserEntityType = 'user';
export const appSummaryEntityType = 'applicationSummary';
export const appStatsEntityType = 'applicationStats';
export const appEnvVarsEntityType = 'environmentVars';
export const gitBranchesEntityType = 'gitBranches';
export const gitRepoEntityType = 'gitRepo';
export const gitCommitEntityType = 'gitCommits';
export const serviceEntityType = 'service';
export const serviceBindingEntityType = 'serviceBinding';
export const servicePlanEntityType = 'servicePlan';
export const serviceInstancesEntityType = 'serviceInstance';
export const buildpackEntityType = 'buildpack';
export const securityGroupEntityType = 'securityGroup';
export const featureFlagEntityType = 'featureFlag';
export const privateDomainsEntityType = 'private_domains';
export const spaceQuotaEntityType = 'space_quota_definition';
export const metricEntityType = 'metrics';
export const servicePlanVisibilityEntityType = 'servicePlanVisibility';
export const serviceBrokerEntityType = 'serviceBroker';
export const userProvidedServiceInstanceEntityType = 'userProvidedServiceInstance';

export const spaceWithOrgEntityType = 'spaceWithOrg';
export const serviceInstancesWithSpaceEntityType = 'serviceInstancesWithSpace';
export const serviceInstancesWithNoBindingsEntityType = 'serviceInstanceWithNoBindings';
export const serviceBindingNoBindingsEntityType = 'serviceBindingNoBindings';

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

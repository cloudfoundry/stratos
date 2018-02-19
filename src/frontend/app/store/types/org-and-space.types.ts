import { APIResource } from './api.types';
import { CfApplication } from './application.types';
import { Route } from './route.types';

export interface CfOrg {
  spaces: APIResource<CfSpace>[];
  quota_definition: APIResource<CfQuotaDefinition>;
  guid: string;
  cfGuid: string;
  name: string;
  private_domains: APIResource<CfPrivateDomain>[];
}

export interface CfPrivateDomain {
  guid: string;
  cfGuid: string;
}

export interface CfServiceInstance {
  guid: string;
  cfGuid; string;
}

export interface CfSpace {
  apps: APIResource<CfApplication>[];
  routes: APIResource<Route>[];
  domains: APIResource<any>[];
  auditors: APIResource<any>[];
  developers: APIResource<any>[];
  managers: APIResource<any>[];
  space_quota_definition?: APIResource<CfQuotaDefinition>;
  guid: string;
  cfGuid: string;
  service_instances: APIResource<CfServiceInstance>[];
}
export interface CfQuotaDefinition {
  memory_limit: number;
  app_instance_limit: number;
  instance_memory_limit: number;
  name: string;
  organization_guid?: string;
  total_services?: number;
  total_routes?: number;
  total_private_domains?: number;
}

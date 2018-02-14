import { APIResource } from './api.types';
import { CfApplication } from './application.types';
import { Route } from './route.types';

export interface CfOrg {
  spaces: APIResource<CfSpace>[];
  quota_definition: APIResource<CfQuotaDefinition>;
  guid: string;
  cfGuid: string;
}

export interface CfSpace {
  apps: APIResource<CfApplication>[];
  routes: APIResource<Route>[];
  domains: APIResource<any>[];
  auditors: APIResource<any>[];
  developers: APIResource<any>[];
  managers: APIResource<any>[];
  guid: string;
}
export interface CfQuotaDefinition {
  memory_limit: number;
  app_instance_limit; number;
  instance_memory_limit: number;
  name: string;
}

import { APIResource } from './api.types';

export interface CfOrg {
  spaces: string[];
  quota_definition: APIResource<CfQuotaDefinition>;
  guid: string;
  cfGuid: string;
}

export interface CfQuotaDefinition {
  memory_limit: number;
  app_instance_limit; number;
  instance_memory_limit: number;
  name: string;
}

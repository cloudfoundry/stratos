import { APIResource } from './api.types';

export interface CfServicePlan {
  action: boolean;
  bindable: boolean;
  description: string;
  extra: string;
  free: boolean;
  name: string;
  public: boolean;
  service: APIResource<CfService>;
  service_guid: string;
  unique_id: string;
}

export interface CfService {
  action: boolean;
  bindable: boolean;
  description: string;
  extra: string;
  label: string;
  info_url: string;
  long_description: string;
  plan_updateable: boolean;
  tags: string[];
  url: string;
  version: string;
}

export interface CfServiceInstance {
  guid: string;
  cfGuid; string;
  name: string;
  credentials: Object;
  dashboard_url: string;
  gateway_data: string;
  service_guid: string;
  service_plan_guid: string;
  space_guid: string;
  tags: string[];
  type: string;
  service_plan: APIResource<CfServicePlan>;
}

import { APIResource } from '../store/types/api.types';
import { IApp } from './cf-api.types';

export interface ILastOperation {
  type: string;
  state: string;
  description: string;
  updated_at: string;
  created_at: string;
}

export interface IServiceBinding {
  app_guid: string;
  service_instance_guid: string;
  credentials: any;
  binding_options: any;
  gateway_data?: any;
  gateway_name: string;
  syslog_drain_url?: any;
  volume_mounts: any[];
  app_url: string;
  app?: APIResource<IApp>;
  service_instance_url: string;
  service_instance?: APIResource<IServiceInstance>;
  guid?: string;
  cfGuid?: string;
}

export interface IServiceInstance {
  guid?: string;
  cfGuid?: string;
  name?: string;
  credentials?: any;
  service_plan_guid: string;
  space_guid: string;
  gateway_data?: any;
  dashboard_url: string;
  type: string;
  last_operation?: ILastOperation;
  tags?: string[];
  service_guid: string;
  space_url?: string;
  service_plan_url: string;
  service_plan?: APIResource<IServicePlan>;
  service_bindings_url: string;
  service_binding?: APIResource<IServiceBinding>[];
  service_keys_url: string;
  routes_url: string;
  service_url: string;
  service?: APIResource<IService>;
}

export interface IServicePlan {
  name: string;
  free: boolean;
  description: string;
  service_guid: string;
  extra: string;
  unique_id: string;
  public: boolean;
  bindable: number;
  active: boolean;
  service_url: string;
  service_instances_url: string;
  service?: APIResource<IService>;
}
export interface IService {
  label: string;
  description: string;
  active: number;
  bindable: number;
  unique_id: string;
  extra: string; // stringified IServiceExtra object
  tags: string[];
  requires: string[];
  service_broker_guid: string;
  plan_updateable: number;
  service_plans_url: string;
  service_plans: APIResource<IServicePlan>[];
}

export interface IServiceExtra {
  displayName: string;
  imageUrl: string;
  longDescription: string;
  providerDisplayName: string;
  documentationUrl: string;
  supportUrl: string;
}

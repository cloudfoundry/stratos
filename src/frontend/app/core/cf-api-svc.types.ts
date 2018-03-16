export interface IServiceInstance {
  guid: string;
  cfGuid: string;
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
  service_plans: IServicePlan[];
}

export interface IServiceExtra {
  displayName: string;
  imageUrl: string;
  longDescription: string;
  providerDisplayName: string;
  documentationUrl: string;
  supportUrl: string;
}

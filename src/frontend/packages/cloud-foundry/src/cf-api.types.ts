import { APIResource } from '../../store/src/types/api.types';
import { IService, IServiceBinding } from './cf-api-svc.types';
import { CfUser } from './store/types/cf-user.types';

export interface StratosCFEntity {
  cfGuid: string;
}

export interface IQuotaDefinition {
  guid?: string;
  name: string;
  organization_guid?: string;
  app_instance_limit: number;
  app_task_limit?: number;
  memory_limit: number;
  instance_memory_limit: number;
  total_services: number;
  total_service_keys?: number;
  non_basic_services_allowed?: boolean;
  trial_db_allowed?: boolean;
  total_routes: number;
  total_reserved_route_ports?: number;
  total_private_domains?: number;
}

export interface IRoute {
  host: string;
  path: string;
  domain_guid: string;
  space_guid: string;
  service_instance_guid?: any;
  port?: any;
  domain_url: string;
  domain?: APIResource<IDomain>;
  space_url: string;
  space?: APIResource<ISpace>;
  apps_url: string;
  apps?: APIResource<IApp>[];
  route_mappings_url: string;
  guid?: string;
  cfGuid?: string;
}

/**
 * Different routes interface to cover the non-standard entity returned from a app summary request
 */
export interface IAppSummaryRoute {
  domain: IDomain;
  guid: string;
  host: string;
  path: string;
  port?: any;
}

export interface ISpace {
  name: string;
  organization_guid: string;
  space_quota_definition_guid?: any;
  isolation_segment_guid?: any;
  allow_ssh: boolean;
  organization_url: string;
  organization?: APIResource<IOrganization>;
  developers_url: string;
  developers?: APIResource<IDeveloper>[];
  managers_url: string;
  managers?: APIResource<IDeveloper>[];
  auditors_url: string;
  auditors?: any[];
  apps_url: string;
  apps?: APIResource<IApp>[];
  routes_url: string;
  domains_url: string;
  domains?: APIResource<IDomain>[];
  service_instances_url: string;
  service_instances?: any[];
  app_events_url: string;
  events_url?: string;
  security_groups_url: string;
  security_groups?: APIResource<ISecurityGroup>[];
  staging_security_groups_url: string;
  staging_security_groups?: APIResource<ISecurityGroup>[];
  space_quota_definition?: APIResource<ISpaceQuotaDefinition>;
  routes?: APIResource<IRoute>[];
  cfGuid?: string;
  guid?: string;
}

export interface ISecurityGroup {
  name: string;
  rules: IRule[];
  running_default: boolean;
  staging_default: boolean;
  spaces_url: string;
  spaces?: APIResource<ISpace>[];
  staging_spaces_url: string;
}

export enum IRuleType {
  all = 'all',
  tcp = 'tcp',
  udp = 'udp'
}
export interface IRule {
  destination: string;
  protocol: string;
  ports?: string;
}

export interface IApp<T = unknown> {
  name: string;
  production?: boolean;
  space_guid: string;
  stack_guid?: string;
  buildpack?: any;
  detected_buildpack?: string;
  detected_buildpack_guid?: string;
  environment_json?: IEnvironmentjson;
  enable_ssh?: boolean;
  memory?: number;
  instances?: number;
  disk_quota?: number;
  state?: string;
  version?: string;
  command?: any;
  console?: boolean;
  debug?: any;
  staging_task_id?: string;
  package_state?: string;
  health_check_type?: string;
  health_check_timeout?: any;
  health_check_http_endpoint?: any;
  staging_failed_reason?: any;
  staging_failed_description?: any;
  diego?: boolean;
  docker_image?: any;
  docker_credentials?: IDockercredentials;
  package_updated_at?: string;
  detected_start_command?: string;
  allow_ssh?: boolean;
  ports?: number[];
  service_bindings?: APIResource<IServiceBinding>[];
  routes?: T extends string ? string[] : APIResource<IRoute>[];
  stack?: T extends string ? string : APIResource<IStack>;
  space?: T extends string ? string : APIResource<ISpace>;
  space_url?: string;
  stack_url?: string;
  routes_url?: string;
  events_url?: string;
  service_bindings_url?: string;
  route_mappings_url?: string;
  cfGuid?: string;
  guid?: string;
}

export interface IDockercredentials {
  username?: any;
  password?: any;
}

export interface IEnvironmentjson {
  [key: string]: string;
}

export interface IDeveloper {
  admin: boolean;
  active: boolean;
  default_space_guid?: any;
  spaces_url: string;
  organizations_url: string;
  managed_organizations_url: string;
  billing_managed_organizations_url: string;
  audited_organizations_url: string;
  managed_spaces_url: string;
  audited_spaces_url: string;
}

export interface IOrganization<T = unknown> {
  name: string;
  billing_enabled?: boolean;
  quota_definition_guid?: string;
  status?: string;
  default_isolation_segment_guid?: any;
  quota_definition_url?: string;
  spaces_url?: string;
  domains?: APIResource<IDomain>[];
  domains_url?: string;
  private_domains_url?: string;
  users?: APIResource<CfUser>[];
  users_url?: string;
  managers?: APIResource<CfUser>[];
  managers_url?: string;
  billing_managers?: APIResource<CfUser>[];
  billing_managers_url?: string;
  auditors?: APIResource<CfUser>[];
  auditors_url?: string;
  app_events_url?: string;
  space_quota_definitions_url?: string;
  guid?: string;
  cfGuid?: string;
  spaces?: T extends string ? T[] : APIResource<ISpace>[];
  private_domains?: APIResource<IPrivateDomain>[];
  quota_definition?: T extends string ? T : APIResource<IOrgQuotaDefinition>;
}

export interface IDomain {
  name: string;
  router_group_guid?: string;
  router_group_type?: string;
  owning_organization_guid?: string;
  owning_organization_url?: string;
  shared_organizations_url?: string;
}

export interface ICfV2Info {
  name: string;
  build: string;
  support: string;
  version: number;
  description: string;
  authorization_endpoint: string;
  token_endpoint: string;
  min_cli_version?: any;
  min_recommended_cli_version?: any;
  api_version: string;
  app_ssh_endpoint: string;
  app_ssh_host_key_fingerprint: string;
  app_ssh_oauth_client: string;
  routing_endpoint: string;
  doppler_logging_endpoint: string;
}

export interface IStack {
  name: string;
  description: string;
}

export interface IBuildpack {
  name: string;
  position: number;
  enabled: boolean;
  locked: boolean;
  filename: string;
}

export interface IFeatureFlag {
  name: string;
  enabled: boolean;
  url?: string;
  error_message?: string;
  cfGuid?: string;
  guid?: string;
}
export interface IStack {
  name: string;
  description: string;
}

export interface IBuildpack {
  name: string;
  position: number;
  enabled: boolean;
  locked: boolean;
  filename: string;
}

export interface IPrivateDomain {
  guid?: string;
  cfGuid?: string;
}

interface IBaseQuotaDefinition {
  memory_limit: number;
  app_instance_limit: number;
  instance_memory_limit: number;
  name: string;
  total_services?: number;
  total_routes?: number;
  total_private_domains?: number;
  non_basic_services_allowed?: boolean;
  app_task_limit: number;
  total_service_keys: number;
  total_reserved_route_ports: number;
  guid?: string;
  cfGuid?: string;
}

export interface IOrgQuotaDefinition extends IBaseQuotaDefinition {
  trial_db_allowed: boolean;
}

export interface ISpaceQuotaDefinition extends IBaseQuotaDefinition {
  organization_guid?: string;
  organization_url?: string;
  spaces_url?: string;
}

export interface IUpdateSpace {
  name?: string;
  organization_guid?: string;
  developer_guids?: string[];
  manager_guids?: string[];
  auditor_guids?: string[];
  domain_guids?: string[];
  security_group_guids?: string[];
  allow_ssh?: boolean;
  isolation_segment_guid?: string;
  space_quota_definition_guid?: string;
}

export interface IUpdateOrganization {
  name?: string;
  status?: string;
  quota_definition_guid?: string;
  default_isolation_segment_guid?: string;
}

export interface IAppSummary {
  guid: string;
  name: string;
  routes: IAppSummaryRoute[];
  running_instances: number;
  services: IService[];
  available_domains: IDomain[];
  production: boolean;
  space_guid: string;
  stack_guid: string;
  buildpack?: any;
  detected_buildpack: string;
  detected_buildpack_guid: string;
  environment_json: {};
  memory: number;
  instances: number;
  disk_quota: number;
  state: string;
  version: string;
  command?: any;
  console: boolean;
  debug?: any;
  staging_task_id: string;
  package_state: string;
  health_check_type: string;
  health_check_timeout?: any;
  health_check_http_endpoint: string;
  staging_failed_reason?: any;
  staging_failed_description?: any;
  diego: boolean;
  docker_image?: any;
  package_updated_at: Date;
  detected_start_command: string;
  enable_ssh: boolean;
  ports?: any;
}


export interface CfEvent {
  type: string;
  actor: string;
  actor_type: string;
  actor_name: string;
  actee: string;
  actee_type: string;
  actee_name: string;
  timestamp: string;
  metadata: { [name: string]: any };
  space_guid?: string;
  organization_guid?: string;
}

export enum CFFeatureFlagTypes {
  user_org_creation = 'user_org_creation',
  private_domain_creation = 'private_domain_creation',
  app_bits_upload = 'app_bits_upload',
  app_scaling = 'app_scaling',
  route_creation = 'route_creation',
  service_instance_creation = 'service_instance_creation',
  diego_docker = 'diego_docker',
  set_roles_by_username = 'set_roles_by_username',
  unset_roles_by_username = 'unset_roles_by_username',
  task_creation = 'task_creation',
  env_var_visibility = 'env_var_visibility',
  space_scoped_private_broker_creation = 'space_scoped_private_broker_creation',
  space_developer_env_var_visibility = 'space_developer_env_var_visibility',
  service_instance_sharing = 'service_instance_sharing',
}
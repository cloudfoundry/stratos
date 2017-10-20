export type AppMetadataType = 'instances' | 'environmentVars' | 'summary';

export interface AppMetadataInfo {
  metadata: any;
  metadataRequestState: AppMetadataRequestState;
}

export interface AppMetadataRequestStates {
  [key: string]: {
    instances: AppMetadataRequestState;
    environmentVars: AppMetadataRequestState;
  };
}

export interface MetadataUpdateState {
  busy: boolean;
  error: boolean;
  message: string;
}

export interface AppMetadataRequestState {
  fetching: MetadataUpdateState;
  updating: MetadataUpdateState;
  creating: MetadataUpdateState;
  error: boolean;
  message: string;
}


export interface MetadataState {
  values: AppMetadata;
  requests: {};
}

export interface AppMetadata {
  [key: string]: {
    instances: AppInstancesState;
    environmentVars: AppEnvVarsState;
    summary: any;
  };
}

export interface AppInstancesState {
  [key: string]: AppInstanceState;
}

export interface AppInstanceState {
  state: string;
  stats: AppInstanceStats;
}

export interface AppInstanceStats {
  disk_quota: number;
  fds_quota: number;
  host: string;
  mem_quota: number;
  name: string;
  port: number;
  uptime: number;
  uris: string[];
  usage: AppInstanceUsage;
}

export interface AppInstanceUsage {
  cpu: number;
  disk: number;
  mem: number;
  time: string;
}

export interface AppEnvVarsState {
  application_env_json?: any;
  environment_json?: {
    STRATOS_PROJECT?: any;
  };
  running_env_json?: any;
  staging_env_json?: any;
  system_env_json?: any;
}


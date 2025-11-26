export interface AppStats {
  [key: string]: AppStat;
}

export interface AppStat {
  cfGuid: string;
  guid: string;
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
  application_env_json?: Record<string, unknown>;
  environment_json?: {
    STRATOS_PROJECT?: unknown;
  };
  running_env_json?: Record<string, unknown>;
  staging_env_json?: Record<string, unknown>;
  system_env_json?: Record<string, unknown>;
  name?: string;
}

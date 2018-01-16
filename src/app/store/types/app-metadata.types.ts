import { schema } from 'normalizr';
import { getAPIResourceGuid } from '../selectors/api.selectors';

// export type AppMetadataType = 'instances' | 'environmentVars' | 'summary';

// export interface AppMetadataInfo {
//   metadata: any;
//   metadataRequestState: AppMetadataRequestState;
// }

// export interface AppMetadataRequestStates {
//   [key: string]: {
//     instances: AppMetadataRequestState;
//     environmentVars: AppMetadataRequestState;
//   };
// }

// export interface MetadataUpdateState {
//   busy: boolean;
//   error: boolean;
//   message: string;
// }

// export interface AppMetadataRequestState {
//   fetching: MetadataUpdateState;
//   updating: MetadataUpdateState;
//   creating: MetadataUpdateState;
//   error: boolean;
//   message: string;
// }


// export interface MetadataState {
//   values: AppMetadata;
//   requests: {};
// }

// export interface AppMetadata {
//   [key: string]: {
//     instances: AppInstancesState;
//     environmentVars: AppEnvVarsState;
//     summary: any;
//   };
// }

// TODO: REMOVE
export const AppMetadataEntityKeysTODORE = {
  INSTANCES: 'instances',
  ENV_VARS: 'environmentVars',
  SUMMARY: 'summary'
};

export const AppSummarySchema = new schema.Entity('summary');

export interface AppSummary {

}

export const AppStatSchema = new schema.Entity('stats', {

}, {
    idAttribute: (a) => {
      console.log(a);
      return getAPIResourceGuid(a);
    }
  });
export const AppStatsSchema = new schema.Array(AppStatSchema);

export interface AppStats {
  [key: string]: AppStat;
}

export interface AppStat {
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

export const AppEnvVarSchema = new schema.Entity('environmentVars');
export const AppEnvVarsSchema = new schema.Array(AppEnvVarSchema);

export interface AppEnvVarsState {
  application_env_json?: any;
  environment_json?: {
    STRATOS_PROJECT?: any;
  };
  running_env_json?: any;
  staging_env_json?: any;
  system_env_json?: any;
  name?: any;
}

// export interface AppEnvVars {
//   staging_env_json?: any;
//   running_env_json?: any;
//   environment_json?: {
//     STRATOS_PROJECT?: any;
//   };
//   system_env_json?: any;
//   credentials?: any;
//   syslog_drain_url?: any;
//   volume_mounts?: any;
//   label?: string;
//   provider?: string;
//   plan?: string;
//   name?: string;
//   tags?: string[];
// }

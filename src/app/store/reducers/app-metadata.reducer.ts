import { AppMetadataTypes } from '../actions/app-metadata.actions';
import { mergeState } from './../helpers/reducer.helper';
import { AppMetadataRequestStates } from './app-metadata-request.reducer';

export interface MetadataState {
  values: AppMetadata;
  requests: {};
}

export interface AppMetadata {
  [key: string]: {
    instances: AppInstancesState;
    environmentVars: AppEnvVarsState;
  };
}

export interface AppInstancesState {
  [key: string]: AppInstanceState;
}

export interface AppInstanceState {
  state: string;
  stats: AppInstanceStats[];
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

export const defaultMetadataState = {

};

export function appMetadataReducer(state: AppMetadata = defaultMetadataState, action) {
  switch (action.type) {
    case AppMetadataTypes.APP_METADATA_SUCCESS:
      return setAppMetadataState(state, action.metadata, action.appMetadataAction);
    default:
      return state;
  }
}

function setAppMetadataState(state, metadata, { metadataType, guid }): AppMetadata {
  const newState = {
    [guid]: {
      [metadataType]: metadata
    }
  };
  return mergeState(state, newState);
}


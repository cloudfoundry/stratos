import { mergeState } from './../helpers/reducer.helper';
import { EntitiesState } from './entity.reducer';
import { ApiActionTypes } from './../actions/api.actions';
import { Action } from '@ngrx/store';
import { APP_METADATA, APP_METADATA_SUCCESS, APP_METADATA_FAILED } from '../actions/app-metadata.actions';

export interface AppMetadata {
  [key: string]: {
    summary: any;
    instances: any;
    environmentVars: any;
  };
}

// export interface AppInstancesState {
//   [key: string]: AppInstanceState;
// }

// export interface AppInstanceState {
//   state: string;
//   stats: AppInstanceStats[];
// }

// export interface AppInstanceStats {
//   disk_quota: number;
//   fds_quota: number;
//   host: string;
//   mem_quota: number;
//   name: string;
//   port: number;
//   uptime: number;
//   uris: string[];
//   usage: AppInstanceUsage;
// }

// export interface AppInstanceUsage {
//   cpu: number;
//   disk: number;
//   mem: number;
//   time: string;
// }

export const defaultMetadataState = {
};

export const defaultMetadata = {
  summary: {},
  instances: {},
  environmentVars: {}
};

export function appMetadataReducer(state: AppMetadata = defaultMetadataState, action) {
  switch (action.type) {
    case APP_METADATA:
      return state;
    case APP_METADATA_SUCCESS:
      return mergeState(state, action.response.entities);
    case APP_METADATA_FAILED:
      return state;
    default:
      return state;
  }
}


import { Observable, Subject } from 'rxjs';
import { WritableSignal } from '@angular/core';

import {
  IActionMonitorComponentState,
} from '../../../../core/src/shared/components/app-action-monitor-icon/app-action-monitor-icon.component';
import { RowState } from '../../../../core/src/shared/components/signal-list/row-state.types';
import { EndpointAuthTypeConfig } from '../../../../store/src/extension-types';
import { ActionStatus } from './../../../../store/src/types/entity-pipeline.types';

// Type alias for signal wrapper with BehaviorSubject compatibility
// Accepts either Subject<T> OR WritableSignal<T> with BehaviorSubject API methods
type SignalOrSubject<T> = Subject<T> | (WritableSignal<T> & {
  next: (value: T) => void;
  getValue: () => T;
  asObservable: () => Observable<T>;
});

// Types for a Kubernetes Configuration file

export interface KubeConfigFileCluster {
  name: string;
  cluster: {
    'certificate-authority': string;
    'certificate-authority-data': string;
    'insecure-skip-tls-verify': boolean;
    server: string;
  };
  // Selected user to import
  _user: string;
  _users: KubeConfigFileUser[];
  // _onUpdate: (row) => {};
  // Is the cluster selected for import?
  _selected: boolean;
  // Is this cluster invalid? i.e. requires more information
  _invalid: boolean;
  // row state - accepts either Subject or Signal wrapper
  _state: SignalOrSubject<RowState>;
  // status of import
  _status: string;
  // guid of the existing endpoint for this cluster
  _guid: string;
  // subtype
  _subType?: string;
  // additional info is required in order to connect, hints at register only, though is specific due to warning message
  _additionalUserInfo: boolean;
  // unique identifier
  _id: string;
}

export interface KubeConfigFileUser {
  name: string;
  user: KubeConfigFileUserDetail;
  _authData: KubeConfigImportAuthConfig;
}

export interface KubeConfigFileUserDetail {
  'client-certificate'?: string;
  'client-key'?: string;
  'client-certificate-data'?: string;
  'client-key-data'?: string;
  token?: string;
  exec?: {
    apiVersion?: string;
    command?: string;
    args?: string[];
    env?: { name: string; value: string }[];
  };
  username?: string;
  password?: string;
}

export interface KubeConfigFileContext {
  name: string;
  context: {
    cluster: string;
    user: string;
  };
}

export interface KubeConfigFile {
  apiVersion: string;
  clusters: KubeConfigFileCluster[];
  contexts: KubeConfigFileContext[];
  'current-context': string;
  kind: string;
  users: KubeConfigFileUser[];
}

export interface KubeConfigImportAction {
  action: string;
  description: string;
  cluster: KubeConfigFileCluster;
  user?: KubeConfigFileUser;
  status?: ActionStatus;
  // state and actionState - accept either Subject or Signal wrapper for gradual migration
  state: SignalOrSubject<RowState>;
  actionState$?: Observable<IActionMonitorComponentState>;
  actionState: SignalOrSubject<IActionMonitorComponentState>;
  depends?: KubeConfigImportAction;
}

export interface KubeImportState {
  busy: boolean;
  error: boolean;
  completed: boolean;
  message: string;
}

export interface EndpointConfig {
  type: string;
  authTypes: EndpointAuthTypeConfig[];
}

export interface KubeConfigImportAuthConfig {
  subType: string;
  authType: string;
  values: { [key: string]: string, };
}

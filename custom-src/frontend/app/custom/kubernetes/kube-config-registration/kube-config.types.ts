import { Observable, Subject } from 'rxjs';

import { EndpointAuthTypeConfig } from '../../../core/extension/extension-types';
import { RowState } from '../../../shared/components/list/data-sources-controllers/list-data-source-types';
import { ActionStatus } from './../../../../../store/src/reducers/api-request-reducer/types';

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
  // row state
  _state: Subject<RowState>;
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
  exec?: any
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
  state: Subject<RowState>;
  actionState$?: Observable<any>;
  actionState: Subject<any>;
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
  values: { [key: string]: string };
}

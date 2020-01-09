import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { KubeService } from '../../kubernetes/store/kube.types';

export interface MonocularRepository {
  name: string;
  url: string;
  created: string;
  syncInterval: number;
  lastSync: number;
  status: string;
}

export interface MonocularChart {
  id: string;
  name: string;
  attributes: {
    description: string;
    home: string;
    icon: string;
    keywords: string[];
    repo: {
      name: string;
      url: string;
    };
  };
  relationships: {
    latestChartVersion: {
      data: {
        version: string
      }
    }
  };
}

export interface HelmRelease {
  endpointId: string;
  guid: string;
  name: string;
  namespace: string;
  version: string;
  status: string;
  lastDeployed: Date;
  firstDeployed: Date;
  info: {
    last_deployed: Date;
    first_deployed: Date;
    notes: string;
    status: string;
  };
  config: any;
  chart: {
    values: any;
    metadata: {
      icon?: string;
    };
  };
}

export interface HelmReleaseStatus {
  endpointId?: string;
  releaseTitle?: string;
  data: {
    'v1/Pod': {
      [key: string]: {
        age: string;
        name: string;
        ready: string;
        restarts: string;
        status: string;
      }
    }
    'v1/Service': {
      [key: string]: {
        name: string;
      }
    },
    [dataKey: string]: any
  };
  fields: string[];
  pods: any;
}

export interface HelmReleasePod {
  endpointId: string;
  releaseTitle: string;
  name: string;
  ready: string;
  status: string;
  restarts: string;
  age: string;
}

export interface HelmReleaseService {
  endpointId: string;
  releaseTitle: string;
  name: string;
  metadata: any;
  spec: any;
  kubeService$?: Observable<KubeService>;
}

export interface HelmReleaseGraph {
  endpointId: string;
  releaseTitle: string;
}

export type HelmReleaseResource = any;

export function isHelmReleaseService(obj: any): HelmReleaseService {
  if (obj && obj.kubeService$) {
    return obj as HelmReleaseService;
  }
}

export interface HelmVersion {
  endpointId: string;
  Version?: {
    git_commit: string;
    git_tree_state: string;
    sem_ver: string;
  };
}

export enum HelmStatus {
  Unknown = 0,
  Deployed = 1,
  Deleted = 2,
  Superseded = 3,
  Failed = 4,
  Deleting = 5,
  Pending_Install = 6,
  Pending_Upgrade = 7,
  Pending_Rollback = 8
}

@Injectable()
export class HelmReleaseGuid {
  guid: string;
}

export interface HelmInstallValues {
  endpoint: string;
  releaseName: string;
  releaseNamespace: string;
  values: string;
  chart: string;
}

export const HELM_INSTALLING_KEY = 'installing';


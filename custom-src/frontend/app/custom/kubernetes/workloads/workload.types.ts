import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { KubeService } from '../store/kube.types';

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
  kubeService$?: Observable<KubeService>;
  metadata: any;
  spec: any;
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

@Injectable()
export class HelmReleaseGuid {
  guid: string;
}

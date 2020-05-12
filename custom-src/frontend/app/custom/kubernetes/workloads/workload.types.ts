import { Injectable } from '@angular/core';

import { KubernetesPod, KubeService } from '../store/kube.types';

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

export interface HelmReleaseEntity {
  endpointId: string;
  releaseTitle: string;
}

export interface HelmReleasePod extends HelmReleaseEntity, KubernetesPod {
  // endpointId: string;
  // releaseTitle: string;
  // name: string;
  // ready: string;
  // status: string;
  // restarts: string;
  // age: string;
}

export interface HelmReleaseService extends HelmReleaseEntity, KubeService {
  // endpointId: string;
  // releaseTitle: string;
  // name: string;
  //kubeService$?: Observable<KubeService>; // TODO: RC ??
  // metadata: any;
  // spec: any;
}

export interface HelmReleaseGraph extends HelmReleaseEntity {
  // endpointId: string;
  // releaseTitle: string;
  nodes: {};
  links: {};
}

export type HelmReleaseResource = any;

@Injectable()
export class HelmReleaseGuid {
  guid: string;
}

export interface HelmReleaseChartData {
  podsChartData: { name: string; value: any; }[];
  containersChartData: { name: string; value: any; }[];
}
